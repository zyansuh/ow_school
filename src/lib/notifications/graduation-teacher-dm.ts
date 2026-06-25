import { sendDiscordDirectMessage } from '@/lib/discord/notify';

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

/** 졸업 시 담당 선생님 Discord DM — 실패해도 졸업 처리는 유지 */
export async function sendGraduationTeacherDm(
  discordUserId: string,
  payload: GraduationTeacherDmPayload,
): Promise<boolean> {
  const content = buildGraduationTeacherDmMessage(payload);
  return sendDiscordDirectMessage(discordUserId, content);
}

export type GraduationDmOutcome = {
  sent: boolean;
  skippedReason?: 'disabled' | 'no_teacher' | 'no_discord_user_id' | 'send_failed';
};

export async function notifyTeacherOnGraduation(options: {
  sendTeacherDm: boolean;
  dmTeacherId: string | null | undefined;
  studentDisplayName: string;
  className?: string | null;
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
    select: { name: true, discordUserId: true },
  });

  if (!teacher?.discordUserId) {
    return { sent: false, skippedReason: 'no_discord_user_id' };
  }

  const sent = await sendGraduationTeacherDm(teacher.discordUserId, {
    studentDisplayName: options.studentDisplayName,
    className: options.className,
    teacherName: teacher.name,
  });

  return sent ? { sent: true } : { sent: false, skippedReason: 'send_failed' };
}
