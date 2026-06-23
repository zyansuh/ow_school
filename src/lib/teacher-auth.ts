import { prisma } from '@/lib/prisma';
import { isTeacherFromDiscordRoles } from '@/lib/user-header';
import { parseRoleNames } from '@/lib/discord-guild';

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

export async function resolveTeacherForUser(user: {
  id: string;
  discordId: string;
  discordUsername: string;
  discordRoleNames?: string | null;
}) {
  const byDiscordId = await findTeacherByDiscordUserId(user.discordId);
  if (byDiscordId) return byDiscordId;

  const byUsername = await findTeacherForDiscordUsername(user.discordUsername);
  if (byUsername) {
    if (!byUsername.discordUserId) {
      await prisma.teacher.update({
        where: { id: byUsername.id },
        data: { discordUserId: user.discordId },
      });
    }
    return byUsername;
  }

  const roles = parseRoleNames(user.discordRoleNames);
  if (isTeacherFromDiscordRoles(roles)) {
    return prisma.teacher.findFirst({ include: { class: true } });
  }
  return null;
}
