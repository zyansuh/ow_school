import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { runAdminDiscordSync } from '@/lib/admin/discord-sync';

export async function GET() {
  try {
    await requireAdminUser();
    const report = await runAdminDiscordSync();
    return NextResponse.json(report);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST() {
  try {
    await requireAdminUser();
    const report = await runAdminDiscordSync();
    return NextResponse.json(report);
  } catch (e) {
    return apiError(e);
  }
}
