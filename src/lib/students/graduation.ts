import { prisma } from '@/lib/prisma';
import { syncTeacherStudentCount } from '@/lib/teacher/counts';
import { resolveLastStudentAssignment } from '@/lib/students/assignment';

/** 학생을 졸업생으로 전환하고 반·담당 반장 배정을 해제한다 */
export async function graduateUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true },
  });
  if (!user || user.status === 'graduated') return user;

  const teacherId = user.teacherId;

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'graduated', classId: null, teacherId: null },
  });

  if (teacherId) {
    await syncTeacherStudentCount(teacherId);
  }

  return prisma.user.findUnique({ where: { id: userId } });
}

/** 졸업 취소 — active로 복구, 마지막 담당 반장·반 복원 */
export async function restoreGraduatedUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'graduated') return user;

  const assignment = await resolveLastStudentAssignment(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'active',
      teacherId: assignment?.teacherId ?? null,
      classId: assignment?.classId ?? null,
    },
  });

  if (assignment?.teacherId) {
    await syncTeacherStudentCount(assignment.teacherId);
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true, class: true },
  });
}
