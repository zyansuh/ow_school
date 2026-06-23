import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const classes = await prisma.class.findMany({
    include: {
      teachers: { where: { isActive: true } },
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json(
    classes.map((c) => ({
      ...c,
      recruiting: c.teachers.some((t) => t.isActive && t.currentStudents < t.maxStudents),
      totalCapacity: c.teachers.reduce((s, t) => s + t.maxStudents, 0),
      currentStudents: c.teachers.reduce((s, t) => s + t.currentStudents, 0),
    })),
  );
}
