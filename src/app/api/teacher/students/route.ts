import { NextResponse } from 'next/server';
import { apiError, requireTeacherUser } from '@/lib/api-helpers';
import { getTeacherStudents } from '@/lib/teacher-students';

export async function GET() {
  try {
    const { teacher } = await requireTeacherUser();
    const data = await getTeacherStudents(teacher.id);
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}
