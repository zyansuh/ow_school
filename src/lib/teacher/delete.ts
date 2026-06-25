import { prisma } from '@/lib/prisma';

/**
 * 반장 삭제 — 담당 학생·신청·면담 참조를 정리한 뒤 레코드 삭제.
 * 반에 반장이 없어져도 Class 자체는 유지됩니다.
 */
export async function deleteTeacherById(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error('TEACHER_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { teacherId },
      data: { teacherId: null, classId: null },
    });

    await tx.application.deleteMany({ where: { teacherId } });

    await tx.interview.updateMany({
      where: { teacherId },
      data: { teacherId: null },
    });

    await tx.teacher.delete({ where: { id: teacherId } });
  });
}
