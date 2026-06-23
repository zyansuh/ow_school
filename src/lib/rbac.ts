import { prisma } from '@/lib/prisma';
import { DEFAULT_ADMIN_USERNAMES } from '@/lib/constants';

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await prisma.adminRole.findUnique({ where: { userId } });
  return !!role;
}

export async function requireAdmin(userId: string) {
  const admin = await isAdmin(userId);
  if (!admin) throw new Error('FORBIDDEN');
  return true;
}

export async function ensureDefaultAdmin(discordUsername: string, userId: string) {
  const normalized = discordUsername.toLowerCase();
  const isDefault = DEFAULT_ADMIN_USERNAMES.some((u) => u.toLowerCase() === normalized);
  if (!isDefault) return;

  await prisma.adminRole.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function grantAdmin(targetUserId: string, grantedById: string) {
  await requireAdmin(grantedById);
  return prisma.adminRole.upsert({
    where: { userId: targetUserId },
    create: { userId: targetUserId, grantedById },
    update: { grantedById },
  });
}

export async function revokeAdmin(targetUserId: string, revokedById: string) {
  await requireAdmin(revokedById);
  return prisma.adminRole.delete({ where: { userId: targetUserId } });
}
