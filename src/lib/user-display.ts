/** Discord 서버 닉 → 사이트 표시명 → 전역 표시 이름 → 유저네임 순으로 표시 이름 결정 */
export type UserNickFields = {
  siteDisplayName?: string | null;
  discordServerNick?: string | null;
  discordNickname?: string | null;
  discordUsername: string;
};

export function userDisplayName(user: UserNickFields): string {
  return (
    user.siteDisplayName?.trim() ||
    user.discordServerNick ||
    user.discordNickname ||
    user.discordUsername
  );
}

/** API /api/me 응답 등 displayName 필드가 있거나 닉 필드만 있는 객체에서 표시 이름 추출 */
export function resolveDisplayName(
  user: UserNickFields & { displayName?: string | null },
): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  return userDisplayName(user);
}
