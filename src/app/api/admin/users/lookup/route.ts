import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { lookupDiscordUserById } from '@/lib/admin/discord-user-lookup';

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const discordId = req.nextUrl.searchParams.get('discordId')?.trim();
    if (!discordId) {
      return NextResponse.json({ error: 'discordId가 필요합니다' }, { status: 400 });
    }

    const result = await lookupDiscordUserById(discordId);
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
