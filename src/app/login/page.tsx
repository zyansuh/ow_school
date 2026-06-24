'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { AUTH_ERROR_MESSAGES } from '@/lib/auth-errors';
import { retryDiscordSignIn, signInWithDiscord } from '@/hooks/use-discord-sign-in';
import { SITE_NAME } from '@/lib/site-brand';

const RETRY_ERRORS = new Set(['Configuration', 'InvalidCheck', 'OAuthCallbackError', 'OAuthSignin']);

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const message = error ? (AUTH_ERROR_MESSAGES[error] ?? `로그인 오류 (${error})`) : null;
  const [pending, setPending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  async function handleDiscordSignIn() {
    setPending(true);
    try {
      if (error && RETRY_ERRORS.has(error)) {
        await retryDiscordSignIn(callbackUrl);
      } else {
        await signInWithDiscord(callbackUrl);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <MainLayout>
      <div className="page-container py-20 flex justify-center">
        <Card className="bg-gray-900/80 border-gray-800 w-full max-w-md">
          <div className="card-pad text-center space-y-6">
            <h1 className="text-2xl font-bold text-gray-100">Discord 로그인</h1>
            <p className="text-gray-400 text-sm">
              {SITE_NAME}은 Discord 계정으로만 로그인할 수 있습니다.
              <br />
              PC·모바일 모두 Discord에 이미 로그인되어 있으면 별도 입력 없이 연결됩니다.
            </p>
            {message && (
              <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-left">
                {message}
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={pending}
              onClick={() => void handleDiscordSignIn()}
            >
              {pending ? '연결 중…' : isMobile ? 'Discord 앱으로 로그인' : 'Discord로 계속하기'}
            </Button>
            {isMobile && (
              <p className="text-xs text-gray-500">
                Discord 앱이 설치되어 있으면 앱으로 자동 연결됩니다.
                카카오톡 등 인앱 브라우저에서는 Safari·Chrome으로 열어 주세요.
              </p>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
