import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'set' : 'missing',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'set' : 'missing',
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID ? 'set' : 'missing',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'set' : 'missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'missing',
    VERCEL: process.env.VERCEL ? 'yes' : 'no',
  };

  const warnings: string[] = [];
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? '';
  if (process.env.VERCEL && nextAuthUrl.includes('localhost')) {
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

  return NextResponse.json({ ok: db.startsWith('ok'), db, env: checks, warnings });
}
