import { prisma } from '@/lib/prisma';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import { sendTrackedDiscordDm } from '@/lib/discord/dm-service';
import { notifyStudentOnAdmission } from '@/lib/notifications/admission-student-dm';
import { formatDateTime } from '@/lib/utils';

type ApplicationNotifyPayload = {
  applicationId: string;
  userId: string;
  teacherId: string;
  className: string;
};

/** 신청 즉시 승인 후: 학생 입학 DM + 선생님 알림 DM */
export async function notifyApplicationSubmitted(payload: ApplicationNotifyPayload) {
  try {
    const [user, teacher] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.userId } }),
      prisma.teacher.findUnique({
        where: { id: payload.teacherId },
        select: { id: true, discordUserId: true, name: true },
      }),
    ]);
    if (!user) return;

    const studentName = adminUserDisplayName(normalizeNickFields(user));
    const appliedAt = formatDateTime(new Date());

    await notifyStudentOnAdmission({
      userId: payload.userId,
      teacherId: payload.teacherId,
      className: payload.className,
    });

    const teacherContent = [
      '새로운 수강 신청이 접수되었습니다.',
      '',
      `학생 : ${studentName}`,
      `반 : ${payload.className}`,
      `신청일 : ${appliedAt}`,
      '',
      '관리자 페이지에서 확인해주세요.',
    ].join('\n');

    if (!teacher?.discordUserId) {
      await sendTrackedDiscordDm({
        type: 'application_teacher',
        recipientDiscordId: null,
        content: teacherContent,
        userId: user.id,
        teacherId: teacher?.id,
        skipReason: 'no_recipient',
      });
      return;
    }

    await sendTrackedDiscordDm({
      type: 'application_teacher',
      recipientDiscordId: teacher.discordUserId,
      content: teacherContent,
      userId: user.id,
      teacherId: teacher.id,
    });
  } catch (e) {
    console.warn('[notify-application] failed:', e);
  }
}
