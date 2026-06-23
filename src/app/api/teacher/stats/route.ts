import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireTeacherUser } from '@/lib/api-helpers';
import {
  buildMonthlyCounts,
  lastMonths,
  mergeMonthlyStats,
} from '@/lib/monthly-stats';
import { parseRoleNames } from '@/lib/discord-guild';
import { userDisplayName } from '@/lib/user-display';

export async function GET() {
  try {
    const { teacher } = await requireTeacherUser();
    const months = lastMonths(6);

    const [students, applications, interviews, classes] = await Promise.all([
      prisma.user.findMany({
        where: { teacherId: teacher.id, status: 'active', adminRole: null },
        include: { class: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.findMany({
        where: { teacherId: teacher.id },
        select: { createdAt: true },
      }),
      prisma.interview.findMany({
        where: { teacherId: teacher.id },
        select: { createdAt: true },
      }),
      prisma.class.findMany({
        where: { id: teacher.classId },
        include: {
          _count: {
            select: {
              users: {
                where: {
                  teacherId: teacher.id,
                  status: 'active',
                  adminRole: null,
                },
              },
            },
          },
        },
      }),
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
        className: teacher.class?.name ?? '',
        currentStudents: students.length,
        maxStudents: teacher.maxStudents,
      },
      stats: {
        totalStudents: students.length,
        byClass: Object.fromEntries(classes.map((c) => [c.name, c._count.users])),
        monthlyApplications,
        monthlyInterviews,
      },
      students: students.map((u) => ({
        id: u.id,
        nickname: userDisplayName(u),
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
