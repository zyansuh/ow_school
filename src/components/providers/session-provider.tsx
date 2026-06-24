'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider refetchOnWindowFocus refetchInterval={15 * 60}>
      {children}
    </NextAuthSessionProvider>
  );
}
