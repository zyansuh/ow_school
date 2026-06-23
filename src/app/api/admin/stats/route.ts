import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdminUser();

    const [totalStudents, totalTeachers, pendingApplications, classes, users] = await Promise.all([
      prisma.user.count({ where: { status: 'active' } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.application.count({ where: { status: 'pending' } }),
      prisma.class.findMany({ include: { _count: { select: { users: true } } } }),
      prisma.user.findMany({
        include: { class: true, teacher: true, applications: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        pendingApplications,
        byClass: Object.fromEntries(classes.map((c) => [c.name, c._count.users])),
      },
      users: users.map((u) => ({
        id: u.id,
        nickname: u.discordNickname || u.discordUsername,
        discord: u.discordUsername,
        className: u.class?.name ?? '미배정',
        teacherName: u.teacher?.name ?? '-',
        status: u.applications[0]?.status ?? u.status,
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
