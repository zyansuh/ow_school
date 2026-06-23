import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import {
  buildMonthlyCounts,
  lastMonths,
  mergeMonthlyStats,
} from '@/lib/monthly-stats';

export async function GET() {
  try {
    await requireAdminUser();

    const months = lastMonths(6);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalStudents, totalTeachers, monthlyApplicationCount, classes, applications, interviews] =
      await Promise.all([
        prisma.user.count({
          where: { status: 'active', adminRole: null },
        }),
        prisma.teacher.count({ where: { isActive: true } }),
        prisma.application.count({
          where: { createdAt: { gte: monthStart } },
        }),
        prisma.class.findMany({
          include: {
            _count: {
              select: {
                users: {
                  where: { adminRole: null, status: { not: 'graduated' } },
                },
              },
            },
          },
        }),
        prisma.application.findMany({ select: { createdAt: true } }),
        prisma.interview.findMany({ select: { createdAt: true } }),
      ]);

    const monthlyApplications = await mergeMonthlyStats(
      buildMonthlyCounts(applications, months),
      'applications',
    );
    const monthlyInterviews = await mergeMonthlyStats(
      buildMonthlyCounts(interviews, months),
      'interviews',
    );

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        monthlyApplicationCount,
        byClass: Object.fromEntries(classes.map((c) => [c.name, c._count.users])),
        monthlyApplications,
        monthlyInterviews,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
