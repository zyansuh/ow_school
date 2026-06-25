import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { assertDiscordUserIdAvailable } from '@/lib/teacher/auth';
import { deleteTeacherById } from '@/lib/teacher/delete';
import { mapTeacherWithClasses, syncTeacherClasses } from '@/lib/teacher/classes';
import { assertValidTeacherDiscordField } from '@/lib/teacher/discord-field';
import { countActiveStudentsForTeacher } from '@/lib/teacher/counts';
import { computeTeacherIsActive } from '@/lib/teacher/recruiting';
import {
  teacherBirthYearField,
  teacherGenderField,
  teacherRegionField,
} from '@/lib/teacher/profile';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  mbti: z.string().optional(),
  gender: teacherGenderField,
  region: teacherRegionField,
  birthYear: teacherBirthYearField,
  intro: z.string().optional(),
  classIds: z.array(z.string().min(1)).min(1).optional(),
  classId: z.string().optional(),
  discord: z.string().optional(),
  discordUserId: z
    .union([z.string().min(1), z.null()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v && v.trim() ? v.trim() : null)),
  activityDays: z.array(z.string()).optional(),
  activityTimeSlot: z.string().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
  maxStudents: z.number().int().min(0).max(99).optional(),
  currentStudents: z.number().optional(),
});

const teacherInclude = {
  class: true,
  teacherClasses: { include: { class: true } },
} as const;

function serializeTeacherData(body: z.infer<typeof updateSchema>) {
  const { activityDays, discordUserId, classIds, classId, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };
  if (activityDays) data.activityDays = JSON.stringify(activityDays);
  if (discordUserId !== undefined) data.discordUserId = discordUserId;
  if (classIds?.length) data.classId = classIds[0];
  return { data, classIds };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    if (body.discord !== undefined) {
      assertValidTeacherDiscordField(body.discord);
    }
    if (body.discordUserId) {
      await assertDiscordUserIdAvailable(body.discordUserId, id);
    }

    const { data, classIds } = serializeTeacherData(body);

    if (body.maxStudents !== undefined) {
      const activeCount = await countActiveStudentsForTeacher(id);
      data.isActive = computeTeacherIsActive(body.maxStudents, activeCount);
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data,
      include: teacherInclude,
    });

    if (classIds?.length) {
      await syncTeacherClasses(id, classIds);
    }

    const refreshed = await prisma.teacher.findUniqueOrThrow({
      where: { id },
      include: teacherInclude,
    });

    return NextResponse.json(mapTeacherWithClasses(refreshed));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    if (e instanceof Error && e.message === 'TEACHER_DISCORD_IS_USER_ID') {
      return NextResponse.json({ error: '디스코드 서버 닉네임에 User ID를 넣을 수 없습니다' }, { status: 400 });
    }
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
    await deleteTeacherById(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'TEACHER_NOT_FOUND') {
      return NextResponse.json({ error: '선생님을 찾을 수 없습니다' }, { status: 404 });
    }
    return apiError(e);
  }
}
