/** 디스코드 서버 가입 후 이 기간 미만이면 자동 분류 시 학생 */
export const STUDENT_GUILD_TENURE_MONTHS = 2;

export type GuildTenureFields = {
  isInGuild?: boolean;
  guildJoinedAt?: Date | null;
  createdAt?: Date;
};

export function parseDiscordJoinedAt(joinedAt?: string | null): Date | null {
  if (!joinedAt) return null;
  const date = new Date(joinedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Discord joined_at → 없으면 서버 가입 유저는 최초 로그인일을 보조 기준으로 사용 */
export function resolveGuildJoinedAt(user: GuildTenureFields): Date | null {
  if (user.guildJoinedAt) return user.guildJoinedAt;
  if (user.isInGuild && user.createdAt) return user.createdAt;
  return null;
}

export function isWithinStudentGuildTenure(joinedAt: Date, now = new Date()): boolean {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - STUDENT_GUILD_TENURE_MONTHS);
  return joinedAt > cutoff;
}

/** 서버 가입 2달 미만 → 학생 자동 분류 대상 */
export function isStudentByGuildTenure(user: GuildTenureFields, now = new Date()): boolean {
  if (!user.isInGuild) return false;
  const joined = resolveGuildJoinedAt(user);
  if (!joined) return false;
  return isWithinStudentGuildTenure(joined, now);
}
