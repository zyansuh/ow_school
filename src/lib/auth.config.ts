import type { NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { ensureAuthUrlEnv } from '@/lib/auth-url';

ensureAuthUrlEnv();

function authSecret() {
  return process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
}

export const DISCORD_OAUTH_SCOPES = 'identify guilds guilds.members.read';

export const authConfig = {
  trustHost: true,
  secret: authSecret(),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!.trim(),
      clientSecret: process.env.DISCORD_CLIENT_SECRET!.trim(),
      authorization: { params: { scope: DISCORD_OAUTH_SCOPES } },
    }),
  ],
  pages: { signIn: '/login', error: '/auth-error' },
  session: { strategy: 'jwt' as const, maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return !!auth?.user?.isAdmin;
      }
      return true;
    },
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: (token.userId as string) ?? session.user?.id,
          isAdmin: !!token.isAdmin,
        },
      };
    },
  },
} satisfies NextAuthConfig;
