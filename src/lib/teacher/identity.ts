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

/** Discord `신입반교사` 역할 또는 Teacher DB 연결 */
export function hasTeacherDiscordRole(
  discordRoleNames?: string | null,
  ctx?: Pick<UserRoleContext, 'teacherDiscordUserIds'>,
  discordId?: string,
): boolean {
  if (isTeacherDiscordRole({ discordRoleNames })) return true;
  if (discordId && ctx?.teacherDiscordUserIds?.has(discordId)) return true;
  return false;
}

/**
 * Teacher 엔티티 연결 — 오직 discordUserId(User.discordId)만 허용.
 */
export async function resolveTeacherEntityForUser(user: TeacherUserRef) {
  return findTeacherByDiscordUserId(user.discordId);
}

/** 세션·권한: admin이면 teacher 아님. teacher는 신입반교사 역할 또는 Teacher 레코드 */
export async function resolveIsTeacherForUser(user: TeacherUserRef): Promise<boolean> {
  if (user.adminRole) return false;
  const ctx = await loadUserRoleContext();
  return getUserRole({ ...user, adminRole: user.adminRole }, ctx) === 'teacher';
}

/** @deprecated parseRoleNames 직접 사용 대신 user-role 모듈 사용 */
export { parseRoleNames };
