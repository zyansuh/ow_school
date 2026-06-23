import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { getInterviewForUser, interviewAuthorName } from '@/lib/interview-access';
import { z } from 'zod';

const schema = z.object({
  contentExperience: z.string().min(1, '질문 1을 입력해주세요'),
  memorablePerson: z.string().min(1, '질문 2를 입력해주세요'),
  joinedClub: z.boolean(),
  clubNames: z.array(z.string().min(1)).max(3).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const result = await getInterviewForUser(id, user.id);
    if (!result) return NextResponse.json({ error: '졸업면담을 찾을 수 없습니다' }, { status: 404 });
    return NextResponse.json(result.interview);
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const result = await getInterviewForUser(id, user.id);
    if (!result) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });

    const body = schema.parse(await req.json());
    const clubNames =
      body.joinedClub && body.clubNames?.length
        ? body.clubNames.map((n) => n.trim()).filter(Boolean)
        : [];

    if (body.joinedClub && clubNames.length === 0) {
      return NextResponse.json({ error: '동호회명을 1개 이상 입력해주세요' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: result.interview.userId } });
    const nickname = dbUser ? interviewAuthorName(dbUser) : result.interview.nickname;

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        nickname,
        contentExperience: body.contentExperience,
        memorablePerson: body.memorablePerson,
        joinedClub: body.joinedClub,
        clubNames: clubNames.length ? JSON.stringify(clubNames) : null,
      },
      include: { teacher: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
