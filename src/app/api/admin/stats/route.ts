import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import {
  buildMonthlyCounts,
  lastMonths,
  mergeMonthlyStats,
} from '@/lib/monthly-stats';
import { countActiveStudents } from '@/lib/student-users';
import { filterStudentUsers, loadUserRoleContext } from '@/lib/user-role';

export async function GET() {
  try {
    await requireAdminUser();

    const months = lastMonths(6);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const roleCtx = await loadUserRoleContext();

    const [totalStudents, totalTeachers, monthlyApplicationCount, classes, applications, interviews] =
      await Promise.all([
        countActiveStudents(roleCtx),
        prisma.teacher.count({ where: { isActive: true } }),
        prisma.application.count({
          where: { createdAt: { gte: monthStart } },
        }),
        prisma.class.findMany({
          include: {
            users: {
              where: { adminRole: null, status: { not: 'graduated' } },
              include: { adminRole: true },
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
        byClass: Object.fromEntries(
          classes.map((c) => [c.name, filterStudentUsers(c.users, roleCtx).length]),
        ),
        monthlyApplications,
        monthlyInterviews,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
