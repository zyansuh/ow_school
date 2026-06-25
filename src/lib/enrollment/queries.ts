import { prisma } from '@/lib/prisma';
import {
  filterStudentUsers,
  loadUserRoleContext,
  type UserRoleContext,
} from '@/lib/users/role';

/** 역할 자동 분류에 필요한 User 스칼라 필드 전체 + adminRole */
const activeStudentInclude = { adminRole: true } as const;

export async function findActiveAssignedStudents(ctx?: UserRoleContext) {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: {
      status: 'active',
      teacherId: { not: null },
      adminRole: { is: null },
    },
    include: activeStudentInclude,
  });
  return filterStudentUsers(users, roleCtx);
}

export async function findActiveStudentsByClass(ctx?: UserRoleContext) {
  const roleCtx = ctx ?? (await loadUserRoleContext());
  const users = await prisma.user.findMany({
    where: {
      status: 'active',
      classId: { not: null },
      adminRole: { is: null },
    },
    include: activeStudentInclude,
  });
  return filterStudentUsers(users, roleCtx);
}

export function countByTeacherId(
  students: Array<{ teacherId: string | null }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const u of students) {
    if (u.teacherId) counts[u.teacherId] = (counts[u.teacherId] ?? 0) + 1;
  }
  return counts;
}

export function countByClassId(
  students: Array<{ classId: string | null }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const u of students) {
    if (u.classId) counts[u.classId] = (counts[u.classId] ?? 0) + 1;
  }
  return counts;
}
