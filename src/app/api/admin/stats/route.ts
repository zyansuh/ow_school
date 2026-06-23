import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { userDisplayName } from '@/lib/user-display';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(count: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

export async function GET() {
  try {
    await requireAdminUser();

    const [totalStudents, totalTeachers, pendingApplications, classes, users, applications, interviews] =
      await Promise.all([
        prisma.user.count({ where: { status: 'active' } }),
        prisma.teacher.count({ where: { isActive: true } }),
        prisma.application.count({ where: { status: 'pending' } }),
        prisma.class.findMany({ include: { _count: { select: { users: true } } } }),
        prisma.user.findMany({
          include: { class: true, teacher: true, applications: { orderBy: { createdAt: 'desc' }, take: 1 } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.application.findMany({ select: { createdAt: true } }),
        prisma.interview.findMany({ select: { createdAt: true } }),
      ]);

    const months = lastMonths(6);
    const appByMonth = Object.fromEntries(months.map((m) => [m, 0]));
    const interviewByMonth = Object.fromEntries(months.map((m) => [m, 0]));

    for (const a of applications) {
      const k = monthKey(new Date(a.createdAt));
      if (k in appByMonth) appByMonth[k]++;
    }
    for (const iv of interviews) {
      const k = monthKey(new Date(iv.createdAt));
      if (k in interviewByMonth) interviewByMonth[k]++;
    }

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        pendingApplications,
        byClass: Object.fromEntries(classes.map((c) => [c.name, c._count.users])),
        monthlyApplications: months.map((m) => ({ month: m, count: appByMonth[m] })),
        monthlyInterviews: months.map((m) => ({ month: m, count: interviewByMonth[m] })),
      },
      users: users.map((u) => ({
        id: u.id,
        nickname: userDisplayName(u),
        discord: u.discordUsername,
        serverNick: u.discordServerNick,
        roleNames: parseRoleNames(u.discordRoleNames),
        isInGuild: u.isInGuild,
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
