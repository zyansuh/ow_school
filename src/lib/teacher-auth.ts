import { prisma } from '@/lib/prisma';

/** Discord User ID(discordId)로만 Teacher 조회 */
export async function findTeacherByDiscordUserId(discordUserId: string) {
  return prisma.teacher.findFirst({
    where: { discordUserId },
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
