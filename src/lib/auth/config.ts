import type { NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { getDiscordClientId, getDiscordClientSecret, normalizeEnvValue } from '@/lib/auth/env';
import { ensureAuthUrlEnv } from '@/lib/auth/url';

function authSecret() {
  return normalizeEnvValue(process.env.AUTH_SECRET) || normalizeEnvValue(process.env.NEXTAUTH_SECRET);
}

export const DISCORD_OAUTH_SCOPES = 'identify guilds guilds.members.read';

export const DISCORD_OAUTH_REDIRECT_PATH = '/api/auth/callback/discord';

type DiscordApiProfile = {
  id: string;
  username?: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  discriminator?: string;
};

/** Discord avatar null/undefined 모두 안전하게 처리 */
function discordProfile(profile: DiscordApiProfile) {
  let image: string | undefined;
  if (!profile.avatar) {
    const discriminator = profile.discriminator ?? '0';
    const defaultAvatarNumber =
      discriminator === '0'
        ? Number(BigInt(profile.id) >> BigInt(22)) % 6
        : parseInt(discriminator, 10) % 5;
    image = `https://cdn.discordapp.com/embed/avatars/${Number.isFinite(defaultAvatarNumber) ? defaultAvatarNumber : 0}.png`;
  } else {
    const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
    image = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
  }

  return {
    id: profile.id,
    name: profile.global_name ?? profile.username,
    email: profile.email ?? undefined,
    image,
  };
}

/**
 * 요청마다 secret·Client ID/Secret을 다시 읽습니다.
 * Discord 토큰 교환은 client_secret_post — Basic 헤더+특수문자 Secret 이슈를 피합니다.
 */
export function createAuthConfig(): NextAuthConfig {
  ensureAuthUrlEnv();

  return {
    trustHost: true,
    secret: authSecret() || undefined,
    providers: [
      Discord({
        clientId: getDiscordClientId(),
        clientSecret: getDiscordClientSecret(),
        client: { token_endpoint_auth_method: 'client_secret_post' },
        authorization: { params: { scope: DISCORD_OAUTH_SCOPES } },
        profile: discordProfile,
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
  };
}

/** @deprecated createAuthConfig() 사용 — 모듈 로드 시점 값 고정 방지 */
export const authConfig = createAuthConfig();
