import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';

export async function GET() {
  try {
    const user = await requireUser();
    const interview = await prisma.interview.findFirst({
      where: { userId: user.id },
      include: { teacher: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(interview);
  } catch (e) {
    return apiError(e);
  }
}
