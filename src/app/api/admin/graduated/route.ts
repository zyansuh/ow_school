import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { userDisplayName } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      where: { adminRole: null, status: 'graduated' },
      include: {
        class: true,
        teacher: true,
        applications: {
          where: { status: 'approved' },
          include: { class: true, teacher: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        nickname: userDisplayName(u),
        discord: u.discordUsername,
        className: u.applications[0]?.class?.name ?? u.class?.name ?? '미배정',
        teacherName: u.applications[0]?.teacher?.name ?? u.teacher?.name ?? '-',
        roleNames: parseRoleNames(u.discordRoleNames),
        graduatedAt: u.updatedAt,
        createdAt: u.createdAt,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
