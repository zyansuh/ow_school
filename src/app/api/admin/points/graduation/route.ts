import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { deleteGraduationPointsForUser } from '@/lib/admin/points';

const bodySchema = z.object({
  userId: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = bodySchema.parse(await req.json());
    const deleted = await deleteGraduationPointsForUser(body.userId, body.year, body.month);
    if (deleted === 0) {
      return NextResponse.json({ error: '삭제할 졸업 포인트가 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
