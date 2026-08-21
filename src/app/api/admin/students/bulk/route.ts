import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { assignStudentTeacher } from '@/lib/students/assignment';
import { graduateUser } from '@/lib/students/graduation';
import { withdrawStudent } from '@/lib/students/withdrawal';
import { isStudentUser, loadUserRoleContext } from '@/lib/users/role';

const bulkSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(['assignTeacher', 'graduate', 'withdraw']),
  teacherId: z.string().nullable().optional(),
});

/** 학생 일괄 담당 변경·졸업·퇴교 (최대 100명) */
export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = bulkSchema.parse(await req.json());
    const ctx = await loadUserRoleContext();

    if (body.action === 'assignTeacher' && body.teacherId === undefined) {
      return NextResponse.json({ error: 'teacherId가 필요합니다' }, { status: 400 });
    }

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const id of body.userIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id },
          include: { adminRole: true },
        });
        if (!user || !isStudentUser(user, ctx)) {
          results.push({ id, ok: false, error: '학생이 아닙니다' });
          continue;
        }

        if (body.action === 'assignTeacher') {
          if (user.status !== 'active') {
            results.push({ id, ok: false, error: '재학생만 담당 변경 가능' });
            continue;
          }
          await assignStudentTeacher(id, body.teacherId ?? null);
          results.push({ id, ok: true });
          continue;
        }

        if (body.action === 'graduate') {
          if (user.status === 'graduated') {
            results.push({ id, ok: false, error: '이미 졸업' });
            continue;
          }
          await graduateUser(id, { sendTeacherDm: false });
          results.push({ id, ok: true });
          continue;
        }

        if (body.action === 'withdraw') {
          if (user.status !== 'active') {
            results.push({ id, ok: false, error: '재학생만 퇴교 가능' });
            continue;
          }
          await withdrawStudent(id);
          results.push({ id, ok: true });
        }
      } catch (err) {
        results.push({
          id,
          ok: false,
          error: err instanceof Error ? err.message : '처리 실패',
        });
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    return NextResponse.json({
      ok: true,
      okCount,
      failCount: results.length - okCount,
      results,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
