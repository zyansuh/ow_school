import { prisma } from '@/lib/prisma';
import { adminUserDisplayName, guildNicknameOnly, normalizeNickFields } from '@/lib/user-display';
import { sendDiscordDirectMessage } from '@/lib/discord/notify';
import { formatDateTime } from '@/lib/utils';

type ApplicationNotifyPayload = {
  applicationId: string;
  userId: string;
  teacherId: string;
  className: string;
};

export async function notifyApplicationSubmitted(payload: ApplicationNotifyPayload) {
  try {
    const [user, teacher] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.userId } }),
      prisma.teacher.findUnique({
        where: { id: payload.teacherId },
        select: { discordUserId: true, name: true },
      }),
    ]);
    if (!user || !teacher?.discordUserId) return;

    const studentName = adminUserDisplayName(normalizeNickFields(user));
    const appliedAt = formatDateTime(new Date());

    await sendDiscordDirectMessage(
      teacher.discordUserId,
      [
        '새로운 수강 신청이 접수되었습니다.',
        '',
        `학생 : ${studentName}`,
        `반 : ${payload.className}`,
        `신청일 : ${appliedAt}`,
        '',
        '관리자 페이지에서 확인해주세요.',
      ].join('\n'),
    );
  } catch (e) {
    console.warn('[notify-application] failed:', e);
  }
}
