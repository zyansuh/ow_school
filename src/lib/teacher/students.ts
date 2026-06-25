import { prisma } from '@/lib/prisma';
import { normalizeNickFields, userDisplayName } from '@/lib/users/display';
import { parseClubNames } from '@/lib/interviews/utils';
import { filterStudentUsers, isStudentUser, loadUserRoleContext } from '@/lib/users/role';

export type TeacherStudentRow = {
  id: string;
  serverNickname: string;
  className: string;
  applicationDate: string | null;
  status: string;
  isGraduated: boolean;
  hasInterview: boolean;
  lastUpdatedAt: string;
};

export type TeacherStudentStats = {
  totalStudents: number;
  graduatedCount: number;
  pendingGraduationCount: number;
  interviewCompletedCount: number;
  interviewPendingCount: number;
};

export type TeacherStudentDetail = {
  id: string;
  serverNickname: string;
  globalDisplayName: string | null;
  discordUsername: string;
  teacherName: string;
  className: string;
  status: string;
  isGraduated: boolean;
  application: {
    id: string;
    status: string;
    playTimeSlot: string | null;
    createdAt: string;
    className: string;
  } | null;
  interview: {
    id: string;
    contentExperience: string;
    memorablePerson: string;
    joinedClub: boolean;
    clubNames: string[];
    createdAt: string;
  } | null;
  points: Array<{
    id: string;
    pointType: string;
    pointAmount: number;
    createdAt: string;
  }>;
  lastUpdatedAt: string;
};

async function collectStudentIds(teacherId: string): Promise<string[]> {
  const ctx = await loadUserRoleContext();
  const [active, interviews, applications] = await Promise.all([
    prisma.user.findMany({
      where: { teacherId, adminRole: null },
      include: { adminRole: true },
    }),
    prisma.interview.findMany({
      where: { teacherId },
      select: { userId: true },
    }),
    prisma.application.findMany({
      where: { teacherId, userId: { not: null } },
      select: { userId: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const u of filterStudentUsers(active, ctx)) ids.add(u.id);

  const extraIds = new Set<string>();
  for (const iv of interviews) extraIds.add(iv.userId);
  for (const app of applications) {
    if (app.userId) extraIds.add(app.userId);
  }

  if (!extraIds.size) return Array.from(ids);

  const extras = await prisma.user.findMany({
    where: { id: { in: Array.from(extraIds) }, adminRole: null },
    include: { adminRole: true },
  });
  for (const u of filterStudentUsers(extras, ctx)) ids.add(u.id);

  return Array.from(ids);
}

function maxDate(...dates: (Date | null | undefined)[]): Date {
  const valid = dates.filter((d): d is Date => d instanceof Date);
  if (!valid.length) return new Date(0);
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

export async function getTeacherStudents(teacherId: string) {
  const studentIds = await collectStudentIds(teacherId);
  if (!studentIds.length) {
    return {
      stats: {
        totalStudents: 0,
        graduatedCount: 0,
        pendingGraduationCount: 0,
        interviewCompletedCount: 0,
        interviewPendingCount: 0,
      } satisfies TeacherStudentStats,
      students: [] as TeacherStudentRow[],
    };
  }

  const ctx = await loadUserRoleContext();
  const users = filterStudentUsers(
    await prisma.user.findMany({
      where: { id: { in: studentIds }, adminRole: null },
      include: {
        class: true,
        adminRole: true,
        applications: {
          where: { teacherId },
          include: { class: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        interviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    ctx,
  );

  const students: TeacherStudentRow[] = users.map((u) => {
    const app = u.applications[0];
    const interview = u.interviews[0];
    const className = u.class?.name ?? app?.class?.name ?? interview?.className ?? '미배정';

    return {
      id: u.id,
      serverNickname: userDisplayName(normalizeNickFields(u)),
      className,
      applicationDate: app?.createdAt.toISOString() ?? u.createdAt.toISOString(),
      status: u.status,
      isGraduated: u.status === 'graduated',
      hasInterview: !!interview,
      lastUpdatedAt: maxDate(u.updatedAt, app?.updatedAt, interview?.createdAt).toISOString(),
    };
  });

  const graduatedCount = students.filter((s) => s.isGraduated).length;
  const interviewCompletedCount = students.filter((s) => s.hasInterview).length;

  return {
    stats: {
      totalStudents: students.length,
      graduatedCount,
      pendingGraduationCount: students.length - graduatedCount,
      interviewCompletedCount,
      interviewPendingCount: students.length - interviewCompletedCount,
    } satisfies TeacherStudentStats,
    students,
  };
}

export async function getTeacherStudentDetail(teacherId: string, studentId: string) {
  const studentIds = await collectStudentIds(teacherId);
  if (!studentIds.includes(studentId)) return null;

  const [user, teacher] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      include: {
        adminRole: true,
        class: true,
        teacher: true,
        applications: {
          where: { teacherId },
          include: { class: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        interviews: { orderBy: { createdAt: 'desc' }, take: 1 },
        pointHistories: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.teacher.findUnique({ where: { id: teacherId } }),
  ]);

  if (!user || !isStudentUser(user, await loadUserRoleContext())) return null;

  const app = user.applications[0];
  const interview = user.interviews[0];
  const className =
    user.class?.name ?? app?.class?.name ?? interview?.className ?? '미배정';

  return {
    id: user.id,
    serverNickname: userDisplayName(normalizeNickFields(user)),
    globalDisplayName: user.discordNickname,
    discordUsername: user.discordUsername,
    teacherName: user.teacher?.name ?? teacher?.name ?? '미배정',
    className,
    status: user.status,
    isGraduated: user.status === 'graduated',
    application: app
      ? {
          id: app.id,
          status: app.status,
          playTimeSlot: app.playTimeSlot,
          createdAt: app.createdAt.toISOString(),
          className: app.class?.name ?? className,
        }
      : null,
    interview: interview
      ? {
          id: interview.id,
          contentExperience: interview.contentExperience,
          memorablePerson: interview.memorablePerson,
          joinedClub: interview.joinedClub,
          clubNames: parseClubNames(interview.clubNames),
          createdAt: interview.createdAt.toISOString(),
        }
      : null,
    points: user.pointHistories.map((p) => ({
      id: p.id,
      pointType: p.pointType,
      pointAmount: p.pointAmount,
      createdAt: p.createdAt.toISOString(),
    })),
    lastUpdatedAt: maxDate(user.updatedAt, app?.updatedAt, interview?.createdAt).toISOString(),
  } satisfies TeacherStudentDetail;
}
