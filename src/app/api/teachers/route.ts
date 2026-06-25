import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { teacherPublicInclude, teachersForClassIdWhere } from '@/lib/teacher/query';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');

  let where: Record<string, unknown> = { isActive: true };

  if (slug) {
    const dbClass = await prisma.class.findUnique({ where: { slug } });
    if (!dbClass) {
      return NextResponse.json([]);
    }
    where = {
      isActive: true,
      ...teachersForClassIdWhere(dbClass.id),
    };
  }

  const teachers = await prisma.teacher.findMany({
    where,
    include: teacherPublicInclude,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(teachers);
}
