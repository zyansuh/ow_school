import { prisma } from '@/lib/prisma';
import { syncTeacherStudentCount } from '@/lib/teacher/counts';
import { isStudentUser, loadUserRoleContext } from '@/lib/users/role';

export type StudentAssignment = {
  teacherId: string;
  classId: string;
};

/** 졸업 전 마지막 담당 정보 (면담 → 승인 신청 순) */
export async function resolveLastStudentAssignment(userId: string): Promise<StudentAssignment | null> {
  const [interview, application] = await Promise.all([
    prisma.interview.findFirst({
      where: { userId, teacherId: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: { teacher: true },
    }),
    prisma.application.findFirst({
      where: { userId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      select: { teacherId: true, classId: true },
    }),
  ]);

  if (interview?.teacherId && interview.teacher) {
    return { teacherId: interview.teacherId, classId: interview.teacher.classId };
  }
  if (application) {
    return { teacherId: application.teacherId, classId: application.classId };
  }
  return null;
}

/** 관리자: 담당 선생님 변경 (정원·비활성 선생님도 허용) */
export async function assignStudentTeacher(userId: string, teacherId: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { adminRole: true } });
  const ctx = await loadUserRoleContext();
  if (!user || !isStudentUser(user, ctx)) throw new Error('STUDENT_NOT_FOUND');
  if (user.status === 'graduated') throw new Error('GRADUATED');

  const previousTeacherId = user.teacherId;

  if (!teacherId) {
    await prisma.user.update({
      where: { id: userId },
      data: { teacherId: null, classId: null },
    });
    if (previousTeacherId) await syncTeacherStudentCount(previousTeacherId);
    return prisma.user.findUnique({ where: { id: userId }, include: { teacher: true, class: true } });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error('TEACHER_NOT_FOUND');

  await prisma.user.update({
    where: { id: userId },
    data: {
      teacherId: teacher.id,
      classId: teacher.classId,
      status: 'active',
    },
  });

  const recounts = [syncTeacherStudentCount(teacherId)];
  if (previousTeacherId && previousTeacherId !== teacherId) {
    recounts.push(syncTeacherStudentCount(previousTeacherId));
  }
  await Promise.all(recounts);

  return prisma.user.findUnique({ where: { id: userId }, include: { teacher: true, class: true } });
}
