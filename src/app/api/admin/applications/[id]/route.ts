import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { applyApplicationStatusChange } from '@/lib/applications/status';
import { countActiveStudentsForTeacher } from '@/lib/teacher/counts';
import { z } from 'zod';

const patchSchema = z.object({ status: z.enum(['pending', 'approved', 'rejected']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const { status } = patchSchema.parse(await req.json());

    const app = await prisma.application.findUnique({ where: { id }, include: { teacher: true } });
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const oldStatus = app.status;
    if (status === 'approved' && oldStatus !== 'approved') {
      const teacher = await prisma.teacher.findUnique({ where: { id: app.teacherId } });
      if (teacher) {
        const activeCount = await countActiveStudentsForTeacher(teacher.id);
        if (teacher.maxStudents <= 0 || activeCount >= teacher.maxStudents) {
          return NextResponse.json({ error: '반장 정원이 가득 찼습니다' }, { status: 400 });
        }
      }
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      include: { teacher: true, class: true },
    });

    await applyApplicationStatusChange(app, oldStatus, status);

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}
