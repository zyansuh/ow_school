import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const status = req.nextUrl.searchParams.get('status');
    const type = req.nextUrl.searchParams.get('type');
    const take = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 100) || 100, 200);

    const logs = await prisma.discordDmLog.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json({ logs });
  } catch (e) {
    return apiError(e);
  }
}
