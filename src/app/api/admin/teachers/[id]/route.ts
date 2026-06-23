import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { assertDiscordUserIdAvailable } from '@/lib/teacher-auth';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().optional(),
  profileImage: z.string().optional(),
  mbti: z.string().optional(),
  intro: z.string().optional(),
  classId: z.string().optional(),
  discord: z.string().optional(),
  discordUserId: z.string().min(1).optional().nullable(),
  activityDays: z.array(z.string()).optional(),
  activityTimeSlot: z.string().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
  maxStudents: z.number().optional(),
  currentStudents: z.number().optional(),
});

function serializeTeacherData(body: z.infer<typeof updateSchema>) {
  const { activityDays, discordUserId, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };
  if (activityDays) data.activityDays = JSON.stringify(activityDays);
  if (discordUserId !== undefined) data.discordUserId = discordUserId?.trim() || null;
  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    if (body.discordUserId) {
      await assertDiscordUserIdAvailable(body.discordUserId, id);
    }
    const teacher = await prisma.teacher.update({
      where: { id },
      data: serializeTeacherData(body),
      include: { class: true },
    });
    return NextResponse.json(teacher);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('DISCORD_USER_ID_TAKEN')) {
      return NextResponse.json({ error: '이미 다른 선생님에 연결된 Discord User ID입니다' }, { status: 409 });
    }
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
