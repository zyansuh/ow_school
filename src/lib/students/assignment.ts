import { prisma } from '@/lib/prisma';
import { syncEnrollmentStats } from '@/lib/enrollment/persist';
import { syncTeacherStudentCount } from '@/lib/teacher/counts';
import { isStudentUser, loadUserRoleContext } from '@/lib/users/role';
import {
  findLastAssignedHistory,
  recordAssignmentHistory,
} from '@/lib/students/assignment-history';

export type StudentAssignment = {
  teacherId: string;
  classId: string;
};

/** 졸업·퇴교 전 마지막 담당 정보 (배정 이력 → 면담 → 승인 신청 순) */
export async function resolveLastStudentAssignment(userId: string): Promise<StudentAssignment | null> {
  const [history, interview, application] = await Promise.all([
    findLastAssignedHistory(userId),
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

  if (history?.teacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: history.teacherId },
      select: { id: true, classId: true },
    });
    if (teacher) {
      return { teacherId: teacher.id, classId: history.classId ?? teacher.classId };
    }
  }

  if (interview?.teacherId && interview.teacher) {
    return { teacherId: interview.teacherId, classId: interview.teacher.classId };
  }
  if (application) {
    return { teacherId: application.teacherId, classId: application.classId };
  }
  return null;
}

/** 관리자: 담당 선생님 변경 — User + AssignmentHistory 동일 트랜잭션 */
export async function assignStudentTeacher(userId: string, teacherId: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { adminRole: true } });
  const ctx = await loadUserRoleContext();
  if (!user || !isStudentUser(user, ctx)) throw new Error('STUDENT_NOT_FOUND');
  if (user.status === 'graduated') throw new Error('GRADUATED');

  const previousTeacherId = user.teacherId;

  if (!teacherId) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { teacherId: null, classId: null },
      });
      await recordAssignmentHistory(
        {
          userId,
          teacherId: null,
          classId: null,
          action: 'reassigned',
          note: '담당 해제',
        },
        tx,
      );
    });
    if (previousTeacherId) await syncTeacherStudentCount(previousTeacherId);
    await syncEnrollmentStats();
    return prisma.user.findUnique({ where: { id: userId }, include: { teacher: true, class: true } });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error('TEACHER_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        teacherId: teacher.id,
        classId: teacher.classId,
        status: 'active',
      },
    });
    await recordAssignmentHistory(
      {
        userId,
        teacherId: teacher.id,
        classId: teacher.classId,
        action: previousTeacherId ? 'reassigned' : 'assigned',
        note: previousTeacherId ? `재배정 ← ${previousTeacherId}` : '관리자 배정',
      },
      tx,
    );
  });

  const recounts = [syncTeacherStudentCount(teacherId)];
  if (previousTeacherId && previousTeacherId !== teacherId) {
    recounts.push(syncTeacherStudentCount(previousTeacherId));
  }
  await Promise.all(recounts);
  await syncEnrollmentStats();

  return prisma.user.findUnique({ where: { id: userId }, include: { teacher: true, class: true } });
}
