import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: { class: true },
  });
  if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(teacher);
}
