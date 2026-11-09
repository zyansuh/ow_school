import { prisma } from '@/lib/prisma';
import { sendTrackedDiscordDm } from '@/lib/discord/dm-service';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';

export type AdmissionStudentDmPayload = {
  userId: string;
  teacherId: string;
  className: string;
};

/** 입학(신청 즉시 승인) 시 학생 본인 DM — 실패해도 입학 DB는 유지 */
export async function notifyStudentOnAdmission(payload: AdmissionStudentDmPayload) {
  try {
    const [user, teacher] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.userId } }),
      prisma.teacher.findUnique({
        where: { id: payload.teacherId },
        select: { id: true, name: true },
      }),
    ]);

    if (!user) return { sent: false as const, skippedReason: 'no_recipient' as const };

    const studentName = adminUserDisplayName(normalizeNickFields(user));
    const content = [
      '🎓 **입학 확정 안내**',
      '',
      `${studentName}님, 수강 신청이 승인되어 입학이 확정되었습니다.`,
      '',
      `담당 선생님: ${teacher?.name ?? '미정'}`,
      `반: ${payload.className}`,
      '',
      '마이페이지에서 담당 선생님·반 정보를 확인할 수 있습니다.',
      '환영합니다!',
    ].join('\n');

    if (!user.isInGuild) {
      return sendTrackedDiscordDm({
        type: 'admission_student',
        recipientDiscordId: user.discordId,
        content,
        userId: user.id,
        teacherId: teacher?.id,
        skipReason: 'not_in_guild',
      });
    }

    return sendTrackedDiscordDm({
      type: 'admission_student',
      recipientDiscordId: user.discordId,
      content,
      userId: user.id,
      teacherId: teacher?.id,
    });
  } catch (e) {
    console.warn('[notify-admission-student] failed:', e);
    return { sent: false as const, skippedReason: 'unknown' as const };
  }
}
