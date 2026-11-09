import { prisma } from '@/lib/prisma';
import { getGuildConfig } from '@/lib/discord/guild';
import { sendDiscordDirectMessage } from '@/lib/discord/notify';
import type { DiscordDmSkipReason, DiscordDmType } from '@/lib/discord/dm-types';

export type SendTrackedDmInput = {
  type: DiscordDmType;
  recipientDiscordId: string | null | undefined;
  content: string;
  userId?: string | null;
  teacherId?: string | null;
  /** 실제 전송 없이 skipped 로그만 남김 */
  skipReason?: DiscordDmSkipReason;
};

export type SendTrackedDmResult = {
  logId: string;
  sent: boolean;
  status: 'sent' | 'failed' | 'skipped';
  skipReason?: DiscordDmSkipReason;
  error?: string;
};

/**
 * Bot DM 발송 + DiscordDmLog 기록.
 * OAuth 로그인과 무관 — 봇 토큰·수신자 ID·DM 설정이 모두 필요합니다.
 */
export async function sendTrackedDiscordDm(input: SendTrackedDmInput): Promise<SendTrackedDmResult> {
  const recipient = input.recipientDiscordId?.trim() ?? '';
  const config = getGuildConfig();

  if (input.skipReason) {
    const log = await prisma.discordDmLog.create({
      data: {
        type: input.type,
        recipientDiscordId: recipient || 'unknown',
        userId: input.userId ?? null,
        teacherId: input.teacherId ?? null,
        content: input.content,
        status: 'skipped',
        skipReason: input.skipReason,
        attempts: 0,
      },
    });
    return { logId: log.id, sent: false, status: 'skipped', skipReason: input.skipReason };
  }

  if (!recipient) {
    const log = await prisma.discordDmLog.create({
      data: {
        type: input.type,
        recipientDiscordId: 'unknown',
        userId: input.userId ?? null,
        teacherId: input.teacherId ?? null,
        content: input.content,
        status: 'skipped',
        skipReason: 'no_recipient',
        attempts: 0,
      },
    });
    return { logId: log.id, sent: false, status: 'skipped', skipReason: 'no_recipient' };
  }

  if (!config?.botToken) {
    const log = await prisma.discordDmLog.create({
      data: {
        type: input.type,
        recipientDiscordId: recipient,
        userId: input.userId ?? null,
        teacherId: input.teacherId ?? null,
        content: input.content,
        status: 'skipped',
        skipReason: 'no_bot_token',
        attempts: 0,
      },
    });
    return { logId: log.id, sent: false, status: 'skipped', skipReason: 'no_bot_token' };
  }

  const log = await prisma.discordDmLog.create({
    data: {
      type: input.type,
      recipientDiscordId: recipient,
      userId: input.userId ?? null,
      teacherId: input.teacherId ?? null,
      content: input.content,
      status: 'pending',
      attempts: 0,
    },
  });

  return retryDiscordDmLog(log.id);
}

/** 기존 로그 재시도 (관리자 UI) */
export async function retryDiscordDmLog(logId: string): Promise<SendTrackedDmResult> {
  const log = await prisma.discordDmLog.findUnique({ where: { id: logId } });
  if (!log) {
    return { logId, sent: false, status: 'failed', error: 'LOG_NOT_FOUND' };
  }

  if (log.status === 'sent') {
    return { logId, sent: true, status: 'sent' };
  }

  const config = getGuildConfig();
  if (!config?.botToken) {
    const updated = await prisma.discordDmLog.update({
      where: { id: logId },
      data: {
        status: 'skipped',
        skipReason: 'no_bot_token',
        lastAttemptAt: new Date(),
      },
    });
    return {
      logId: updated.id,
      sent: false,
      status: 'skipped',
      skipReason: 'no_bot_token',
    };
  }

  if (!log.recipientDiscordId || log.recipientDiscordId === 'unknown') {
    const updated = await prisma.discordDmLog.update({
      where: { id: logId },
      data: {
        status: 'skipped',
        skipReason: 'no_recipient',
        lastAttemptAt: new Date(),
      },
    });
    return {
      logId: updated.id,
      sent: false,
      status: 'skipped',
      skipReason: 'no_recipient',
    };
  }

  const ok = await sendDiscordDirectMessage(log.recipientDiscordId, log.content);
  const updated = await prisma.discordDmLog.update({
    where: { id: logId },
    data: {
      status: ok ? 'sent' : 'failed',
      error: ok ? null : 'DISCORD_SEND_FAILED',
      skipReason: null,
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  return {
    logId: updated.id,
    sent: ok,
    status: ok ? 'sent' : 'failed',
    error: ok ? undefined : 'DISCORD_SEND_FAILED',
  };
}
