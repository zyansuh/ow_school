import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAuthUrl } from '@/lib/auth-url';
import { isBotInGuild } from '@/lib/discord-guild';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawNextAuthUrl = process.env.NEXTAUTH_URL ?? 'missing';
  const effectiveAuthUrl = resolveAuthUrl();
  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'set' : 'missing',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'set' : 'missing',
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID ? 'set' : 'missing',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'set' : 'missing',
    NEXTAUTH_URL: rawNextAuthUrl,
    AUTH_URL_EFFECTIVE: effectiveAuthUrl,
    VERCEL: process.env.VERCEL ? 'yes' : 'no',
  };

  const warnings: string[] = [];
  if (
    process.env.VERCEL &&
    rawNextAuthUrl !== 'missing' &&
    rawNextAuthUrl.includes('localhost') &&
    effectiveAuthUrl !== rawNextAuthUrl
  ) {
    warnings.push(
      `NEXTAUTH_URL 환경 변수가 ${rawNextAuthUrl} 입니다. 런타임에 ${effectiveAuthUrl} 로 보정 중입니다. Vercel Production 값을 https://ow-school.vercel.app 로 수정하세요.`
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
        '봇이 DISCORD_GUILD_ID 서버에 없거나 서버 ID가 틀렸습니다. 디스코드 서버에 OW_School 봇을 초대하세요.'
      );
    }
  }

  return NextResponse.json({ ok: db.startsWith('ok'), db, env: checks, warnings });
}
