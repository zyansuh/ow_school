import type { NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';

export const DISCORD_OAUTH_SCOPES = 'identify guilds guilds.members.read';

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: DISCORD_OAUTH_SCOPES } },
    }),
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' as const },
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
  },
} satisfies NextAuthConfig;
