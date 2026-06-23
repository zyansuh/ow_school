import { prisma } from '@/lib/prisma';
import { filterStudentUsers, loadUserRoleContext } from '@/lib/user-role';

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
      isActive: count < teacher.maxStudents,
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
  return results;
}

export async function getActiveStudentCountsByTeacher() {
  const ctx = await loadUserRoleContext();
  const users = await prisma.user.findMany({
    where: {
      status: 'active',
      teacherId: { not: null },
      adminRole: { is: null },
    },
    select: {
      teacherId: true,
      adminRole: true,
      discordRoleNames: true,
      discordId: true,
    },
  });
  const students = filterStudentUsers(users, ctx);
  const counts: Record<string, number> = {};
  for (const u of students) {
    if (u.teacherId) counts[u.teacherId] = (counts[u.teacherId] ?? 0) + 1;
  }
  return counts;
}
