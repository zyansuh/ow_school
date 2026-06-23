import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/user-display';

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { discordId: { contains: q } },
          { discordUsername: { contains: q, mode: 'insensitive' } },
          { discordNickname: { contains: q, mode: 'insensitive' } },
          { discordServerNick: { contains: q, mode: 'insensitive' } },
          { displayNickname: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: { adminRole: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        discordId: u.discordId,
        discordUsername: u.discordUsername,
        discordNickname: u.discordNickname,
        discordServerNick: u.discordServerNick,
        displayName: adminUserDisplayName(normalizeNickFields(u)),
        isAdmin: !!u.adminRole,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
