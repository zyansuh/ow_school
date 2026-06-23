'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    '서버 인증 설정 오류입니다. AUTH_SECRET·NEXTAUTH_URL을 확인하고 dev 서버를 재시작한 뒤, 브라우저 쿠키를 삭제하고 다시 로그인해 주세요.',
  AccessDenied: '로그인이 거부되었습니다.',
  InvalidCheck:
    '로그인 세션이 만료되었습니다. 주소창에 남은 callback URL로 들어가지 말고, 아래 버튼으로 다시 로그인해 주세요.',
  OAuthCallbackError: 'Discord 인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  OAuthSignin: 'Discord 로그인을 시작할 수 없습니다. 환경 변수를 확인해 주세요.',
  NotInGuild: '평화로운 게임마을 디스코드 서버에 가입한 뒤 다시 로그인해 주세요.',
  AuthError: '로그인 처리 중 오류가 발생했습니다. npm run db:setup 후 다시 시도해 주세요.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const message = error ? ERROR_MESSAGES[error] ?? `로그인 오류 (${error})` : null;

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
              onClick={() => signIn('discord', { callbackUrl })}
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
