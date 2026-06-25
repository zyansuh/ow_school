import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { graduateUser, restoreGraduatedUser } from '@/lib/students/graduation';
import { assignStudentTeacher } from '@/lib/students/assignment';
import { isStudentUser, loadUserRoleContext } from '@/lib/users/role';

const patchSchema = z.object({
  action: z.enum(['graduate', 'ungraduate']).optional(),
  teacherId: z.string().nullable().optional(),
  displayNickname: z.string().max(32).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id }, include: { adminRole: true } });
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    if (body.action === 'ungraduate') {
      if (user.status !== 'graduated') {
        return NextResponse.json({ error: '졸업생이 아닙니다' }, { status: 400 });
      }
      const updated = await restoreGraduatedUser(id);
      return NextResponse.json(updated);
    }

    const ctx = await loadUserRoleContext();

    if (body.action === 'graduate') {
      if (!isStudentUser(user, ctx)) {
        return NextResponse.json({ error: '학생만 졸업 처리할 수 있습니다' }, { status: 400 });
      }
      if (user.status === 'graduated') {
        return NextResponse.json({ error: '이미 졸업 처리된 사용자입니다' }, { status: 400 });
      }
      await graduateUser(id);
      const updated = await prisma.user.findUnique({ where: { id } });
      return NextResponse.json(updated);
    }

    if (!isStudentUser(user, ctx)) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    if (body.teacherId !== undefined) {
      const updated = await assignStudentTeacher(id, body.teacherId);
      return NextResponse.json(updated);
    }

    if (body.displayNickname !== undefined) {
      const updated = await prisma.user.update({
        where: { id },
        data: { displayNickname: body.displayNickname?.trim() || null },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    if (e instanceof Error) {
      if (e.message === 'GRADUATED') {
        return NextResponse.json({ error: '졸업생은 반장 배정이 불가합니다. 먼저 졸업 취소를 해주세요.' }, { status: 400 });
      }
      if (e.message === 'TEACHER_NOT_FOUND') {
        return NextResponse.json({ error: '반장을 찾을 수 없습니다' }, { status: 404 });
      }
    }
    return apiError(e);
  }
}
