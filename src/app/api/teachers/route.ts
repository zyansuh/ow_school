import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  const where = slug
    ? { class: { slug }, isActive: true }
    : { isActive: true };

  const teachers = await prisma.teacher.findMany({
    where,
    include: { class: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(teachers);
}
