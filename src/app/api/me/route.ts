import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';

export async function GET() {
  try {
    const user = await requireUser();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        class: true,
        teacher: true,
        applications: { include: { teacher: true, class: true }, orderBy: { createdAt: 'desc' } },
        interviews: { orderBy: { createdAt: 'desc' } },
      },
    });
    return NextResponse.json(dbUser);
  } catch (e) {
    return apiError(e);
  }
}
