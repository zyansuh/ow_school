import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { assertDiscordUserIdAvailable } from '@/lib/teacher-auth';
import { z } from 'zod';

const teacherSchema = z.object({
  name: z.string().min(1),
  profileImage: z.string().optional(),
  mbti: z.string().optional(),
  intro: z.string().optional(),
  classId: z.string().min(1),
  discord: z.string().optional(),
  discordUserId: z.string().min(1).optional().nullable(),
  activityDays: z.array(z.string()).optional(),
  activityTimeSlot: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  maxStudents: z.number().optional(),
});

export async function GET() {
  try {
    await requireAdminUser();
    const teachers = await prisma.teacher.findMany({ include: { class: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(teachers);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = teacherSchema.parse(await req.json());
    if (body.discordUserId) {
      await assertDiscordUserIdAvailable(body.discordUserId);
    }
    const { activityDays, discordUserId, ...rest } = body;
    const teacher = await prisma.teacher.create({
      data: {
        ...rest,
        discordUserId: discordUserId?.trim() || null,
        activityDays: activityDays ? JSON.stringify(activityDays) : undefined,
      },
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
