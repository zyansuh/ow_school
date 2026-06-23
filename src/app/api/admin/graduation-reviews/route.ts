import { NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { db } from '@/lib/prisma';
import { userDisplayName } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();
    const reviews = await db((prisma) =>
      prisma.graduationReview.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return NextResponse.json(
      reviews.map((r) => ({
        id: r.id,
        authorName: r.user ? userDisplayName(r.user) : r.authorName,
        className: r.className,
        content: r.content,
        createdAt: r.createdAt,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
