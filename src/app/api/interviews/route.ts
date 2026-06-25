import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser, requireUser } from '@/lib/api-helpers';
import { graduateUser } from '@/lib/students/graduation';
import { interviewAuthorName } from '@/lib/interviews/access';
import { CLUB_POINT, GRADUATION_POINT } from '@/lib/points';
import { notifyInterviewSubmitted } from '@/lib/notifications/interview-submitted';
import { z } from 'zod';

const schema = z.object({
  contentExperience: z.string().min(1, '질문 1을 입력해주세요'),
  memorablePerson: z.string().min(1, '질문 2를 입력해주세요'),
  joinedClub: z.boolean(),
  clubNames: z.array(z.string().min(1)).max(3).optional(),
});

function resolveClassName(user: {
  class?: { name: string } | null;
  applications?: Array<{ class?: { name: string } | null; status: string }>;
}) {
  if (user.class?.name) return user.class.name;
  const approved = user.applications?.find((a) => a.status === 'approved');
  return approved?.class?.name ?? '미배정';
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (userId) {
      await requireAdminUser();
      const interviews = await prisma.interview.findMany({
        where: { userId },
        include: { teacher: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(interviews);
    }

    const user = await requireUser();
    const interviews = await prisma.interview.findMany({
      where: { userId: user.id },
      include: { teacher: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(interviews);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const existing = await prisma.interview.findFirst({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: '이미 졸업면담을 제출하셨습니다. 수정하려면 기존 면담을 편집해주세요.' }, { status: 409 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        class: true,
        teacher: true,
        applications: {
          where: { status: 'approved' },
          include: { class: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const nickname = interviewAuthorName(dbUser);
    const className = resolveClassName(dbUser);
    const teacherId = dbUser.teacherId;
    const clubNames =
      body.joinedClub && body.clubNames?.length
        ? body.clubNames.map((n) => n.trim()).filter(Boolean)
        : [];

    if (body.joinedClub && clubNames.length === 0) {
      return NextResponse.json({ error: '동호회명을 1개 이상 입력해주세요' }, { status: 400 });
    }

    const interview = await prisma.$transaction(async (tx) => {
      const created = await tx.interview.create({
        data: {
          userId: user.id,
          nickname,
          className,
          teacherId: teacherId ?? undefined,
          contentExperience: body.contentExperience,
          memorablePerson: body.memorablePerson,
          joinedClub: body.joinedClub,
          clubNames: clubNames.length ? JSON.stringify(clubNames) : null,
        },
      });

      await tx.pointHistory.create({
        data: {
          userId: user.id,
          interviewId: created.id,
          pointType: 'graduation',
          pointAmount: GRADUATION_POINT,
        },
      });

      if (body.joinedClub) {
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            interviewId: created.id,
            pointType: 'club',
            pointAmount: CLUB_POINT,
          },
        });
      }

      return created;
    });

    await graduateUser(user.id);

    notifyInterviewSubmitted({
      interviewId: interview.id,
      userId: user.id,
      className,
      teacherId,
    }).catch((err) => console.error('[interview-notify]', err));

    return NextResponse.json({
      interview,
      pointsAwarded: {
        graduation: GRADUATION_POINT,
        club: body.joinedClub ? CLUB_POINT : 0,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
