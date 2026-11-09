import { prisma } from '@/lib/prisma';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import { sendDiscordWebhook } from '@/lib/discord/notify';
import { sendTrackedDiscordDm } from '@/lib/discord/dm-service';
import { formatDateTime } from '@/lib/utils';
import { SITE_NAME } from '@/lib/site-brand';

type InterviewNotifyPayload = {
  interviewId: string;
  userId: string;
  className: string;
  teacherId: string | null;
};

export async function notifyInterviewSubmitted(payload: InterviewNotifyPayload) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { teacher: true },
    });
    if (!user) return;

    const studentName = adminUserDisplayName(normalizeNickFields(user));
    const submittedAt = formatDateTime(new Date());

    const dmBody = [
      '졸업면담이 제출되었습니다.',
      '',
      `학생 : ${studentName}`,
      `반 : ${payload.className}`,
      `제출일 : ${submittedAt}`,
      '',
      '관리자 페이지에서 확인해주세요.',
    ].join('\n');

    const webhookSummary = [
      `**[${SITE_NAME}] 졸업면담 제출**`,
      `학생: ${studentName}`,
      `반: ${payload.className}`,
      `담당 선생님: ${user.teacher?.name ?? '미배정'}`,
    ].join('\n');

    await Promise.allSettled([
      sendDiscordWebhook(webhookSummary),
      (async () => {
        if (!payload.teacherId) {
          return sendTrackedDiscordDm({
            type: 'interview_teacher',
            recipientDiscordId: null,
            content: dmBody,
            userId: user.id,
            skipReason: 'no_recipient',
          });
        }
        const teacher = await prisma.teacher.findUnique({
          where: { id: payload.teacherId },
          select: { id: true, discordUserId: true },
        });
        if (!teacher?.discordUserId) {
          return sendTrackedDiscordDm({
            type: 'interview_teacher',
            recipientDiscordId: null,
            content: dmBody,
            userId: user.id,
            teacherId: payload.teacherId,
            skipReason: 'no_recipient',
          });
        }
        return sendTrackedDiscordDm({
          type: 'interview_teacher',
          recipientDiscordId: teacher.discordUserId,
          content: dmBody,
          userId: user.id,
          teacherId: teacher.id,
        });
      })(),
    ]);
  } catch (e) {
    console.warn('[notify-interview] failed:', e);
  }
}
