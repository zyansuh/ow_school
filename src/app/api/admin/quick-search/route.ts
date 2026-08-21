import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import {
  getUserRole,
  loadUserRoleContext,
  SITE_ROLE_LABELS,
} from '@/lib/users/role';
import { normalizeClassLabel } from '@/lib/admin/class-filter';

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const roleCtx = await loadUserRoleContext();
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { discordId: { contains: q } },
          { discordUsername: { contains: q, mode: 'insensitive' } },
          { discordNickname: { contains: q, mode: 'insensitive' } },
          { discordServerNick: { contains: q, mode: 'insensitive' } },
          { displayNickname: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      include: {
        adminRole: true,
        class: true,
        _count: { select: { interviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      users.map((u) => {
        const fields = normalizeNickFields(u);
        const role = getUserRole(u, roleCtx);
        return {
          id: u.id,
          displayName: adminUserDisplayName(fields),
          discordId: u.discordId,
          status: u.status,
          className: normalizeClassLabel(u.class?.name),
          role,
          roleLabel: SITE_ROLE_LABELS[role],
          interviewCount: u._count.interviews,
        };
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
