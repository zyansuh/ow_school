import { prisma } from '@/lib/prisma';
import { isTeacherFromDiscordRoles } from '@/lib/user-header';
import { parseRoleNames } from '@/lib/discord-guild';

export async function findTeacherForDiscordUser(discordUsername: string) {
  return prisma.teacher.findFirst({
    where: { discord: { equals: discordUsername, mode: 'insensitive' } },
    include: { class: true },
  });
}

export async function resolveTeacherForUser(user: {
  id: string;
  discordUsername: string;
  discordRoleNames?: string | null;
}) {
  const byDiscord = await findTeacherForDiscordUser(user.discordUsername);
  if (byDiscord) return byDiscord;

  const roles = parseRoleNames(user.discordRoleNames);
  if (isTeacherFromDiscordRoles(roles)) {
    return prisma.teacher.findFirst({ include: { class: true } });
  }
  return null;
}
