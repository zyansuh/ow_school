'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AUTH_BOT_VS_LOGIN_NOTE, AUTH_ERROR_MESSAGES } from '@/lib/auth/errors';
import { MainLayout } from '@/components/layout/main-layout';
import { retryDiscordSignIn, signInWithDiscord } from '@/hooks/auth/use-discord-sign-in';
import { SITE_NAME } from '@/lib/site-brand';

const RETRY_ERRORS = new Set(['Configuration', 'InvalidCheck', 'OAuthCallbackError', 'OAuthSignin']);

type HealthDiscordSetup = {
  botInviteUrl?: string;
  oauthRedirectUri?: string;
};

type HealthPayload = {
  env?: { DISCORD_BOT_IN_GUILD?: string; DISCORD_OAUTH_CREDENTIALS?: string };
  discordSetup?: HealthDiscordSetup;
};

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
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    if (!error || !RETRY_ERRORS.has(error)) return;
    void fetch('/api/health')
      .then((r) => r.json())
      .then((data: HealthPayload) => setHealth(data))
      .catch(() => setHealth(null));
  }, [error]);

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

  const botMissing = health?.env?.DISCORD_BOT_IN_GUILD === 'no';
  const botInviteUrl = health?.discordSetup?.botInviteUrl;
  const oauthInvalid = health?.env?.DISCORD_OAUTH_CREDENTIALS === 'invalid_client';

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
              <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-left space-y-3">
                <p>{message}</p>
                {(error === 'Configuration' || error === 'OAuthCallbackError' || error === 'OAuthSignin') && (
                  <p className="text-xs text-amber-300/90 leading-relaxed">{AUTH_BOT_VS_LOGIN_NOTE}</p>
                )}
                {oauthInvalid && (
                  <p className="text-xs text-red-300/90">
                    서버 점검: Client ID·Secret이 Discord에서 거부되고 있습니다. Vercel Production 환경 변수를
                    확인한 뒤 Redeploy하세요.
                  </p>
                )}
                {botMissing && botInviteUrl && (
                  <p className="text-xs text-amber-200/90">
                    봇이 아직 서버에 없습니다.{' '}
                    <a
                      href={botInviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-amber-100"
                    >
                      Discord에서 봇 초대하기
                    </a>
                    {' '}후 아래 버튼으로 본인 계정 로그인을 시도하세요.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <Link href="/api/health" className="underline hover:text-foreground" target="_blank">
                    /api/health
                  </Link>
                  에서 OAuth·봇 상태를 확인할 수 있습니다.
                </p>
              </div>
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
