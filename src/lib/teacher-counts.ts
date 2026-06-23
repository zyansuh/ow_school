import { prisma } from '@/lib/prisma';

/** teacherId 기준 활성 담당 학생 (Discord userId로 User 연결) */
export function activeAssignedStudentWhere(teacherId: string) {
  return {
    teacherId,
    status: 'active' as const,
    adminRole: { is: null },
  };
}

export async function countActiveStudentsForTeacher(teacherId: string) {
  return prisma.user.count({ where: activeAssignedStudentWhere(teacherId) });
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
  const rows = await prisma.user.groupBy({
    by: ['teacherId'],
    where: {
      status: 'active',
      teacherId: { not: null },
      adminRole: { is: null },
    },
    _count: { _all: true },
  });
  return Object.fromEntries(
    rows
      .filter((r): r is typeof r & { teacherId: string } => r.teacherId != null)
      .map((r) => [r.teacherId, r._count._all]),
  );
}
