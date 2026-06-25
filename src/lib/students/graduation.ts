import { prisma } from '@/lib/prisma';
import { notifyTeacherOnGraduation } from '@/lib/notifications/graduation-teacher-dm';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import { syncTeacherStudentCount } from '@/lib/teacher/counts';
import { resolveLastStudentAssignment } from '@/lib/students/assignment';

export type GraduateOptions = {
  /** 기본 true — false면 DM 미발송 */
  sendTeacherDm?: boolean;
  /** 지정 시 담당 선생님 대신 이 선생님에게 DM */
  dmTeacherId?: string | null;
};

export type GraduateResult = {
  user: Awaited<ReturnType<typeof prisma.user.findUnique>> | null;
  dm: Awaited<ReturnType<typeof notifyTeacherOnGraduation>>;
};

/** 학생을 졸업생으로 전환하고 반·담당 선생님 배정을 해제한다 */
export async function graduateUser(userId: string, options: GraduateOptions = {}): Promise<GraduateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true, class: true },
  });
  if (!user || user.status === 'graduated') {
    return { user, dm: { sent: false, skippedReason: 'disabled' } };
  }

  const teacherId = user.teacherId;
  const dmTeacherId = options.dmTeacherId ?? teacherId;
  const studentDisplayName = adminUserDisplayName(normalizeNickFields(user));
  const className = user.class?.name ?? null;

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'graduated', classId: null, teacherId: null },
  });

  if (teacherId) {
    await syncTeacherStudentCount(teacherId);
  }

  const dm = await notifyTeacherOnGraduation({
    sendTeacherDm: options.sendTeacherDm !== false,
    dmTeacherId,
    studentDisplayName,
    className,
  });

  const updated = await prisma.user.findUnique({ where: { id: userId } });
  return { user: updated, dm };
}

/** 졸업 취소 — active로 복구, 마지막 담당 선생님·반 복원 */
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
