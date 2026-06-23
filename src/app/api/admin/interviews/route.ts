import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { normalizeNickFields, userDisplayName } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();
    const interviews = await prisma.interview.findMany({
      include: { teacher: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(
      interviews.map((iv) => ({
        ...iv,
        nickname: iv.user ? userDisplayName(normalizeNickFields(iv.user)) : iv.nickname,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
