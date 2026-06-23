/** 헤더 등에 표시할 사용자 역할/반 라벨 */
export type UserHeaderFields = {
  isAdmin?: boolean;
  isTeacher?: boolean;
  className?: string | null;
};

export function userHeaderSubtitle(user: UserHeaderFields): string {
  if (user.isAdmin) return '관리자';
  if (user.isTeacher) return '선생님';
  return `현재 반 : ${user.className || '미배정'}`;
}

/** @deprecated user-role.ts 의 hasNewTeacherDiscordRole 사용 */
export { hasNewTeacherDiscordRole as isTeacherFromDiscordRoles } from '@/lib/user-role';
