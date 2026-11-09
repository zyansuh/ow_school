import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { syncTeacherStudentCount, countActiveStudentsForTeacher } from '@/lib/teacher/counts';
import { recordAssignmentHistory } from '@/lib/students/assignment-history';

type AppWithTeacher = Prisma.ApplicationGetPayload<{ include: { teacher: true } }>;

export async function applyApplicationStatusChange(app: AppWithTeacher, oldStatus: string, newStatus: string) {
  if (newStatus === oldStatus) return;

  if (newStatus === 'approved' && oldStatus !== 'approved') {
    const teacher = await prisma.teacher.findUnique({ where: { id: app.teacherId } });
    if (!teacher) return;
    if (!teacher.isActive) {
      throw new Error('비활성 선생님에게는 배정할 수 없습니다');
    }
    const activeCount = await countActiveStudentsForTeacher(teacher.id);
    if (activeCount >= teacher.maxStudents) {
      throw new Error('선생님 정원이 가득 찼습니다');
    }

    if (app.userId) {
      await prisma.user.update({
        where: { id: app.userId },
        data: { classId: app.classId, teacherId: app.teacherId, status: 'active' },
      });
      await recordAssignmentHistory({
        userId: app.userId,
        teacherId: app.teacherId,
        classId: app.classId,
        action: 'assigned',
        note: `신청 승인 · ${app.id}`,
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
