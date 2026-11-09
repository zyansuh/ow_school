import { sendTrackedDiscordDm } from '@/lib/discord/dm-service';

export type GraduationTeacherDmPayload = {
  studentDisplayName: string;
  className?: string | null;
  teacherName: string;
};

export function buildGraduationTeacherDmMessage(payload: GraduationTeacherDmPayload): string {
  const classLine = payload.className?.trim() ? `\n담당 반: ${payload.className.trim()}` : '';
  return [
    `📢 **졸업 알림**`,
    ``,
    `담당 학생 **${payload.studentDisplayName}**님이 졸업 처리되었습니다.`,
    classLine,
    ``,
    `정착지원국 관리자 페이지에서 졸업생 목록을 확인할 수 있습니다.`,
    `수고하셨습니다!`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export type GraduationDmOutcome = {
  sent: boolean;
  skippedReason?: 'disabled' | 'no_teacher' | 'no_discord_user_id' | 'send_failed' | 'no_bot_token';
  logId?: string;
};

export async function notifyTeacherOnGraduation(options: {
  sendTeacherDm: boolean;
  dmTeacherId: string | null | undefined;
  studentDisplayName: string;
  className?: string | null;
  studentUserId?: string | null;
}): Promise<GraduationDmOutcome> {
  if (!options.sendTeacherDm) {
    return { sent: false, skippedReason: 'disabled' };
  }

  const teacherId = options.dmTeacherId?.trim();
  if (!teacherId) {
    return { sent: false, skippedReason: 'no_teacher' };
  }

  const { prisma } = await import('@/lib/prisma');
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, name: true, discordUserId: true },
  });

  const content = buildGraduationTeacherDmMessage({
    studentDisplayName: options.studentDisplayName,
    className: options.className,
    teacherName: teacher?.name ?? '',
  });

  if (!teacher?.discordUserId) {
    const result = await sendTrackedDiscordDm({
      type: 'graduation_teacher',
      recipientDiscordId: null,
      content,
      userId: options.studentUserId,
      teacherId,
      skipReason: 'no_recipient',
    });
    return { sent: false, skippedReason: 'no_discord_user_id', logId: result.logId };
  }

  const result = await sendTrackedDiscordDm({
    type: 'graduation_teacher',
    recipientDiscordId: teacher.discordUserId,
    content,
    userId: options.studentUserId,
    teacherId: teacher.id,
  });

  if (result.status === 'skipped' && result.skipReason === 'no_bot_token') {
    return { sent: false, skippedReason: 'no_bot_token', logId: result.logId };
  }

  return result.sent
    ? { sent: true, logId: result.logId }
    : { sent: false, skippedReason: 'send_failed', logId: result.logId };
}
