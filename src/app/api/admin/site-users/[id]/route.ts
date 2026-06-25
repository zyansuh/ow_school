import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { logAdminRoleAction } from '@/lib/admin/role-requests';
import { graduateUser, restoreGraduatedUser } from '@/lib/students/graduation';
import { adminUserDisplayName, guildNicknameOnly, normalizeNickFields } from '@/lib/users/display';
import {
  getUserRole,
  inferUserRole,
  isSiteUserRole,
  isStudentUser,
  loadUserRoleContext,
  SITE_ROLE_LABELS,
} from '@/lib/users/role';

const patchSchema = z.object({
  displayNickname: z.string().max(32).nullable().optional(),
  siteRole: z.enum(['resident', 'student', 'teacher', 'admin']).nullable().optional(),
  statusAction: z.enum(['graduate', 'ungraduate']).optional(),
});

/** 표시 닉네임·사이트 역할·졸업 상태만 수정 — 다른 User 필드는 변경하지 않음 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdminUser();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    if (
      body.displayNickname === undefined &&
      body.siteRole === undefined &&
      body.statusAction === undefined
    ) {
      return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { adminRole: true },
    });
    if (!existing) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const roleCtx = await loadUserRoleContext();
    const inferredRole = inferUserRole(existing, roleCtx);

    if (body.statusAction === 'ungraduate') {
      if (existing.status !== 'graduated') {
        return NextResponse.json({ error: '졸업생이 아닙니다' }, { status: 400 });
      }
      const restored = await restoreGraduatedUser(id);
      if (!restored) {
        return NextResponse.json({ error: '복구에 실패했습니다' }, { status: 500 });
      }
      const full = await prisma.user.findUnique({
        where: { id },
        include: { adminRole: true },
      });
      const role = full ? getUserRole(full, roleCtx) : inferUserRole(restored, roleCtx);
      return NextResponse.json({
        id,
        status: restored.status,
        role,
        roleLabel: SITE_ROLE_LABELS[role],
      });
    }

    if (body.statusAction === 'graduate') {
      if (!isStudentUser(existing, roleCtx)) {
        return NextResponse.json({ error: '학생만 졸업 처리할 수 있습니다' }, { status: 400 });
      }
      if (existing.status === 'graduated') {
        return NextResponse.json({ error: '이미 졸업 처리된 사용자입니다' }, { status: 400 });
      }
      await graduateUser(id);
      const graduated = await prisma.user.findUnique({
        where: { id },
        include: { adminRole: true },
      });
      const role = graduated ? getUserRole(graduated, roleCtx) : inferredRole;
      return NextResponse.json({
        id,
        status: 'graduated',
        role,
        roleLabel: SITE_ROLE_LABELS[role],
      });
    }

    if (body.siteRole !== undefined && body.siteRole !== null && !isSiteUserRole(body.siteRole)) {
      return NextResponse.json({ error: '유효하지 않은 역할입니다' }, { status: 400 });
    }

    const hadAdmin = !!existing.adminRole;

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(body.displayNickname !== undefined
            ? { displayNickname: body.displayNickname?.trim() || null }
            : {}),
          ...(body.siteRole !== undefined ? { siteRole: body.siteRole } : {}),
        },
        include: { adminRole: true },
      });

      if (body.siteRole === 'admin') {
        await tx.adminRole.upsert({
          where: { userId: id },
          create: { userId: id, grantedById: actor.id },
          update: { grantedById: actor.id },
        });
      } else if (body.siteRole !== undefined && body.siteRole !== null && hadAdmin) {
        await tx.adminRole.delete({ where: { userId: id } });
      }

      return user;
    });

    if (body.siteRole === 'admin' && !hadAdmin) {
      await logAdminRoleAction('grant', id, actor.id);
    } else if (
      body.siteRole !== undefined &&
      body.siteRole !== null &&
      body.siteRole !== 'admin' &&
      hadAdmin
    ) {
      await logAdminRoleAction('revoke', id, actor.id);
    }

    const fields = normalizeNickFields(updated);
    const role = getUserRole(updated, roleCtx);

    return NextResponse.json({
      id: updated.id,
      displayNickname: updated.displayNickname,
      displayName: adminUserDisplayName(fields),
      guildNickname: guildNicknameOnly(fields) ?? '-',
      siteRole: isSiteUserRole(updated.siteRole) ? updated.siteRole : null,
      inferredRole,
      role,
      roleLabel: SITE_ROLE_LABELS[role],
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
