import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { adminUserDisplayName, guildNicknameOnly, normalizeNickFields, teacherDiscordLabel } from '@/lib/user-display';

function mapAdminSearchUser(u: {
  id: string;
  discordId: string;
  discordUsername: string;
  discordNickname: string | null;
  discordServerNick: string | null;
  displayNickname: string | null;
  adminRole: unknown;
}) {
  const fields = normalizeNickFields(u);
  return {
    id: u.id,
    discordId: u.discordId,
    discordUsername: u.discordUsername,
    discordNickname: u.discordNickname,
    discordServerNick: u.discordServerNick,
    serverNickname: guildNicknameOnly(fields),
    discordLabel: teacherDiscordLabel(fields),
    displayName: adminUserDisplayName(fields),
    isAdmin: !!u.adminRole,
  };
}

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

    return NextResponse.json(users.map(mapAdminSearchUser));
  } catch (e) {
    return apiError(e);
  }
}
