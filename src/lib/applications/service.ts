import { prisma } from '@/lib/prisma';
import { applyApplicationStatusChange } from '@/lib/applications';
import { countActiveStudentsForTeacher } from '@/lib/teacher-counts';
import { isRecruitmentOpen } from '@/lib/teacher-recruiting';
import { initialApplicationStatus } from '@/lib/applications/policy';
import { notifyApplicationSubmitted } from '@/lib/notifications/application-submitted';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/user-display';

export type CreateApplicationInput = {
  userId: string;
  nickname: string;
  discord: string;
  playTimeSlot: string;
  teacherId: string;
};

export async function assertCanApply(userId: string, teacherId: string) {
  const [teacher, dbUser] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId }, include: { class: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!teacher) {
    throw new Error('TEACHER_NOT_FOUND');
  }

  const activeCount = await countActiveStudentsForTeacher(teacher.id);
  if (!isRecruitmentOpen(teacher.maxStudents, activeCount, teacher.isActive)) {
    throw new Error('TEACHER_FULL');
  }

  if (dbUser?.status === 'graduated') {
    throw new Error('GRADUATED');
  }

  if (dbUser?.teacherId && dbUser.status === 'active') {
    throw new Error('ALREADY_ASSIGNED');
  }

  return { teacher, dbUser };
}

export async function createApplication(input: CreateApplicationInput) {
  const { teacher, dbUser } = await assertCanApply(input.userId, input.teacherId);
  const status = initialApplicationStatus();

  const displayName = dbUser
    ? adminUserDisplayName(normalizeNickFields(dbUser))
    : input.nickname;

  const app = await prisma.application.create({
    data: {
      userId: input.userId,
      nickname: displayName,
      discord: dbUser?.discordId ?? input.discord,
      playTimeSlot: input.playTimeSlot,
      teacherId: teacher.id,
      classId: teacher.classId,
      status,
    },
    include: { teacher: true, class: true },
  });

  if (status === 'approved') {
    await applyApplicationStatusChange(
      await prisma.application.findUniqueOrThrow({
        where: { id: app.id },
        include: { teacher: true },
      }),
      'pending',
      'approved',
    );
  }

  void notifyApplicationSubmitted({
    applicationId: app.id,
    userId: input.userId,
    teacherId: teacher.id,
    className: teacher.class.name,
  });

  return app;
}

export async function listApplicationsByUserId(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    include: { teacher: true, class: true },
    orderBy: { createdAt: 'desc' },
  });
}
