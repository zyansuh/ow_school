import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser, requireUser } from '@/lib/api-helpers';
import {
  createAdminRoleRequest,
  reviewAdminRoleRequest,
  grantAdminWithAudit,
  revokeAdminWithAudit,
} from '@/lib/admin/role-requests';
import { prisma } from '@/lib/prisma';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get('scope');
    if (scope === 'audit') {
      await requireAdminUser();
      const logs = await prisma.adminRoleAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
      return NextResponse.json(logs);
    }

    await requireAdminUser();
    const requests = await prisma.adminRoleRequest.findMany({
      where: { status: 'pending' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(
      requests.map((r) => ({
        ...r,
        displayName: adminUserDisplayName(normalizeNickFields(r.user)),
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}

const requestSchema = z.object({ message: z.string().max(500).optional() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = requestSchema.parse(await req.json().catch(() => ({})));
    const request = await createAdminRoleRequest(user.id, body.message);
    return NextResponse.json(request, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'ALREADY_ADMIN') return NextResponse.json({ error: '이미 관리자입니다' }, { status: 409 });
    if (msg === 'REQUEST_PENDING') return NextResponse.json({ error: '이미 요청이 대기 중입니다' }, { status: 409 });
    return apiError(e);
  }
}

const reviewSchema = z.object({
  requestId: z.string(),
  approve: z.boolean(),
  note: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = reviewSchema.parse(await req.json());
    const result = await reviewAdminRoleRequest(body.requestId, admin.id, body.approve, body.note);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: '요청을 찾을 수 없습니다' }, { status: 404 });
    return apiError(e);
  }
}
