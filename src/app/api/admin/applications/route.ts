import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();
    const apps = await prisma.application.findMany({
      include: { teacher: true, class: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(
      apps.map((a) => ({
        ...a,
        nickname: a.user ? adminUserDisplayName(normalizeNickFields(a.user)) : a.nickname,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
