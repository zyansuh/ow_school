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

const TEACHER_ROLE_PATTERN = /선생님|teacher|멘토/i;

export function isTeacherFromDiscordRoles(roleNames: string[]): boolean {
  return roleNames.some((r) => TEACHER_ROLE_PATTERN.test(r));
}
