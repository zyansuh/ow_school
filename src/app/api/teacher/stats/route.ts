import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireTeacherUser } from '@/lib/api-helpers';
import {
  buildMonthlyCounts,
  lastMonths,
  mergeMonthlyStats,
} from '@/lib/monthly-stats';
import { parseRoleNames } from '@/lib/discord-guild';
import { normalizeNickFields, userDisplayName } from '@/lib/user-display';
import { findAssignedStudentsForTeacher } from '@/lib/student-users';
import { countActiveStudentsForTeacher } from '@/lib/teacher-counts';

export async function GET() {
  try {
    const { teacher } = await requireTeacherUser();
    const months = lastMonths(6);

    const [students, applications, interviews, activeCount] = await Promise.all([
      findAssignedStudentsForTeacher(teacher.id),
      prisma.application.findMany({
        where: { teacherId: teacher.id },
        select: { createdAt: true },
      }),
      prisma.interview.findMany({
        where: { teacherId: teacher.id },
        select: { createdAt: true },
      }),
      countActiveStudentsForTeacher(teacher.id),
    ]);

    const monthlyApplications = await mergeMonthlyStats(
      buildMonthlyCounts(applications, months),
      'applications',
    );
    const monthlyInterviews = await mergeMonthlyStats(
      buildMonthlyCounts(interviews, months),
      'interviews',
    );

    const className = teacher.class?.name ?? '';
    const byClass = className ? { [className]: activeCount } : {};

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        activityDays: (() => {
          try {
            return teacher.activityDays ? JSON.parse(teacher.activityDays) : [];
          } catch {
            return [];
          }
        })(),
        activityTimeSlot: teacher.activityTimeSlot,
        className,
        currentStudents: activeCount,
        maxStudents: teacher.maxStudents,
      },
      stats: {
        totalStudents: activeCount,
        byClass,
        monthlyApplications,
        monthlyInterviews,
      },
      students: students.map((u) => ({
        id: u.id,
        nickname: userDisplayName(normalizeNickFields(u)),
        discord: u.discordUsername,
        className: u.class?.name ?? '미배정',
        roleNames: parseRoleNames(u.discordRoleNames),
        status: u.status,
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
