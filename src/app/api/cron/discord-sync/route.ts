import { NextRequest, NextResponse } from 'next/server';
import { runAdminDiscordSync } from '@/lib/admin/discord-sync';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await runAdminDiscordSync();
  return NextResponse.json(report);
}
