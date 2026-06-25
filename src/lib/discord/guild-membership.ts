/**
 * DB에 저장된 Discord 서버 가입 여부 — 표시·API 응답용 단일 기준.
 * (로그인 게이트는 auth signIn 콜백의 checkUserGuildMembership이 별도 처리)
 */
export function resolveGuildMembershipFromDb(dbIsInGuild: boolean): boolean {
  return !!dbIsInGuild;
}
