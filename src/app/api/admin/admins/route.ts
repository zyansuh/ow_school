import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();

    const roles = await prisma.adminRole.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      roles.map((r) => ({
        id: r.id,
        userId: r.userId,
        displayName: adminUserDisplayName(normalizeNickFields(r.user)),
        discordId: r.user.discordId,
        serverNick: r.user.discordServerNick,
        roleNames: parseRoleNames(r.user.discordRoleNames),
        isInGuild: r.user.isInGuild,
        grantedAt: r.createdAt,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
