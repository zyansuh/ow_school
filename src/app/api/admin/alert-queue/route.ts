import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { getAdminAlertQueue, setAlertAckAt } from '@/lib/admin/alert-queue';

export async function GET() {
  try {
    await requireAdminUser();
    const queue = await getAdminAlertQueue();
    return NextResponse.json(queue);
  } catch (e) {
    return apiError(e);
  }
}

/** 알림 큐를 현재 시각까지 확인 처리 */
export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    await req.json().catch(() => ({}));
    const ackAt = await setAlertAckAt();
    const queue = await getAdminAlertQueue();
    return NextResponse.json({ ...queue, ackAt });
  } catch (e) {
    return apiError(e);
  }
}
