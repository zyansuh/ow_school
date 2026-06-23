import { prisma } from '@/lib/prisma';
import { syncUserGuildData, syncUserGuildDataBestEffort } from '@/lib/discord-guild';
import { syncAllTeacherStudentCounts } from '@/lib/teacher-counts';
import { resolveTeacherForUser } from '@/lib/teacher-auth';

export type DiscordSyncReport = {
  usersSynced: number;
  usersFailed: number;
  teachersRecounted: number;
  teacherLinksVerified: number;
  teacherLinkMismatches: Array<{ userId: string; discordId: string; expectedTeacherId: string | null; actualTeacherId: string | null }>;
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

  const teachers = await prisma.teacher.findMany({
    where: { discordUserId: null, discord: { not: null } },
    select: { id: true, discord: true },
  });
  for (const t of teachers) {
    const match = await prisma.user.findFirst({
      where: { discordUsername: { equals: t.discord!, mode: 'insensitive' } },
      select: { discordId: true },
    });
    if (match) {
      await prisma.teacher.update({
        where: { id: t.id },
        data: { discordUserId: match.discordId },
      });
    }
  }

  const teacherLinksVerified: DiscordSyncReport['teacherLinkMismatches'] = [];
  const teacherUsers = await prisma.user.findMany({
    where: { adminRole: null },
    select: {
      id: true,
      discordId: true,
      discordUsername: true,
      discordRoleNames: true,
      teacherId: true,
    },
  });

  for (const u of teacherUsers) {
    const resolved = await resolveTeacherForUser(u);
    if (!resolved && !u.teacherId) continue;
    if (resolved?.id !== u.teacherId) {
      teacherLinksVerified.push({
        userId: u.id,
        discordId: u.discordId,
        expectedTeacherId: resolved?.id ?? null,
        actualTeacherId: u.teacherId,
      });
    }
  }

  return {
    usersSynced,
    usersFailed,
    teachersRecounted: teacherCounts.length,
    teacherLinksVerified: teacherUsers.length,
    teacherLinkMismatches: teacherLinksVerified,
  };
}

/** 단일 사용자 — 닉네임 변경 후 discordId 기준으로 프로필만 갱신 */
export async function refreshUserGuildProfileByDiscordId(discordUserId: string) {
  return syncUserGuildData(discordUserId);
}
