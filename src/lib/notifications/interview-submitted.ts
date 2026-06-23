import { prisma } from '@/lib/prisma';
import { userDisplayName, normalizeNickFields } from '@/lib/user-display';
import { sendDiscordDirectMessage, sendDiscordWebhook } from '@/lib/discord/notify';
import { SITE_NAME } from '@/lib/site-brand';

type InterviewNotifyPayload = {
  interviewId: string;
  userId: string;
  className: string;
  teacherId: string | null;
};

export async function notifyInterviewSubmitted(payload: InterviewNotifyPayload) {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { teacher: true },
  });
  if (!user) return;

  const displayName = userDisplayName(normalizeNickFields(user));
  const teacherName = user.teacher?.name ?? '미배정';

  const summary = [
    `**[${SITE_NAME}] 졸업면담 제출**`,
    `학생: ${displayName}`,
    `반: ${payload.className}`,
    `담당 선생님: ${teacherName}`,
    `면담 ID: \`${payload.interviewId}\``,
  ].join('\n');

  await Promise.allSettled([
    sendDiscordWebhook(summary),
    payload.teacherId
      ? (async () => {
          const teacher = await prisma.teacher.findUnique({
            where: { id: payload.teacherId! },
            select: { discordUserId: true, name: true },
          });
          if (!teacher?.discordUserId) return false;
          return sendDiscordDirectMessage(
            teacher.discordUserId,
            `담당 학생 **${displayName}**님이 졸업면담을 제출했습니다.\n반: ${payload.className}`,
          );
        })()
      : Promise.resolve(false),
  ]);
}
