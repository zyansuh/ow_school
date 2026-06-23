/** Discord 닉네임 필드 (DB: discordServerNickname, discordDisplayName, discordUsername) */
export type UserNickFields = {
  discordServerNickname?: string | null;
  discordDisplayName?: string | null;
  discordUsername: string;
  /** @deprecated Prisma 레거시 필드명 호환 */
  discordServerNick?: string | null;
  /** @deprecated Prisma 레거시 필드명 호환 */
  discordNickname?: string | null;
  siteDisplayName?: string | null;
};

/** @deprecated siteDisplayName은 더 이상 표시에 사용하지 않음 */

function guildNick(user: UserNickFields): string | null {
  const nick = user.discordServerNickname ?? user.discordServerNick;
  return nick?.trim() || null;
}

function globalDisplay(user: UserNickFields): string | null {
  const name = user.discordDisplayName ?? user.discordNickname;
  return name?.trim() || null;
}

/** 1순위 서버 닉 → 2순위 글로벌 표시 이름 → 3순위 유저네임 */
export function userDisplayName(user: UserNickFields): string {
  return guildNick(user) || globalDisplay(user) || user.discordUsername;
}

/** 서버 닉네임 컬럼 값만 (없으면 null) */
export function guildNicknameOnly(user: UserNickFields): string | null {
  return guildNick(user);
}

/** 화면 표시: 서버 닉 → 글로벌 → 유저네임 (displayName 우회 없음) */
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
  siteDisplayName?: string | null;
}): UserNickFields {
  return {
    discordUsername: user.discordUsername,
    discordDisplayName: user.discordDisplayName ?? user.discordNickname,
    discordServerNickname: user.discordServerNickname ?? user.discordServerNick,
    siteDisplayName: user.siteDisplayName,
  };
}
