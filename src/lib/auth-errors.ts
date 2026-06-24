export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    'Discord OAuth 인증에 실패했습니다. 대부분 Client Secret이 잘못됐거나 만료된 경우입니다. Discord Developer Portal → OAuth2에서 Client Secret을 재발급하고 `.env`의 DISCORD_CLIENT_SECRET에 붙여넣은 뒤 dev 서버를 재시작하세요. (PKCE·쿠키 문제일 수도 있습니다.)',
  AccessDenied: '로그인이 거부되었습니다. Discord 계정 정보를 확인하거나 잠시 후 다시 시도해 주세요.',
  InvalidCheck:
    '로그인 세션이 만료되었습니다. 주소창의 callback URL로 직접 들어가지 말고, 아래 버튼으로 다시 로그인해 주세요. (모바일 인앱 브라우저는 Safari·Chrome에서 열어 주세요.)',
  OAuthCallbackError:
    'Discord Client ID 또는 Client Secret이 올바르지 않습니다. Developer Portal에서 Secret을 재발급하고 .env·Vercel에 동일하게 설정하세요.',
  OAuthSignin: 'Discord 로그인을 시작할 수 없습니다. 환경 변수를 확인해 주세요.',
  NotInGuild:
    '평화로운 게임마을 디스코드 서버에 가입한 Discord 계정으로 로그인해 주세요. 다른 계정이면 로그아웃 후 다시 시도하세요.',
  AuthError: '회원 정보 저장에 실패했습니다. 데이터베이스 연결을 확인한 뒤 다시 시도해 주세요.',
  SessionRequired: '로그인이 필요합니다. Discord로 다시 로그인해 주세요.',
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
