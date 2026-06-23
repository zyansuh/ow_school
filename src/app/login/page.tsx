'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { AUTH_ERROR_MESSAGES, clearAuthJsCookies } from '@/lib/auth-errors';

const RETRY_ERRORS = new Set(['Configuration', 'InvalidCheck', 'OAuthCallbackError', 'OAuthSignin']);

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = error ? '/' : searchParams.get('callbackUrl') || '/';
  const message = error ? (AUTH_ERROR_MESSAGES[error] ?? `로그인 오류 (${error})`) : null;

  useEffect(() => {
    if (error && RETRY_ERRORS.has(error)) {
      clearAuthJsCookies();
    }
  }, [error]);

  return (
    <MainLayout>
      <div className="page-container py-20 flex justify-center">
        <Card className="bg-gray-900/80 border-gray-800 w-full max-w-md">
          <div className="card-pad text-center space-y-6">
            <h1 className="text-2xl font-bold text-gray-100">Discord 로그인</h1>
            <p className="text-gray-400 text-sm">
              OW School은 Discord 계정으로만 로그인할 수 있습니다.
            </p>
            {message && (
              <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-left">
                {message}
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={() => signIn('discord', { callbackUrl, redirect: true })}
            >
              Discord로 계속하기
            </Button>
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
