import { parseRoleNames } from '@/lib/discord/guild';
import { findTeacherByDiscordUserId } from '@/lib/teacher/auth';
import {
  getUserRole,
  isTeacherDiscordRole,
  loadUserRoleContext,
  type UserRoleContext,
} from '@/lib/users/role';

export type TeacherUserRef = {
  id: string;
  discordId: string;
  discordUsername: string;
  discordRoleNames?: string | null;
  adminRole?: unknown | null;
};

/** 등록된 Teacher 연결 또는 Discord 선생님 역할(설정 목록) */
export function hasTeacherDiscordRole(
  discordRoleNames?: string | null,
  ctx?: Pick<UserRoleContext, 'teacherDiscordUserIds' | 'teacherDiscordRoles'>,
  discordId?: string,
): boolean {
  // 관리자 등록(discordUserId) 우선
  if (discordId && ctx?.teacherDiscordUserIds?.has(discordId)) return true;
  if (isTeacherDiscordRole({ discordRoleNames }, ctx)) return true;
  return false;
}

/**
 * Teacher 엔티티 연결 — 오직 discordUserId(User.discordId)만 허용.
 */
export async function resolveTeacherEntityForUser(user: TeacherUserRef) {
  return findTeacherByDiscordUserId(user.discordId);
}

/** 세션·권한: admin이면 teacher 아님. teacher는 등록 Teacher 또는 Discord 선생님 역할 */
export async function resolveIsTeacherForUser(user: TeacherUserRef): Promise<boolean> {
  if (user.adminRole) return false;
  const ctx = await loadUserRoleContext();
  return getUserRole({ ...user, adminRole: user.adminRole }, ctx) === 'teacher';
}

/** @deprecated parseRoleNames 직접 사용 대신 user-role 모듈 사용 */
export { parseRoleNames };
