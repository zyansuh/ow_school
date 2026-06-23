import { prisma } from '@/lib/prisma';

const DISCORD_SNOWFLAKE = /^\d{17,20}$/;

function isSnowflake(value: string) {
  return DISCORD_SNOWFLAKE.test(value.trim());
}

/**
 * 로그인·동기화 시 Teacher.discordUserId 백필.
 * 레거시 Teacher.discord(유저네임 또는 잘못 저장된 ID)를 Discord User ID로 연결합니다.
 */
export async function backfillTeacherDiscordUserId(
  discordUserId: string,
  discordUsername: string,
) {
  const linked = await prisma.teacher.findFirst({
    where: { discordUserId },
    include: { class: true },
  });
  if (linked) return linked;

  const bySnowflake = await prisma.teacher.updateMany({
    where: { discordUserId: null, discord: discordUserId },
    data: { discordUserId },
  });
  if (bySnowflake.count > 0) {
    return prisma.teacher.findFirst({
      where: { discordUserId },
      include: { class: true },
    });
  }

  const candidates = await prisma.teacher.findMany({
    where: {
      discordUserId: null,
      discord: { not: null },
    },
    select: { id: true, discord: true },
  });

  const username = discordUsername.trim().toLowerCase();
  const match = candidates.find((t) => {
    const raw = t.discord?.trim() ?? '';
    if (!raw) return false;
    if (isSnowflake(raw)) return raw === discordUserId;
    return raw.toLowerCase() === username;
  });

  if (!match) return null;

  await prisma.teacher.update({
    where: { id: match.id },
    data: { discordUserId },
  });

  return prisma.teacher.findUnique({
    where: { id: match.id },
    include: { class: true },
  });
}

/** 관리자 동기화: 로그인 이력이 있는 유저 기준으로 미연결 선생님 일괄 백필 */
export async function backfillAllTeacherDiscordUserIds() {
  const before = await prisma.teacher.count({ where: { discordUserId: null } });
  const users = await prisma.user.findMany({
    select: { discordId: true, discordUsername: true },
  });

  for (const u of users) {
    await backfillTeacherDiscordUserId(u.discordId, u.discordUsername);
  }

  const after = await prisma.teacher.count({ where: { discordUserId: null } });
  return before - after;
}
