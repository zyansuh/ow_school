import { prisma } from '@/lib/prisma';
import { sendTrackedDiscordDm } from '@/lib/discord/dm-service';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';

export type GraduationStudentDmPayload = {
  userId: string;
  className?: string | null;
  teacherName?: string | null;
};

/** 졸업 시 학생 본인 DM — 실패해도 졸업 DB는 유지 */
export async function notifyStudentOnGraduation(payload: GraduationStudentDmPayload) {
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return { sent: false as const, skippedReason: 'no_recipient' as const };

    const studentName = adminUserDisplayName(normalizeNickFields(user));
    const classLine = payload.className?.trim() ? `담당 반: ${payload.className.trim()}` : null;
    const teacherLine = payload.teacherName?.trim()
      ? `담당 선생님: ${payload.teacherName.trim()}`
      : null;

    const content = [
      '🎓 **졸업 안내**',
      '',
      `${studentName}님의 졸업 처리가 완료되었습니다.`,
      classLine,
      teacherLine,
      '',
      '그동안 함께해 주셔서 감사합니다.',
      '정착지원국 졸업생으로 기록되었습니다.',
    ]
      .filter((line): line is string => line != null && line !== '')
      .join('\n');

    if (!user.isInGuild) {
      return sendTrackedDiscordDm({
        type: 'graduation_student',
        recipientDiscordId: user.discordId,
        content,
        userId: user.id,
        skipReason: 'not_in_guild',
      });
    }

    return sendTrackedDiscordDm({
      type: 'graduation_student',
      recipientDiscordId: user.discordId,
      content,
      userId: user.id,
    });
  } catch (e) {
    console.warn('[notify-graduation-student] failed:', e);
    return { sent: false as const, skippedReason: 'unknown' as const };
  }
}
