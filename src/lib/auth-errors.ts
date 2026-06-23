export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    'OAuth 인증 쿠키(PKCE)가 만료되었거나 맞지 않습니다. 아래 버튼으로 다시 시도해 주세요. (오류 상세는 브라우저가 아니라 `npm run dev` 터미널에 출력됩니다.)',
  AccessDenied: '로그인이 거부되었습니다.',
  InvalidCheck:
    '로그인 세션이 만료되었습니다. 주소창의 callback URL로 직접 들어가지 말고, 아래 버튼으로 다시 로그인해 주세요.',
  OAuthCallbackError:
    'Discord 인증 중 오류가 발생했습니다. Discord Client Secret과 Redirect URI를 확인한 뒤 다시 시도해 주세요.',
  OAuthSignin: 'Discord 로그인을 시작할 수 없습니다. 환경 변수를 확인해 주세요.',
  NotInGuild: '평화로운 게임마을 디스코드 서버에 가입한 뒤 다시 로그인해 주세요.',
  AuthError: '로그인 처리 중 오류가 발생했습니다. npm run db:setup 후 다시 시도해 주세요.',
};

/** 실패한 OAuth 흐름의 authjs 쿠키를 지워 PKCE 재시도가 가능하게 함 (HttpOnly는 서버 API 사용) */
export async function resetAuthCookies(): Promise<void> {
  await fetch('/api/auth/reset-cookies', { method: 'POST' });
}

/** @deprecated HttpOnly 쿠키는 삭제되지 않음. resetAuthCookies() 사용 */
export function clearAuthJsCookies() {
  if (typeof document === 'undefined') return;

  const names = document.cookie
    .split(';')
    .map((part) => part.split('=')[0]?.trim())
    .filter((name): name is string => !!name && name.includes('authjs'));

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
  }
}
