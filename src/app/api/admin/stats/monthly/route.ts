import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { writeMonthlyOverride } from '@/lib/monthly-stats';

const schema = z.object({
  type: z.enum(['applications', 'interviews']),
  data: z.array(z.object({ month: z.string(), count: z.number().min(0) })),
});

export async function PUT(req: NextRequest) {
  try {
    await requireAdminUser();
    const { type, data } = schema.parse(await req.json());
    await writeMonthlyOverride(type, data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
