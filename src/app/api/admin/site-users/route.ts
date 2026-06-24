import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { adminUserDisplayName, guildNicknameOnly, normalizeNickFields } from '@/lib/user-display';
import { getUserRole, loadUserRoleContext } from '@/lib/user-role';

const ROLE_LABELS = {
  admin: '관리자',
  teacher: '선생님',
  student: '학생',
} as const;

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
        const siteRole = getUserRole(u, roleCtx);
        return {
          id: u.id,
          discordId: u.discordId,
          displayName: adminUserDisplayName(fields),
          guildNickname: guildNicknameOnly(fields) ?? '-',
          discordUsername: u.discordUsername,
          role: siteRole,
          roleLabel: ROLE_LABELS[siteRole],
          discordRoleNames: parseRoleNames(u.discordRoleNames),
          isInGuild: u.isInGuild,
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
