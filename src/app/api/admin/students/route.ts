import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { normalizeNickFields, adminUserDisplayName, guildNicknameOnly } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      where: { adminRole: null, status: { not: 'graduated' } },
      include: { class: true, teacher: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      users.map((u) => {
        const fields = normalizeNickFields(u);
        return {
          id: u.id,
          discordId: u.discordId,
          nickname: adminUserDisplayName(fields),
          guildNickname: guildNicknameOnly(fields) ?? '-',
          displayNickname: u.displayNickname,
          discord: u.discordUsername,
          serverNick: u.discordServerNick,
          roleNames: parseRoleNames(u.discordRoleNames),
          isInGuild: u.isInGuild,
          className: u.class?.name ?? '미배정',
          teacherId: u.teacherId,
          teacherName: u.teacher?.name ?? '-',
          status: u.status,
          createdAt: u.createdAt,
        };
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
