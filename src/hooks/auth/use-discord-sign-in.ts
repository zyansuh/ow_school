'use client';

import { signIn } from 'next-auth/react';
import { resetAuthCookies } from '@/lib/auth/errors';

function resolveCallbackUrl(callbackUrl?: string): string {
  if (callbackUrl) return callbackUrl;
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

/** Discord OAuth 시작 — PC/모바일 공통, 로그인된 Discord 세션 자동 활용 */
export async function signInWithDiscord(callbackUrl?: string) {
  await signIn('discord', {
    callbackUrl: resolveCallbackUrl(callbackUrl),
    redirect: true,
  });
}

/** PKCE·쿠키 오류 후 재시도 */
export async function retryDiscordSignIn(callbackUrl?: string) {
  await resetAuthCookies();
  await signInWithDiscord(callbackUrl);
}
