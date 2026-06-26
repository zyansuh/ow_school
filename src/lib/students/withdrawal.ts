import { prisma } from '@/lib/prisma';
import { syncEnrollmentStats } from '@/lib/enrollment/persist';
import { syncTeacherStudentCount } from '@/lib/teacher/counts';
import { isStudentUser, loadUserRoleContext } from '@/lib/users/role';

/** 학생 퇴교 처리 — 레코드 삭제 없이 status만 변경 */
export async function withdrawStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminRole: true },
  });
  const ctx = await loadUserRoleContext();
  if (!user || !isStudentUser(user, ctx)) throw new Error('STUDENT_NOT_FOUND');
  if (user.status === 'graduated') throw new Error('GRADUATED');
  if (user.status === 'withdrawn') throw new Error('ALREADY_WITHDRAWN');

  const teacherId = user.teacherId;

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'withdrawn',
      teacherId: null,
      classId: null,
    },
  });

  if (teacherId) {
    await syncTeacherStudentCount(teacherId);
    await syncEnrollmentStats();
  }

  return prisma.user.findUnique({ where: { id: userId } });
}

/** 퇴교 취소 — 재학(active)으로 복구, 마지막 담당 정보는 복원하지 않음 */
export async function restoreWithdrawnStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminRole: true },
  });
  const ctx = await loadUserRoleContext();
  if (!user || user.status !== 'withdrawn') throw new Error('NOT_WITHDRAWN');

  return prisma.user.update({
    where: { id: userId },
    data: { status: 'active' },
  });
}
