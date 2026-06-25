import { prisma } from '@/lib/prisma';
import { syncUserGuildDataBestEffort } from '@/lib/discord/guild';
import { syncAllTeacherStudentCounts, getActiveStudentCountsByTeacher } from '@/lib/teacher/counts';
import { mapWithConcurrency } from '@/lib/utils/async';
import { resolveTeacherEntityForUser } from '@/lib/teacher/identity';
import { backfillAllTeacherDiscordUserIds } from '@/lib/teacher/discord-link';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import { isTeacherUser, loadUserRoleContext } from '@/lib/users/role';

export type TeacherLinkMismatch = {
  userId: string;
  discordId: string;
  displayName: string;
  expectedTeacherId: string | null;
  expectedTeacherName: string | null;
  actualTeacherId: string | null;
  actualTeacherName: string | null;
};

export type StudentCountMismatch = {
  teacherId: string;
  teacherName: string;
  cachedCount: number;
  liveCount: number;
};

export type TeacherDiscordLinkGap = {
  teacherId: string;
  teacherName: string;
  discordUsername: string | null;
};

export type DiscordSyncReport = {
  usersSynced: number;
  usersFailed: number;
  teachersDiscordLinked: number;
  teachersRecounted: number;
  teacherLinksVerified: number;
  teacherLinkMismatches: TeacherLinkMismatch[];
  studentCountMismatches: StudentCountMismatch[];
  teachersMissingDiscordUserId: TeacherDiscordLinkGap[];
  schemaChecks: {
    teacherDiscordUserIdColumn: boolean;
  };
};

export async function runAdminDiscordSync(): Promise<DiscordSyncReport> {
  const users = await prisma.user.findMany({
    select: { id: true, discordId: true, teacherId: true },
  });

  const syncResults = await mapWithConcurrency(users, 10, async (user) => {
    try {
      await syncUserGuildDataBestEffort(user.discordId);
      return true;
    } catch {
      return false;
    }
  });
  const usersSynced = syncResults.filter(Boolean).length;
  const usersFailed = syncResults.length - usersSynced;

  const teachersDiscordLinked = await backfillAllTeacherDiscordUserIds();

  const teacherCounts = await syncAllTeacherStudentCounts();

  const teacherLinkMismatches: TeacherLinkMismatch[] = [];
  const roleCtx = await loadUserRoleContext();
  const teacherUsers = await prisma.user.findMany({
    select: {
      id: true,
      discordId: true,
      discordUsername: true,
      discordNickname: true,
      discordServerNick: true,
      discordRoleNames: true,
      teacherId: true,
      adminRole: true,
      teacher: { select: { id: true, name: true } },
    },
  });

  const teacherNameMap = Object.fromEntries(
    (await prisma.teacher.findMany({ select: { id: true, name: true } })).map((t) => [t.id, t.name]),
  );

  for (const u of teacherUsers) {
    const isTeacher = isTeacherUser(u, roleCtx);
    const resolved = await resolveTeacherEntityForUser(u);
    if (!isTeacher && !resolved && !u.teacherId) continue;
    if (resolved?.id !== u.teacherId) {
      teacherLinkMismatches.push({
        userId: u.id,
        discordId: u.discordId,
        displayName: adminUserDisplayName(normalizeNickFields(u)),
        expectedTeacherId: resolved?.id ?? null,
        expectedTeacherName: resolved?.name ?? null,
        actualTeacherId: u.teacherId,
        actualTeacherName: u.teacherId ? teacherNameMap[u.teacherId] ?? null : null,
      });
    }
  }

  const allTeachers = await prisma.teacher.findMany({
    select: { id: true, name: true, currentStudents: true, discordUserId: true, discord: true },
  });

  const liveCounts = await getActiveStudentCountsByTeacher();
  const studentCountMismatches: StudentCountMismatch[] = allTeachers
    .filter((t) => (liveCounts[t.id] ?? 0) !== t.currentStudents)
    .map((t) => ({
      teacherId: t.id,
      teacherName: t.name,
      cachedCount: t.currentStudents,
      liveCount: liveCounts[t.id] ?? 0,
    }));

  const stillMissing = await prisma.teacher.findMany({
    where: { discordUserId: null },
    select: { id: true, name: true, discord: true },
  });

  return {
    usersSynced,
    usersFailed,
    teachersDiscordLinked,
    teachersRecounted: teacherCounts.length,
    teacherLinksVerified: teacherUsers.filter((u) => isTeacherUser(u, roleCtx)).length,
    teacherLinkMismatches,
    studentCountMismatches,
    teachersMissingDiscordUserId: stillMissing.map((t) => ({
      teacherId: t.id,
      teacherName: t.name,
      discordUsername: t.discord,
    })),
    schemaChecks: {
      teacherDiscordUserIdColumn: true,
    },
  };
}

export async function fixTeacherLinkForUser(userId: string, teacherId: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: { teacherId },
  });
}
