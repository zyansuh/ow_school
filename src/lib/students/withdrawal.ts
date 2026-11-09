import { prisma } from '@/lib/prisma';
import { syncEnrollmentStats } from '@/lib/enrollment/persist';
import { syncTeacherStudentCount } from '@/lib/teacher/counts';
import { isStudentUser, loadUserRoleContext } from '@/lib/users/role';
import { recordAssignmentHistory } from '@/lib/students/assignment-history';
import { resolveLastStudentAssignment } from '@/lib/students/assignment';

/** 학생 퇴교 — User + AssignmentHistory 트랜잭션 */
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
  const classId = user.classId;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        status: 'withdrawn',
        teacherId: null,
        classId: null,
      },
    });
    await recordAssignmentHistory(
      {
        userId,
        teacherId,
        classId,
        action: 'withdrawn',
        note: '퇴교',
      },
      tx,
    );
  });

  if (teacherId) {
    await syncTeacherStudentCount(teacherId);
    await syncEnrollmentStats();
  }

  return prisma.user.findUnique({ where: { id: userId } });
}

/** 퇴교 취소 — User + AssignmentHistory 트랜잭션 */
export async function restoreWithdrawnStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminRole: true },
  });
  if (!user || user.status !== 'withdrawn') throw new Error('NOT_WITHDRAWN');

  const assignment = await resolveLastStudentAssignment(userId);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        status: 'active',
        teacherId: assignment?.teacherId ?? null,
        classId: assignment?.classId ?? null,
      },
    });
    await recordAssignmentHistory(
      {
        userId,
        teacherId: assignment?.teacherId,
        classId: assignment?.classId,
        action: 'restored',
        note: '퇴교 취소',
      },
      tx,
    );
  });

  if (assignment?.teacherId) {
    await syncTeacherStudentCount(assignment.teacherId);
    await syncEnrollmentStats();
  }

  return prisma.user.findUnique({ where: { id: userId } });
}
