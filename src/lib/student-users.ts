import { prisma } from '@/lib/prisma';
import {
  filterStudentUsers,
  loadUserRoleContext,
  type UserRoleContext,
} from '@/lib/user-role';

type StudentUserInclude = {
  class: true;
  teacher: true;
  adminRole: true;
};

const activeStudentBaseWhere = {
  adminRole: null,
  status: { not: 'graduated' as const },
};

/** 활성 학생만 조회 (teacher·admin 제외, 서버 필터) */
export async function findActiveStudentUsers(
  ctx?: UserRoleContext,
  orderBy: { createdAt: 'desc' | 'asc' } = { createdAt: 'desc' },
) {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: activeStudentBaseWhere,
    include: { class: true, teacher: true, adminRole: true },
    orderBy,
  });
  return filterStudentUsers(users, roleCtx);
}

/** 졸업생 중 학생만 (teacher·admin 제외) */
export async function findGraduatedStudentUsers(ctx?: UserRoleContext) {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: { adminRole: null, status: 'graduated' },
    include: {
      class: true,
      teacher: true,
      adminRole: true,
      applications: {
        where: { status: 'approved' },
        include: { class: true, teacher: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return filterStudentUsers(users, roleCtx);
}

/** 활성 학생 수 (teacher·admin 제외) */
export async function countActiveStudents(ctx?: UserRoleContext): Promise<number> {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: { status: 'active', adminRole: null },
    include: { adminRole: true },
  });
  return filterStudentUsers(users, roleCtx).length;
}

/** 담당 선생님이 배정된 활성 학생 수 (teacher·admin 제외) */
export async function countActiveStudentsWithTeacher(ctx?: UserRoleContext): Promise<number> {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: { status: 'active', teacherId: { not: null }, adminRole: null },
    include: { adminRole: true },
  });
  return filterStudentUsers(users, roleCtx).length;
}

/** 졸업 학생 수 (teacher·admin 제외) */
export async function countGraduatedStudents(ctx?: UserRoleContext): Promise<number> {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: { status: 'graduated', adminRole: null },
    include: { adminRole: true },
  });
  return filterStudentUsers(users, roleCtx).length;
}

/** 담당 배정된 활성 학생만 (teacherId 기준, 비학생 제외) */
export async function findAssignedStudentsForTeacher(
  teacherId: string,
  ctx?: UserRoleContext,
) {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: {
      teacherId,
      status: 'active',
      adminRole: null,
    },
    include: {
      class: true,
      teacher: true,
      adminRole: true,
      applications: {
        where: { teacherId },
        include: { class: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      interviews: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });
  return filterStudentUsers(users, roleCtx);
}

export type { StudentUserInclude };
