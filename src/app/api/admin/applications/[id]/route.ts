import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { z } from 'zod';

const patchSchema = z.object({ status: z.enum(['pending', 'approved', 'rejected']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const { status } = patchSchema.parse(await req.json());

    const app = await prisma.application.findUnique({ where: { id }, include: { teacher: true } });
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      include: { teacher: true, class: true },
    });

    if (status === 'approved' && app.status !== 'approved' && app.userId) {
      const teacher = app.teacher;
      await prisma.user.update({
        where: { id: app.userId },
        data: { classId: app.classId, teacherId: app.teacherId, status: 'active' },
      });
      if (teacher.currentStudents < teacher.maxStudents) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { currentStudents: teacher.currentStudents + 1 },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}
