import { isTeacherFromDiscordRoles } from '@/lib/user-header';
import { parseRoleNames } from '@/lib/discord-guild';
import { findTeacherByDiscordUserId } from '@/lib/teacher-auth';

export type TeacherUserRef = {
  id: string;
  discordId: string;
  discordUsername: string;
  discordRoleNames?: string | null;
};

/** Discord 역할만으로 선생님 UI 접근 가능 여부 (Teacher 레코드 없어도 true 가능) */
export function hasTeacherDiscordRole(discordRoleNames?: string | null): boolean {
  return isTeacherFromDiscordRoles(parseRoleNames(discordRoleNames));
}

/**
 * Teacher 엔티티 연결 — 오직 discordUserId(User.discordId)만 허용.
 * 닉네임·username으로는 연결하지 않습니다.
 */
export async function resolveTeacherEntityForUser(user: TeacherUserRef) {
  return findTeacherByDiscordUserId(user.discordId);
}

/** 세션 isTeacher: Teacher 레코드 연결 또는 Discord 선생님 역할 */
export async function resolveIsTeacherForUser(user: TeacherUserRef): Promise<boolean> {
  const entity = await resolveTeacherEntityForUser(user);
  if (entity) return true;
  return hasTeacherDiscordRole(user.discordRoleNames);
}
