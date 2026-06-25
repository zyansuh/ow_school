import { prisma } from '@/lib/prisma';
import { filterStudentUsers, loadUserRoleContext } from '@/lib/users/role';
import {
  countByTeacherId,
  findActiveAssignedStudents,
} from '@/lib/enrollment/queries';
import { syncEnrollmentStats } from '@/lib/enrollment/persist';
import { computeTeacherIsActive } from '@/lib/teacher/recruiting';

/** teacherId 기준 활성 담당 학생 (Discord userId로 User 연결) */
export function activeAssignedStudentWhere(teacherId: string) {
  return {
    teacherId,
    status: 'active' as const,
    adminRole: { is: null },
  };
}

export async function countActiveStudentsForTeacher(teacherId: string) {
  const ctx = await loadUserRoleContext();
  const users = await prisma.user.findMany({
    where: activeAssignedStudentWhere(teacherId),
    include: { adminRole: true },
  });
  return filterStudentUsers(users, ctx).length;
}

/** Teacher.currentStudents를 실제 활성 담당 학생 수와 동기화 */
export async function syncTeacherStudentCount(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return 0;

  const count = await countActiveStudentsForTeacher(teacherId);
  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      currentStudents: count,
      isActive: computeTeacherIsActive(teacher.maxStudents, count),
    },
  });
  return count;
}

export async function syncAllTeacherStudentCounts() {
  const teachers = await prisma.teacher.findMany({ select: { id: true } });
  const results: Array<{ teacherId: string; count: number }> = [];
  for (const t of teachers) {
    const count = await syncTeacherStudentCount(t.id);
    results.push({ teacherId: t.id, count });
  }
  await syncEnrollmentStats();
  return results;
}

export async function getActiveStudentCountsByTeacher() {
  const students = await findActiveAssignedStudents();
  return countByTeacherId(students);
}
