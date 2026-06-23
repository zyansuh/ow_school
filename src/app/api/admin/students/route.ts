import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { normalizeNickFields, userDisplayName } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      where: { adminRole: null, status: { not: 'graduated' } },
      include: { class: true, teacher: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        nickname: userDisplayName(normalizeNickFields(u)),
        discord: u.discordUsername,
        serverNick: u.discordServerNick,
        siteDisplayName: u.siteDisplayName,
        roleNames: parseRoleNames(u.discordRoleNames),
        isInGuild: u.isInGuild,
        className: u.class?.name ?? '미배정',
        teacherName: u.teacher?.name ?? '-',
        status: u.status,
        createdAt: u.createdAt,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
