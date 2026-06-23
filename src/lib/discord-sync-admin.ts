import { prisma } from '@/lib/prisma';
import { syncUserGuildDataBestEffort } from '@/lib/discord-guild';
import { syncAllTeacherStudentCounts, countActiveStudentsForTeacher } from '@/lib/teacher-counts';
import { resolveTeacherEntityForUser } from '@/lib/teacher/identity';
import { userDisplayName, normalizeNickFields } from '@/lib/user-display';

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

  let usersSynced = 0;
  let usersFailed = 0;

  for (const user of users) {
    try {
      await syncUserGuildDataBestEffort(user.discordId);
      usersSynced += 1;
    } catch {
      usersFailed += 1;
    }
  }

  const teacherCounts = await syncAllTeacherStudentCounts();

  const teachersWithoutUserId = await prisma.teacher.findMany({
    where: { discordUserId: null },
    select: { id: true, name: true, discord: true },
  });

  for (const t of teachersWithoutUserId) {
    if (!t.discord) continue;
    const match = await prisma.user.findFirst({
      where: { discordUsername: { equals: t.discord, mode: 'insensitive' } },
      select: { discordId: true },
    });
    if (match) {
      await prisma.teacher.update({
        where: { id: t.id },
        data: { discordUserId: match.discordId },
      });
    }
  }

  const teacherLinkMismatches: TeacherLinkMismatch[] = [];
  const teacherUsers = await prisma.user.findMany({
    where: { adminRole: null },
    select: {
      id: true,
      discordId: true,
      discordUsername: true,
      discordNickname: true,
      discordServerNick: true,
      discordRoleNames: true,
      teacherId: true,
      teacher: { select: { id: true, name: true } },
    },
  });

  const teacherNameMap = Object.fromEntries(
    (await prisma.teacher.findMany({ select: { id: true, name: true } })).map((t) => [t.id, t.name]),
  );

  for (const u of teacherUsers) {
    const resolved = await resolveTeacherEntityForUser(u);
    if (!resolved && !u.teacherId) continue;
    if (resolved?.id !== u.teacherId) {
      teacherLinkMismatches.push({
        userId: u.id,
        discordId: u.discordId,
        displayName: userDisplayName(normalizeNickFields(u)),
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

  const studentCountMismatches: StudentCountMismatch[] = [];
  for (const t of allTeachers) {
    const live = await countActiveStudentsForTeacher(t.id);
    if (live !== t.currentStudents) {
      studentCountMismatches.push({
        teacherId: t.id,
        teacherName: t.name,
        cachedCount: t.currentStudents,
        liveCount: live,
      });
    }
  }

  const stillMissing = await prisma.teacher.findMany({
    where: { discordUserId: null },
    select: { id: true, name: true, discord: true },
  });

  return {
    usersSynced,
    usersFailed,
    teachersRecounted: teacherCounts.length,
    teacherLinksVerified: teacherUsers.length,
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
