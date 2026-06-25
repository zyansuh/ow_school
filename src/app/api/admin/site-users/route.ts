import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord/guild';
import { adminUserDisplayName, guildNicknameOnly, normalizeNickFields } from '@/lib/users/display';
import { resolveGuildJoinedAt } from '@/lib/discord/guild-tenure';
import {
  getUserRole,
  inferUserRole,
  isSiteUserRole,
  loadUserRoleContext,
  SITE_ROLE_LABELS,
} from '@/lib/users/role';

export async function GET() {
  try {
    await requireAdminUser();
    const roleCtx = await loadUserRoleContext();

    const users = await prisma.user.findMany({
      include: {
        class: true,
        teacher: true,
        adminRole: true,
        _count: { select: { interviews: true, applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      users.map((u) => {
        const fields = normalizeNickFields(u);
        const inferredRole = inferUserRole(u, roleCtx);
        const role = getUserRole(u, roleCtx);
        const siteRoleOverride = isSiteUserRole(u.siteRole) ? u.siteRole : null;
        const guildJoinedAt = resolveGuildJoinedAt(u);
        return {
          id: u.id,
          discordId: u.discordId,
          displayNickname: u.displayNickname,
          displayName: adminUserDisplayName(fields),
          guildNickname: guildNicknameOnly(fields) ?? '-',
          discordUsername: u.discordUsername,
          siteRole: siteRoleOverride,
          inferredRole,
          role,
          roleLabel: SITE_ROLE_LABELS[role],
          discordRoleNames: parseRoleNames(u.discordRoleNames),
          isInGuild: u.isInGuild,
          guildJoinedAt: guildJoinedAt?.toISOString() ?? null,
          className: u.class?.name ?? '미배정',
          teacherName: u.teacher?.name ?? '-',
          status: u.status,
          interviewCount: u._count.interviews,
          applicationCount: u._count.applications,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
