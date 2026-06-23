import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { z } from 'zod';

const schema = z.object({
  nickname: z.string().min(1),
  discord: z.string().min(1),
  experience: z.string().optional(),
  tier: z.string().optional(),
  goal: z.string().optional(),
  selfIntro: z.string().optional(),
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

    const app = await prisma.application.create({
      data: {
        userId: user.id,
        nickname: body.nickname,
        discord: body.discord,
        experience: body.experience,
        tier: body.tier,
        goal: body.goal,
        selfIntro: body.selfIntro,
        teacherId: teacher.id,
        classId: teacher.classId,
        status: 'pending',
      },
      include: { teacher: true, class: true },
    });

    return NextResponse.json(app);
  } catch (e) {
    return apiError(e);
  }
}
