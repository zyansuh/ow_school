import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().optional(),
  profileImage: z.string().optional(),
  mbti: z.string().optional(),
  intro: z.string().optional(),
  classId: z.string().optional(),
  discord: z.string().optional(),
  activityDays: z.array(z.string()).optional(),
  activityTimeSlot: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  maxStudents: z.number().optional(),
  currentStudents: z.number().optional(),
});

function serializeTeacherData(body: z.infer<typeof updateSchema>) {
  const { activityDays, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };
  if (activityDays) data.activityDays = JSON.stringify(activityDays);
  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const teacher = await prisma.teacher.update({
      where: { id },
      data: serializeTeacherData(body),
      include: { class: true },
    });
    return NextResponse.json(teacher);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    await prisma.teacher.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
