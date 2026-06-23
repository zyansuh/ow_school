import { prisma } from '@/lib/prisma';
import { syncTeacherStudentCount } from '@/lib/teacher-counts';

/** 학생을 졸업생으로 전환하고 반·담당 선생님 배정을 해제한다 */
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
