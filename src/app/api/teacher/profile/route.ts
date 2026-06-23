import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireTeacherUser } from '@/lib/api-helpers';
import { ACTIVITY_DAYS } from '@/lib/form-options';

const schema = z.object({
  activityDays: z.array(z.string()).optional(),
  activityTimeSlot: z.string().max(64).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { teacher } = await requireTeacherUser();
    const body = schema.parse(await req.json());

    const data: { activityDays?: string; activityTimeSlot?: string | null } = {};
    if (body.activityDays !== undefined) {
      const days = body.activityDays.filter((d) =>
        (ACTIVITY_DAYS as readonly string[]).includes(d),
      );
      data.activityDays = JSON.stringify(days);
    }
    if (body.activityTimeSlot !== undefined) {
      data.activityTimeSlot = body.activityTimeSlot?.trim() || null;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 });
    }

    const updated = await prisma.teacher.update({
      where: { id: teacher.id },
      data,
      include: { class: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
