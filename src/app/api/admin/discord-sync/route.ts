import { NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { runAdminDiscordSync } from '@/lib/discord-sync-admin';

export async function POST() {
  try {
    await requireAdminUser();
    const report = await runAdminDiscordSync();
    return NextResponse.json(report);
  } catch (e) {
    return apiError(e);
  }
}
