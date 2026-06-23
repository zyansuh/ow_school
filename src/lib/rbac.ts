import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_ADMIN_USERNAMES } from '@/lib/constants';

export async function isAdmin(userId: string, client: PrismaClient = prisma): Promise<boolean> {
  const role = await client.adminRole.findUnique({ where: { userId } });
  return !!role;
}

export async function requireAdmin(userId: string) {
  const admin = await isAdmin(userId);
  if (!admin) throw new Error('FORBIDDEN');
  return true;
}

export async function ensureDefaultAdmin(
  discordUsername: string,
  userId: string,
  client: PrismaClient = prisma,
) {
  const normalized = discordUsername.toLowerCase();
  const isDefault = DEFAULT_ADMIN_USERNAMES.some((u) => u.toLowerCase() === normalized);
  if (!isDefault) return;

  await client.adminRole.upsert({
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
