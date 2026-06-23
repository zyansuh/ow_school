import { NextResponse } from 'next/server';

/** Auth.js가 쓰는 쿠키 이름 (로컬·프로덕션·청크 세션 포함) */
const AUTH_COOKIE_BASES = [
  'authjs.session-token',
  'authjs.callback-url',
  'authjs.csrf-token',
  'authjs.pkce.code_verifier',
  '__Secure-authjs.session-token',
  '__Secure-authjs.callback-url',
  '__Secure-authjs.pkce.code_verifier',
  '__Host-authjs.csrf-token',
];

function expireCookie(response: NextResponse, name: string, secure: boolean) {
  response.cookies.set(name, '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: secure || name.startsWith('__Secure-') || name.startsWith('__Host-'),
  });
}

/** HttpOnly authjs 쿠키를 서버에서 만료시켜 OAuth PKCE 재시도를 가능하게 함 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  const production = process.env.NODE_ENV === 'production';

  for (const base of AUTH_COOKIE_BASES) {
    expireCookie(response, base, production);
    for (let i = 0; i < 8; i++) {
      expireCookie(response, `${base}.${i}`, production);
    }
  }

  return response;
}
