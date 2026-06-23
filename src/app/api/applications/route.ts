import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { applyApplicationStatusChange } from '@/lib/applications';
import { z } from 'zod';

const schema = z.object({
  nickname: z.string().min(1),
  discord: z.string().min(1),
  playTimeSlot: z.string().min(1),
  teacherId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const discord = req.nextUrl.searchParams.get('discord');
  const userId = req.nextUrl.searchParams.get('userId');
  const where = userId ? { userId } : discord ? { discord } : {};
  const apps = await prisma.application.findMany({
    where,
    include: { teacher: true, class: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const teacher = await prisma.teacher.findUnique({ where: { id: body.teacherId }, include: { class: true } });
    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ error: '선생님을 찾을 수 없습니다' }, { status: 404 });
    }
    if (teacher.currentStudents >= teacher.maxStudents) {
      return NextResponse.json({ error: '모집이 마감되었습니다' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.status === 'graduated') {
      return NextResponse.json({ error: '졸업생은 수강 신청할 수 없습니다' }, { status: 400 });
    }
    if (dbUser?.teacherId && dbUser.status === 'active') {
      return NextResponse.json({ error: '이미 담당 선생님이 배정되어 있습니다' }, { status: 400 });
    }

    const app = await prisma.application.create({
      data: {
        userId: user.id,
        nickname: body.nickname,
        discord: body.discord,
        playTimeSlot: body.playTimeSlot,
        teacherId: teacher.id,
        classId: teacher.classId,
        status: 'approved',
      },
      include: { teacher: true, class: true },
    });

    await applyApplicationStatusChange(
      await prisma.application.findUniqueOrThrow({
        where: { id: app.id },
        include: { teacher: true },
      }),
      'pending',
      'approved',
    );

    return NextResponse.json(app);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
