import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdminUser();
    const interviews = await prisma.interview.findMany({
      include: { teacher: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(interviews);
  } catch (e) {
    return apiError(e);
  }
}
