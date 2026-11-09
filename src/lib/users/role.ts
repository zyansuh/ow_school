import { parseRoleNames } from '@/lib/discord/guild';
import { isStudentByGuildTenure } from '@/lib/discord/guild-tenure';
import { prisma } from '@/lib/prisma';
import { isDiscordSnowflake } from '@/lib/discord/id';
import {
  DEFAULT_TEACHER_DISCORD_ROLES,
  getTeacherDiscordRoles,
  hasAnyTeacherDiscordRole,
  resolveHighestTeacherDiscordRole,
  teacherDiscordRoleNames,
  type TeacherDiscordRoleEntry,
} from '@/lib/teacher/discord-roles';

/** @deprecated 단일 역할명 — DEFAULT_TEACHER_DISCORD_ROLES / SiteSetting 사용 */
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
  isInGuild?: boolean;
  guildJoinedAt?: Date | null;
  createdAt?: Date;
  adminRole?: unknown | null;
  discordRoleNames?: string | null;
  discordId?: string;
  discordUsername?: string;
  discordServerNick?: string | null;
  discordNickname?: string | null;
  /** 재학 배정 판별 — active + teacherId → student (가입 기간과 무관) */
  status?: string | null;
  teacherId?: string | null;
};

export type UserRoleContext = {
  /** 관리자에 등록된 Teacher.discordUserId — 역할 분류·운영의 1순위 */
  teacherDiscordUserIds: Set<string>;
  /** Teacher.discord 필드(서버 닉 등) — discordUserId 미연결 선생님 보조 매칭 */
  teacherDiscordNames: Set<string>;
  /** Discord 선생님 역할명 (SiteSetting 또는 기본값) */
  teacherDiscordRoles: TeacherDiscordRoleEntry[];
};

function normalizeTeacherNameKey(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase();
  return v && !isDiscordSnowflake(v) ? v : null;
}

function allowedRoleNames(ctx?: Pick<UserRoleContext, 'teacherDiscordRoles'>): string[] {
  const roles = ctx?.teacherDiscordRoles?.length
    ? ctx.teacherDiscordRoles
    : DEFAULT_TEACHER_DISCORD_ROLES;
  return teacherDiscordRoleNames(roles);
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

/** Discord 선생님 역할 보유 여부 (설정 목록 정확 매칭) */
export function hasNewTeacherDiscordRole(
  roleNames: string[],
  allowedNames: string[] = teacherDiscordRoleNames(DEFAULT_TEACHER_DISCORD_ROLES),
): boolean {
  return hasAnyTeacherDiscordRole(roleNames, allowedNames);
}

export function isTeacherDiscordRole(
  user: Pick<UserRoleFields, 'discordRoleNames'>,
  ctx?: Pick<UserRoleContext, 'teacherDiscordRoles'>,
): boolean {
  return hasNewTeacherDiscordRole(roleNamesFromUser(user), allowedRoleNames(ctx));
}

export function getTeacherDiscordRoleTier(
  user: Pick<UserRoleFields, 'discordRoleNames'>,
  ctx?: Pick<UserRoleContext, 'teacherDiscordRoles'>,
): TeacherDiscordRoleEntry | null {
  const roles = ctx?.teacherDiscordRoles?.length
    ? ctx.teacherDiscordRoles
    : DEFAULT_TEACHER_DISCORD_ROLES;
  return resolveHighestTeacherDiscordRole(roleNamesFromUser(user), roles);
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

/** 재학 중 담당 선생님 배정 — 가입 기간과 무관하게 학생으로 본다 */
export function isActiveAssignedStudentCandidate(
  user: Pick<UserRoleFields, 'status' | 'teacherId'>,
): boolean {
  return user.status === 'active' && !!user.teacherId;
}

/**
 * siteRole 미설정 시 자동 분류
 * 1) AdminRole → admin
 * 2) Teacher 등록 / Discord 선생님 역할 → teacher
 * 3) status=active && teacherId → student (2달 경과해도 유지)
 * 4) 가입 2달 미만 → student
 * 5) else → resident
 *
 * 명시적 siteRole(admin/teacher/student/resident)은 getUserRole에서 우선 적용.
 * graduated/withdrawn은 status≠active라 3번에 걸리지 않음.
 */
export function inferUserRole(user: UserRoleFields, ctx: UserRoleContext): SiteUserRole {
  if (isAdminUser(user)) return 'admin';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  if (isTeacherByTeacherRecordName(user, ctx)) return 'teacher';
  if (isTeacherDiscordRole(user, ctx)) return 'teacher';
  if (isActiveAssignedStudentCandidate(user)) return 'student';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
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
  return new Set(rows.map((r) => r.discordUserId).filter((id): id is string => !!id));
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

export function emptyUserRoleContext(): UserRoleContext {
  return {
    teacherDiscordUserIds: new Set(),
    teacherDiscordNames: new Set(),
    teacherDiscordRoles: [...DEFAULT_TEACHER_DISCORD_ROLES],
  };
}

export async function loadUserRoleContext(): Promise<UserRoleContext> {
  const [teacherDiscordUserIds, teacherDiscordNames, teacherDiscordRoles] = await Promise.all([
    loadTeacherDiscordUserIdSet(),
    loadTeacherDiscordNameSet(),
    getTeacherDiscordRoles(),
  ]);
  return { teacherDiscordUserIds, teacherDiscordNames, teacherDiscordRoles };
}

export function filterStudentUsers<T extends UserRoleFields>(
  users: T[],
  ctx: UserRoleContext,
): T[] {
  return users.filter((u) => isStudentUser(u, ctx));
}
