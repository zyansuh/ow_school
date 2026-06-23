import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { z } from 'zod';

const schema = z.object({
  nickname: z.string().min(1),
  teacherId: z.string().optional(),
  satisfaction: z.number().min(1).max(5),
  memorable: z.string().min(1),
  improvements: z.string().optional(),
  review: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const interviews = await prisma.interview.findMany({
    where: userId ? { userId } : undefined,
    include: { teacher: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(interviews);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { teacher: true },
    });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const teacherId = body.teacherId || dbUser.teacherId;

    const interview = await prisma.interview.create({
      data: {
        userId: user.id,
        nickname: body.nickname,
        teacherId: teacherId ?? undefined,
        satisfaction: body.satisfaction,
        memorable: body.memorable,
        improvements: body.improvements,
        review: body.review,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'graduated',
        teacherId: null,
        classId: null,
      },
    });

    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (teacher && teacher.currentStudents > 0) {
        await prisma.teacher.update({
          where: { id: teacherId },
          data: { currentStudents: teacher.currentStudents - 1 },
        });
      }
    }

    return NextResponse.json(interview);
  } catch (e) {
    return apiError(e);
  }
}
