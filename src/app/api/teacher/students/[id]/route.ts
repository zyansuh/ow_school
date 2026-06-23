import { NextResponse } from 'next/server';
import { apiError, requireTeacherUser } from '@/lib/api-helpers';
import { getTeacherStudentDetail } from '@/lib/teacher-students';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const { teacher } = await requireTeacherUser();
    const { id } = await ctx.params;
    const detail = await getTeacherStudentDetail(teacher.id, id);
    if (!detail) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (e) {
    return apiError(e);
  }
}
