import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { assertDiscordUserIdAvailable } from '@/lib/teacher-auth';
import { mapTeacherWithClasses, syncTeacherClasses } from '@/lib/teacher-classes';
import { z } from 'zod';

const teacherSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  profileImage: z.string().optional(),
  mbti: z.string().optional(),
  intro: z.string().optional(),
  classIds: z.array(z.string().min(1)).min(1, '담당 반을 1개 이상 선택하세요'),
  classId: z.string().optional(),
  discord: z.string().optional(),
  discordUserId: z
    .union([z.string().min(1), z.null()])
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  activityDays: z.array(z.string()).optional(),
  activityTimeSlot: z.string().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
  maxStudents: z.number().int().min(1).max(99).optional(),
});

const teacherInclude = {
  class: true,
  teacherClasses: { include: { class: true } },
} as const;

export async function GET() {
  try {
    await requireAdminUser();
    const teachers = await prisma.teacher.findMany({
      include: teacherInclude,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(teachers.map(mapTeacherWithClasses));
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

    const { activityDays, classIds, discordUserId, ...rest } = body;
    const teacher = await prisma.teacher.create({
      data: {
        ...rest,
        classId: classIds[0],
        discordUserId,
        activityDays: activityDays?.length ? JSON.stringify(activityDays) : undefined,
      },
      include: teacherInclude,
    });

    await syncTeacherClasses(teacher.id, classIds);

    const refreshed = await prisma.teacher.findUniqueOrThrow({
      where: { id: teacher.id },
      include: teacherInclude,
    });

    return NextResponse.json(mapTeacherWithClasses(refreshed));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    if (e instanceof Error && e.message.startsWith('DISCORD_USER_ID_TAKEN')) {
      return NextResponse.json({ error: '이미 다른 선생님에 연결된 Discord User ID입니다' }, { status: 409 });
    }
    return apiError(e);
  }
}
