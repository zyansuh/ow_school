import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');

  const teachers = await prisma.teacher.findMany({
    where: slug
      ? {
          isActive: true,
          OR: [
            { class: { slug } },
            { teacherClasses: { some: { class: { slug } } } },
          ],
        }
      : { isActive: true },
    include: {
      class: true,
      teacherClasses: { include: { class: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(teachers);
}
