import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { resolveTeacherForUser } from '@/lib/teacher-auth';

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdminUser() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

export async function requireTeacherUser() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new Error('UNAUTHORIZED');
  const teacher = await resolveTeacherForUser(dbUser);
  if (!teacher) throw new Error('FORBIDDEN');
  return { user, teacher };
}

export function apiError(error: unknown) {
  const msg = error instanceof Error ? error.message : 'UNKNOWN';
  if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  if (msg === 'FORBIDDEN') return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  return NextResponse.json({ error: '서버 오류' }, { status: 500 });
}
