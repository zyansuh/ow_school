import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireUser } from '@/lib/api-helpers';
import { createApplication, listApplicationsByUserId } from '@/lib/applications/service';
import { z } from 'zod';

const schema = z.object({
  nickname: z.string().min(1),
  discord: z.string().min(1),
  playTimeSlot: z.string().min(1),
  teacherId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다' }, { status: 400 });
    }
    const user = await requireUser();
    if (user.id !== userId && !user.isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }
    const apps = await listApplicationsByUserId(userId);
    return NextResponse.json(apps);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const app = await createApplication({
      userId: user.id,
      nickname: body.nickname,
      discord: body.discord,
      playTimeSlot: body.playTimeSlot,
      teacherId: body.teacherId,
    });

    return NextResponse.json(app);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'TEACHER_NOT_FOUND') return NextResponse.json({ error: '반장을 찾을 수 없습니다' }, { status: 404 });
    if (msg === 'TEACHER_FULL') return NextResponse.json({ error: '모집이 마감되었습니다' }, { status: 400 });
    if (msg === 'GRADUATED') return NextResponse.json({ error: '졸업생은 수강 신청할 수 없습니다' }, { status: 400 });
    if (msg === 'ALREADY_ASSIGNED') return NextResponse.json({ error: '이미 담당 반장이 배정되어 있습니다' }, { status: 400 });
    return apiError(e);
  }
}
