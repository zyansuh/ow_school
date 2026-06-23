/** Discord 닉네임 필드 (DB: discordServerNick, discordNickname, discordUsername) */
export type UserNickFields = {
  discordServerNickname?: string | null;
  discordDisplayName?: string | null;
  discordUsername: string;
  /** 관리자 홈페이지 표시용 오버라이드 (Discord 서버 닉 변경 아님) */
  displayNickname?: string | null;
  /** Prisma 레거시 필드명 호환 */
  discordServerNick?: string | null;
  discordNickname?: string | null;
};

function guildNick(user: UserNickFields): string | null {
  const nick = user.discordServerNickname ?? user.discordServerNick;
  return nick?.trim() || null;
}

function globalDisplay(user: UserNickFields): string | null {
  const name = user.discordDisplayName ?? user.discordNickname;
  return name?.trim() || null;
}

/** 일반 화면: 1순위 guildNickname → 2순위 displayName → 3순위 username */
export function userDisplayName(user: UserNickFields): string {
  return guildNick(user) || globalDisplay(user) || user.discordUsername;
}

/** 관리자 화면: 1순위 displayNickname → 2순위 guild → 3순위 global → 4순위 username */
export function adminUserDisplayName(user: UserNickFields): string {
  const override = user.displayNickname?.trim();
  if (override) return override;
  return userDisplayName(user);
}

/** 서버 닉네임 컬럼 값만 (없으면 null) */
export function guildNicknameOnly(user: UserNickFields): string | null {
  return guildNick(user);
}

/** @deprecated userDisplayName 사용 */
export function resolveDisplayName(user: UserNickFields): string {
  return userDisplayName(user);
}

/** Prisma User → 표시용 닉네임 필드 정규화 */
export function normalizeNickFields(user: {
  discordUsername: string;
  discordNickname?: string | null;
  discordServerNick?: string | null;
  discordDisplayName?: string | null;
  discordServerNickname?: string | null;
  displayNickname?: string | null;
}): UserNickFields {
  return {
    discordUsername: user.discordUsername,
    discordDisplayName: user.discordDisplayName ?? user.discordNickname,
    discordServerNickname: user.discordServerNickname ?? user.discordServerNick,
    displayNickname: user.displayNickname ?? null,
  };
}
