import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireUser } from '@/lib/api-helpers';
import { db } from '@/lib/prisma';
import { userDisplayName } from '@/lib/users/display';

const postSchema = z.object({
  content: z.string().min(10, '후기는 10자 이상 입력해주세요'),
});

export async function GET() {
  const reviews = await db((prisma) =>
    prisma.graduationReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  );
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { content } = postSchema.parse(await req.json());

    const dbUser = await db((prisma) =>
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          class: true,
          graduationReview: true,
          applications: {
            where: { status: 'approved' },
            include: { class: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    );
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (dbUser.graduationReview) {
      return NextResponse.json({ error: '이미 졸업후기를 작성하셨습니다' }, { status: 409 });
    }

    const className =
      dbUser.class?.name ?? dbUser.applications[0]?.class?.name ?? '미배정';

    const review = await db((prisma) =>
      prisma.graduationReview.create({
        data: {
          userId: user.id,
          authorName: userDisplayName(dbUser),
          className,
          content,
        },
      }),
    );

    return NextResponse.json(review);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
