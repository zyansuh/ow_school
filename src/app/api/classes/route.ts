import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher-counts';
import { isRecruitmentOpen } from '@/lib/teacher-recruiting';

export async function GET() {
  const [classes, liveCounts] = await Promise.all([
    prisma.class.findMany({
      include: {
        teachers: { where: { isActive: true } },
        _count: { select: { users: true } },
      },
    }),
    getActiveStudentCountsByTeacher(),
  ]);

  return NextResponse.json(
    classes.map((c) => ({
      ...c,
      recruiting: c.teachers.some((t) => isRecruitmentOpen(t.maxStudents, liveCounts[t.id] ?? 0, t.isActive)),
      totalCapacity: c.teachers.reduce((s, t) => s + t.maxStudents, 0),
      currentStudents: c.teachers.reduce((s, t) => s + (liveCounts[t.id] ?? 0), 0),
    })),
  );
}
