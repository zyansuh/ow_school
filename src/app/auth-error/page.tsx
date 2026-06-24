'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AUTH_ERROR_MESSAGES, resetAuthCookies } from '@/lib/auth-errors';

function AuthErrorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error') ?? 'Configuration';
  const callbackUrl = searchParams.get('callbackUrl');

  useEffect(() => {
    void resetAuthCookies().finally(() => {
      const params = new URLSearchParams({ error });
      if (callbackUrl) params.set('callbackUrl', callbackUrl);
      router.replace(`/login?${params.toString()}`);
    });
  }, [callbackUrl, error, router]);

  const message = AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Configuration;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-300 p-6">
      <p className="text-sm text-center max-w-md">{message}</p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorRedirect />
    </Suspense>
  );
}
