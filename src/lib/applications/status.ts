import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { syncTeacherStudentCount, countActiveStudentsForTeacher } from '@/lib/teacher/counts';

type AppWithTeacher = Prisma.ApplicationGetPayload<{ include: { teacher: true } }>;

export async function applyApplicationStatusChange(app: AppWithTeacher, oldStatus: string, newStatus: string) {
  if (newStatus === oldStatus) return;

  if (newStatus === 'approved' && oldStatus !== 'approved') {
    const teacher = await prisma.teacher.findUnique({ where: { id: app.teacherId } });
    if (!teacher) return;
    const activeCount = await countActiveStudentsForTeacher(teacher.id);
    if (activeCount >= teacher.maxStudents) {
      throw new Error('선생님 정원이 가득 찼습니다');
    }

    if (app.userId) {
      await prisma.user.update({
        where: { id: app.userId },
        data: { classId: app.classId, teacherId: app.teacherId, status: 'active' },
      });
    }
    await syncTeacherStudentCount(teacher.id);
    return;
  }

  if (newStatus === 'rejected' && oldStatus === 'approved') {
    if (app.userId) {
      const user = await prisma.user.findUnique({ where: { id: app.userId } });
      if (user?.teacherId === app.teacherId) {
        await prisma.user.update({
          where: { id: app.userId },
          data: { classId: null, teacherId: null },
        });
      }
    }
    const teacher = app.teacher;
    await syncTeacherStudentCount(teacher.id);
  }
}
