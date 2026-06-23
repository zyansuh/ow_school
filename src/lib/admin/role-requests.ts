import { prisma } from '@/lib/prisma';
import { grantAdmin, revokeAdmin } from '@/lib/rbac';
import { sendDiscordWebhook } from '@/lib/discord/notify';
import { userDisplayName } from '@/lib/user-display';
import { SITE_NAME } from '@/lib/site-brand';

export async function createAdminRoleRequest(userId: string, message?: string) {
  const existing = await prisma.adminRole.findUnique({ where: { userId } });
  if (existing) throw new Error('ALREADY_ADMIN');

  const pending = await prisma.adminRoleRequest.findFirst({
    where: { userId, status: 'pending' },
  });
  if (pending) throw new Error('REQUEST_PENDING');

  const request = await prisma.adminRoleRequest.create({
    data: { userId, message: message?.trim() || null },
    include: { user: true },
  });

  await prisma.adminRoleAuditLog.create({
    data: {
      action: 'request',
      targetUserId: userId,
      actorUserId: userId,
      requestId: request.id,
      note: message?.trim() || null,
    },
  });

  const name = userDisplayName(request.user);
  await sendDiscordWebhook(
    `**[${SITE_NAME}] 관리자 권한 요청**\n요청자: ${name}\nUser ID: \`${userId}\``,
  );

  return request;
}

export async function reviewAdminRoleRequest(
  requestId: string,
  reviewerId: string,
  approve: boolean,
  note?: string,
) {
  const request = await prisma.adminRoleRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request || request.status !== 'pending') throw new Error('NOT_FOUND');

  const status = approve ? 'approved' : 'rejected';
  await prisma.adminRoleRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: note?.trim() || null,
    },
  });

  if (approve) {
    await grantAdmin(request.userId, reviewerId);
  }

  await prisma.adminRoleAuditLog.create({
    data: {
      action: approve ? 'approve' : 'reject',
      targetUserId: request.userId,
      actorUserId: reviewerId,
      requestId,
      note: note?.trim() || null,
    },
  });

  const name = userDisplayName(request.user);
  await sendDiscordWebhook(
    `**[${SITE_NAME}] 관리자 권한 ${approve ? '승인' : '거절'}**\n대상: ${name}\n처리자 ID: \`${reviewerId}\``,
  );

  return { ok: true, status };
}

export async function logAdminRoleAction(
  action: 'grant' | 'revoke',
  targetUserId: string,
  actorUserId: string,
  note?: string,
) {
  await prisma.adminRoleAuditLog.create({
    data: { action, targetUserId, actorUserId, note: note?.trim() || null },
  });
}

export async function grantAdminWithAudit(targetUserId: string, grantedById: string) {
  await grantAdmin(targetUserId, grantedById);
  await logAdminRoleAction('grant', targetUserId, grantedById);
}

export async function revokeAdminWithAudit(targetUserId: string, revokedById: string) {
  await revokeAdmin(targetUserId, revokedById);
  await logAdminRoleAction('revoke', targetUserId, revokedById);
}
