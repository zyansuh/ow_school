import { NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { parseRoleNames } from '@/lib/discord-guild';
import { normalizeNickFields, adminUserDisplayName, guildNicknameOnly } from '@/lib/user-display';
import { findGraduatedStudentUsers } from '@/lib/student-users';

export async function GET() {
  try {
    await requireAdminUser();

    const users = await findGraduatedStudentUsers();

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        discordId: u.discordId,
        nickname: adminUserDisplayName(normalizeNickFields(u)),
        guildNickname: guildNicknameOnly(normalizeNickFields(u)),
        className: u.applications[0]?.class?.name ?? u.class?.name ?? '미배정',
        teacherName: u.applications[0]?.teacher?.name ?? u.teacher?.name ?? '-',
        roleNames: parseRoleNames(u.discordRoleNames),
        graduatedAt: u.updatedAt,
        createdAt: u.createdAt,
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}
