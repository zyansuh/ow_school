'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      // 탭 포커스마다 /api/auth/session(+DB) 재호출하면 체감이 느려짐
      refetchOnWindowFocus={false}
      refetchInterval={15 * 60}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
