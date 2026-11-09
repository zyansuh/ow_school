import { NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { retryDiscordDmLog } from '@/lib/discord/dm-service';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const result = await retryDiscordDmLog(id);
    if (result.error === 'LOG_NOT_FOUND') {
      return NextResponse.json({ error: 'DM 기록을 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
