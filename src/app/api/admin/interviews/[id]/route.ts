import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { interviewAuthorName } from '@/lib/interviews/access';
import { normalizeNickFields, adminUserDisplayName } from '@/lib/users/display';
import { z } from 'zod';

const deleteSchema = z.object({
  reason: z.string().max(500).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

async function removeInterviewPoints(interviewId: string, userId: string, createdAt: Date) {
  const linked = await prisma.pointHistory.findMany({ where: { interviewId } });
  if (linked.length > 0) return linked;

  const windowStart = new Date(createdAt.getTime() - 5000);
  const windowEnd = new Date(createdAt.getTime() + 5000);
  return prisma.pointHistory.findMany({
    where: {
      userId,
      pointType: { in: ['graduation', 'club'] },
      createdAt: { gte: windowStart, lte: windowEnd },
    },
  });
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const admin = await requireAdminUser();
    const { id } = await ctx.params;
    const body = deleteSchema.parse(await req.json().catch(() => ({})));

    const [adminDb, interview] = await Promise.all([
      prisma.user.findUnique({ where: { id: admin.id } }),
      prisma.interview.findUnique({
        where: { id },
        include: { user: true },
      }),
    ]);

    if (!interview) {
      return NextResponse.json({ error: '졸업면담을 찾을 수 없습니다' }, { status: 404 });
    }

    const points = await removeInterviewPoints(interview.id, interview.userId, interview.createdAt);
    const graduationRemoved = points
      .filter((p) => p.pointType === 'graduation')
      .reduce((s, p) => s + p.pointAmount, 0);
    const clubRemoved = points
      .filter((p) => p.pointType === 'club')
      .reduce((s, p) => s + p.pointAmount, 0);

    const deletedByName = adminDb
      ? interviewAuthorName(adminDb)
      : adminUserDisplayName(
          normalizeNickFields({
            discordUsername: admin.discordUsername,
            discordServerNick: admin.discordServerNick,
            discordNickname: admin.discordNickname,
          }),
        );

    await prisma.$transaction(async (tx) => {
      if (points.length > 0) {
        await tx.pointHistory.deleteMany({ where: { id: { in: points.map((p) => p.id) } } });
      }
      await tx.interviewDeletionLog.create({
        data: {
          interviewId: interview.id,
          authorUserId: interview.userId,
          authorDisplayName: interviewAuthorName(interview.user),
          deletedByUserId: admin.id,
          deletedByDisplayName: deletedByName,
          reason: body.reason?.trim() || null,
          graduationPointsRemoved: graduationRemoved,
          clubPointsRemoved: clubRemoved,
        },
      });
      await tx.interview.delete({ where: { id } });
    });

    return NextResponse.json({
      ok: true,
      pointsRemoved: { graduation: graduationRemoved, club: clubRemoved },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
