import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAuthUrl } from '@/lib/auth/url';
import {
  checkDiscordOAuthCredentials,
  discordApplicationIdFromBotToken,
  getDiscordClientId,
  normalizeEnvValue,
} from '@/lib/auth/env';
import { isBotInGuild } from '@/lib/discord/guild';
import { buildDiscordBotInviteUrl } from '@/lib/discord/bot-invite';
import { DISCORD_OAUTH_SCOPES } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawNextAuthUrl = process.env.NEXTAUTH_URL ?? 'missing';
  const effectiveAuthUrl = resolveAuthUrl();
  const oauthRedirectUri = `${effectiveAuthUrl}/api/auth/callback/discord`;
  const discordClientId = getDiscordClientId();
  const botApplicationId = discordApplicationIdFromBotToken(
    normalizeEnvValue(process.env.DISCORD_BOT_TOKEN),
  );

  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    DIRECT_URL: process.env.DIRECT_URL ? 'set' : 'missing',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'set' : 'missing',
    DISCORD_CLIENT_ID: discordClientId || 'missing',
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? 'set' : 'missing',
    DISCORD_BOT_APPLICATION_ID: botApplicationId ?? 'unknown',
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID ? 'set' : 'missing',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'set' : 'missing',
    NEXTAUTH_URL: rawNextAuthUrl,
    AUTH_URL_EFFECTIVE: effectiveAuthUrl,
    VERCEL: process.env.VERCEL ? 'yes' : 'no',
  };

  const warnings: string[] = [];

  if (!process.env.DISCORD_CLIENT_SECRET) {
    warnings.push('DISCORD_CLIENT_SECRET이 없습니다. Discord OAuth 로그인이 실패합니다.');
  }
  if (!process.env.DIRECT_URL && process.env.VERCEL) {
    warnings.push(
      'DIRECT_URL이 없습니다. Vercel 빌드 시 P1002(migrate timeout)가 날 수 있습니다. Neon Direct URL을 추가하세요.',
    );
  }
  if (discordClientId && botApplicationId && discordClientId !== botApplicationId) {
    warnings.push(
      `DISCORD_CLIENT_ID(${discordClientId})와 봇 토큰 앱 ID(${botApplicationId})가 다릅니다. 같은 Discord 앱의 Client ID·Secret·Bot Token을 사용하세요.`,
    );
  }

  let oauthCredentials: Awaited<ReturnType<typeof checkDiscordOAuthCredentials>> | null = null;
  if (discordClientId && process.env.DISCORD_CLIENT_SECRET) {
    oauthCredentials = await checkDiscordOAuthCredentials(oauthRedirectUri);
    checks.DISCORD_OAUTH_CREDENTIALS = oauthCredentials.status;
    if (oauthCredentials.status === 'invalid_client') {
      warnings.push(
        'Discord가 Client ID·Secret을 거부했습니다(invalid_client). Developer Portal에서 Secret을 재발급하고 DISCORD_CLIENT_ID와 같은 앱인지 확인하세요.',
      );
    } else if (oauthCredentials.status === 'likely_valid' && 'hint' in oauthCredentials) {
      checks.DISCORD_OAUTH_HINT = oauthCredentials.hint;
    }
  }
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    warnings.push('AUTH_SECRET이 없습니다. 세션/JWT 서명이 실패합니다.');
  }
  if (
    process.env.VERCEL &&
    rawNextAuthUrl !== 'missing' &&
    rawNextAuthUrl.includes('localhost') &&
    effectiveAuthUrl !== rawNextAuthUrl
  ) {
    warnings.push(
      `NEXTAUTH_URL 환경 변수가 ${rawNextAuthUrl} 입니다. 런타임에 ${effectiveAuthUrl} 로 보정 중입니다. Vercel Production 값을 https://ow-school.vercel.app 로 수정하세요.`,
    );
  } else if (process.env.VERCEL && rawNextAuthUrl.includes('localhost')) {
    warnings.push('NEXTAUTH_URL이 localhost입니다. Production에는 https://ow-school.vercel.app 로 설정하세요.');
  }

  let db = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    const classCount = await prisma.class.count();
    db = `ok (${classCount} classes)`;
  } catch (e) {
    db = e instanceof Error ? e.message : 'error';
  }

  if (process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
    const botOk = await isBotInGuild();
    checks.DISCORD_BOT_IN_GUILD = botOk ? 'yes' : 'no';
    if (!botOk) {
      warnings.push(
        '봇이 DISCORD_GUILD_ID 서버에 없습니다. 아래 discordSetup.botInviteUrl 로 봇을 초대하세요. (사이트 로그인 버튼과는 별개입니다.)',
      );
    }
  }

  const guildId = normalizeEnvValue(process.env.DISCORD_GUILD_ID);
  const discordSetup = discordClientId
    ? {
        requiredOAuthScopes: DISCORD_OAUTH_SCOPES,
        oauthRedirectUri,
        botInviteUrl: buildDiscordBotInviteUrl({
          clientId: discordClientId,
          guildId: guildId || undefined,
        }),
        note: 'botInviteUrl은 서버에 봇 초대용입니다. 사용자 로그인은 /login 의 Discord로 계속하기를 사용하세요.',
      }
    : null;

  return NextResponse.json({
    ok: db.startsWith('ok') && oauthCredentials?.status !== 'invalid_client',
    db,
    env: checks,
    oauthRedirectUri,
    oauthCredentials,
    discordSetup,
    warnings,
  });
}
