import { parseRoleNames } from '@/lib/discord-guild';
import { prisma } from '@/lib/prisma';

/** Discord 서버 역할명 — 정확히 일치해야 선생님으로 분류 */
export const TEACHER_DISCORD_ROLE_NAME = '신입반교사';

export type SiteUserRole = 'admin' | 'teacher' | 'student';

export type UserRoleFields = {
  adminRole?: unknown | null;
  discordRoleNames?: string | null;
  discordId?: string;
};

export type UserRoleContext = {
  teacherDiscordUserIds: Set<string>;
};

export function roleNamesFromUser(user: Pick<UserRoleFields, 'discordRoleNames'>): string[] {
  return parseRoleNames(user.discordRoleNames);
}

export function isAdminUser(user: Pick<UserRoleFields, 'adminRole'>): boolean {
  return !!user.adminRole;
}

/** Discord `신입반교사` 역할 보유 여부 (정확 매칭) */
export function hasNewTeacherDiscordRole(roleNames: string[]): boolean {
  return roleNames.includes(TEACHER_DISCORD_ROLE_NAME);
}

export function isTeacherDiscordRole(user: Pick<UserRoleFields, 'discordRoleNames'>): boolean {
  return hasNewTeacherDiscordRole(roleNamesFromUser(user));
}

export function isTeacherByDiscordUserId(
  discordId: string | undefined,
  ctx: UserRoleContext,
): boolean {
  if (!discordId) return false;
  return ctx.teacherDiscordUserIds.has(discordId);
}

/**
 * 대상 사용자 역할 (admin > teacher > student)
 * 현재 로그인 사용자가 아닌 target user 기준
 */
export function getUserRole(user: UserRoleFields, ctx: UserRoleContext): SiteUserRole {
  if (isAdminUser(user)) return 'admin';
  if (isTeacherDiscordRole(user)) return 'teacher';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  return 'student';
}

export function isTeacherUser(user: UserRoleFields, ctx: UserRoleContext): boolean {
  return getUserRole(user, ctx) === 'teacher';
}

export function isStudentUser(user: UserRoleFields, ctx: UserRoleContext): boolean {
  return getUserRole(user, ctx) === 'student';
}

export async function loadTeacherDiscordUserIdSet(): Promise<Set<string>> {
  const rows = await prisma.teacher.findMany({
    where: { discordUserId: { not: null } },
    select: { discordUserId: true },
  });
  return new Set(
    rows.map((r) => r.discordUserId).filter((id): id is string => !!id),
  );
}

export async function loadUserRoleContext(): Promise<UserRoleContext> {
  return { teacherDiscordUserIds: await loadTeacherDiscordUserIdSet() };
}

export function filterStudentUsers<T extends UserRoleFields>(
  users: T[],
  ctx: UserRoleContext,
): T[] {
  return users.filter((u) => isStudentUser(u, ctx));
}
