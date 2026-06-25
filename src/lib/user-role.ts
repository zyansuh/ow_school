import { parseRoleNames } from '@/lib/discord-guild';
import { prisma } from '@/lib/prisma';
import { isDiscordSnowflake } from '@/lib/discord-id';

/** Discord 서버 역할명 — 정확히 일치해야 선생님으로 분류 */
export const TEACHER_DISCORD_ROLE_NAME = '신입반교사';

export const SITE_USER_ROLES = ['resident', 'student', 'teacher', 'admin'] as const;
export type SiteUserRole = (typeof SITE_USER_ROLES)[number];

export const SITE_ROLE_LABELS: Record<SiteUserRole, string> = {
  resident: '마을주민',
  student: '학생',
  teacher: '선생님',
  admin: '관리자',
};

export type UserRoleFields = {
  siteRole?: string | null;
  adminRole?: unknown | null;
  discordRoleNames?: string | null;
  discordId?: string;
  discordUsername?: string;
  discordServerNick?: string | null;
  discordNickname?: string | null;
};

export type UserRoleContext = {
  teacherDiscordUserIds: Set<string>;
  /** Teacher.discord 필드(서버 닉 등) — discordUserId 미연결 선생님 보조 매칭 */
  teacherDiscordNames: Set<string>;
};

function normalizeTeacherNameKey(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase();
  return v && !isDiscordSnowflake(v) ? v : null;
}

export function isSiteUserRole(value: string | null | undefined): value is SiteUserRole {
  return SITE_USER_ROLES.includes(value as SiteUserRole);
}

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

/** Teacher.discord 문자열과 유저 닉·username 매칭 (discordUserId 미연결 대비) */
export function isTeacherByTeacherRecordName(
  user: Pick<UserRoleFields, 'discordUsername' | 'discordServerNick' | 'discordNickname'>,
  ctx: UserRoleContext,
): boolean {
  if (!ctx.teacherDiscordNames.size) return false;
  for (const candidate of [user.discordServerNick, user.discordNickname, user.discordUsername]) {
    const key = normalizeTeacherNameKey(candidate);
    if (key && ctx.teacherDiscordNames.has(key)) return true;
  }
  return false;
}

/** siteRole 미설정 시 Discord·Teacher·AdminRole 기준 자동 분류 */
export function inferUserRole(user: UserRoleFields, ctx: UserRoleContext): SiteUserRole {
  if (isAdminUser(user)) return 'admin';
  if (isTeacherDiscordRole(user)) return 'teacher';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  if (isTeacherByTeacherRecordName(user, ctx)) return 'teacher';
  return 'student';
}

/**
 * 사이트 이용자 역할 — 관리자 지정(siteRole) 우선, 없으면 자동 분류
 */
export function getUserRole(user: UserRoleFields, ctx: UserRoleContext): SiteUserRole {
  const override = user.siteRole?.trim();
  if (isSiteUserRole(override)) return override;
  return inferUserRole(user, ctx);
}

export function getUserRoleLabel(user: UserRoleFields, ctx: UserRoleContext): string {
  return SITE_ROLE_LABELS[getUserRole(user, ctx)];
}

export function isTeacherUser(user: UserRoleFields, ctx: UserRoleContext): boolean {
  return getUserRole(user, ctx) === 'teacher';
}

export function isStudentUser(user: UserRoleFields, ctx: UserRoleContext): boolean {
  return getUserRole(user, ctx) === 'student';
}

export function isResidentUser(user: UserRoleFields, ctx: UserRoleContext): boolean {
  return getUserRole(user, ctx) === 'resident';
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

async function loadTeacherDiscordNameSet(): Promise<Set<string>> {
  const rows = await prisma.teacher.findMany({
    where: { discord: { not: null } },
    select: { discord: true },
  });
  const names = new Set<string>();
  for (const row of rows) {
    const key = normalizeTeacherNameKey(row.discord);
    if (key) names.add(key);
  }
  return names;
}

export async function loadUserRoleContext(): Promise<UserRoleContext> {
  const [teacherDiscordUserIds, teacherDiscordNames] = await Promise.all([
    loadTeacherDiscordUserIdSet(),
    loadTeacherDiscordNameSet(),
  ]);
  return { teacherDiscordUserIds, teacherDiscordNames };
}

export function filterStudentUsers<T extends UserRoleFields>(
  users: T[],
  ctx: UserRoleContext,
): T[] {
  return users.filter((u) => isStudentUser(u, ctx));
}
