import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { graduateUser } from '@/lib/graduation';

const patchSchema = z.object({
  action: z.enum(['graduate']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id }, include: { adminRole: true } });
    if (!user || user.adminRole) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    if (body.action === 'graduate') {
      await graduateUser(id);
      const updated = await prisma.user.findUnique({ where: { id } });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
