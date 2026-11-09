import { prisma } from '@/lib/prisma';

export type AssignmentHistoryAction =
  | 'assigned'
  | 'reassigned'
  | 'graduated'
  | 'withdrawn'
  | 'restored';

export async function recordAssignmentHistory(input: {
  userId: string;
  teacherId?: string | null;
  classId?: string | null;
  action: AssignmentHistoryAction;
  note?: string | null;
}) {
  return prisma.assignmentHistory.create({
    data: {
      userId: input.userId,
      teacherId: input.teacherId ?? null,
      classId: input.classId ?? null,
      action: input.action,
      note: input.note ?? null,
    },
  });
}

/** 졸업·퇴교 복구 시 마지막 배정 추론용 */
export async function findLastAssignedHistory(userId: string) {
  return prisma.assignmentHistory.findFirst({
    where: {
      userId,
      action: { in: ['assigned', 'reassigned', 'restored'] },
      teacherId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });
}
