import { isTeacherFromDiscordRoles } from '@/lib/user-header';
import { parseRoleNames } from '@/lib/discord-guild';
import { findTeacherByDiscordUserId, findTeacherForDiscordUsername } from '@/lib/teacher-auth';
import { prisma } from '@/lib/prisma';

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
 * 실제 Teacher 엔티티 연결 — discordUserId 또는 username 백필만 허용.
 * 역할만으로는 null 반환.
 */
export async function resolveTeacherEntityForUser(user: TeacherUserRef) {
  const byDiscordId = await findTeacherByDiscordUserId(user.discordId);
  if (byDiscordId) return byDiscordId;

  const byUsername = await findTeacherForDiscordUsername(user.discordUsername);
  if (byUsername) {
    if (!byUsername.discordUserId) {
      await prisma.teacher.update({
        where: { id: byUsername.id },
        data: { discordUserId: user.discordId },
      });
      return { ...byUsername, discordUserId: user.discordId };
    }
    return byUsername;
  }

  return null;
}

/** 세션 isTeacher: Teacher 레코드 연결 또는 Discord 선생님 역할 */
export async function resolveIsTeacherForUser(user: TeacherUserRef): Promise<boolean> {
  const entity = await resolveTeacherEntityForUser(user);
  if (entity) return true;
  return hasTeacherDiscordRole(user.discordRoleNames);
}
