import { prisma } from '@/lib/prisma';

/** Discord User ID(discordId) 우선, 레거시 discord 필드(유저네임) 폴백 */
export async function findTeacherByDiscordUserId(discordUserId: string) {
  return prisma.teacher.findFirst({
    where: { discordUserId },
    include: { class: true },
  });
}

export async function findTeacherForDiscordUsername(discordUsername: string) {
  return prisma.teacher.findFirst({
    where: { discord: { equals: discordUsername, mode: 'insensitive' } },
    include: { class: true },
  });
}

export async function assertDiscordUserIdAvailable(discordUserId: string, excludeTeacherId?: string) {
  const existing = await prisma.teacher.findFirst({
    where: {
      discordUserId,
      ...(excludeTeacherId ? { NOT: { id: excludeTeacherId } } : {}),
    },
    select: { id: true, name: true },
  });
  if (existing) {
    throw new Error(`DISCORD_USER_ID_TAKEN:${existing.name}`);
  }
}
