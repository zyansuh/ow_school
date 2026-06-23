import NextAuth from 'next-auth';
import { prisma, db } from '@/lib/prisma';
import { ensureDefaultAdmin, isAdmin } from '@/lib/rbac';
import { authConfig } from '@/lib/auth.config';
import {
  fetchGuildMember,
  getGuildConfig,
  parseRoleNames,
  syncUserGuildData,
} from '@/lib/discord-guild';

type DiscordProfile = {
  id: string;
  username?: string;
  global_name?: string | null;
  avatar?: string | null;
};

function discordUsernameFromProfile(p: DiscordProfile): string {
  return (p.username ?? p.global_name ?? '').trim();
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      discordId: string;
      discordUsername: string;
      discordNickname: string | null;
      discordAvatar: string | null;
      discordServerNick: string | null;
      discordRoleNames: string[];
      isInGuild: boolean;
      isAdmin: boolean;
      className: string | null;
      teacherName: string | null;
      status: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

async function syncTokenFromUser(userId: string, token: Record<string, unknown>) {
  const user = await db((client) =>
    client.user.findUnique({
      where: { id: userId },
      include: { class: true, teacher: true, adminRole: true },
    }),
  );
  if (!user) return token;

  token.userId = user.id;
  token.discordId = user.discordId;
  token.discordUsername = user.discordUsername;
  token.discordNickname = user.discordNickname;
  token.discordAvatar = user.discordAvatar;
  token.discordServerNick = user.discordServerNick;
  token.discordRoleNames = parseRoleNames(user.discordRoleNames);
  token.isInGuild = user.isInGuild;
  token.isAdmin = !!user.adminRole;
  token.className = user.class?.name ?? null;
  token.teacherName = user.teacher?.name ?? null;
  token.status = user.status;
  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  debug: process.env.NODE_ENV === 'development' || process.env.AUTH_DEBUG === 'true',
  logger: {
    error(error) {
      console.error('[auth]', error);
      const cause = error instanceof Error ? error.cause : undefined;
      if (cause) console.error('[auth] cause:', cause);
    },
    warn(code) {
      console.warn('[auth]', code);
    },
    debug(message, metadata) {
      if (process.env.AUTH_DEBUG === 'true') {
        console.debug('[auth]', message, metadata ?? '');
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile }) {
      try {
        const p = profile as DiscordProfile | undefined;
        const username = p ? discordUsernameFromProfile(p) : '';
        if (!p?.id || !username) {
          console.warn('[auth] signIn rejected: missing discord id/username', profile);
          return false;
        }

        if (getGuildConfig()) {
          const member = await fetchGuildMember(p.id);
          if (member === null) return '/login?error=NotInGuild';
          if (member === 'api_error') {
            console.warn('[auth] guild check skipped: Discord bot API error');
          }
        }

        return true;
      } catch (e) {
        console.error('[auth] signIn failed:', e);
        return false;
      }
    },
    async jwt({ token, profile, trigger }) {
      try {
        const p = profile as DiscordProfile | undefined;

        if (p?.id) {
          const username = discordUsernameFromProfile(p);
          const discordAvatar = p.avatar
            ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
            : null;

          const user = await db((client) =>
            client.user.upsert({
              where: { discordId: p.id },
              create: {
                discordId: p.id,
                discordUsername: username,
                discordNickname: p.global_name || username,
                discordAvatar,
              },
              update: {
                discordUsername: username,
                discordNickname: p.global_name || username,
                discordAvatar,
              },
            }),
          );

          await db((client) => ensureDefaultAdmin(username, user.id, client));

          if (getGuildConfig()) {
            await syncUserGuildData(p.id);
          }

          await syncTokenFromUser(user.id, token);
        } else if (token.userId) {
          if (trigger === 'update' && token.discordId) {
            await syncUserGuildData(token.discordId as string);
          }
          await syncTokenFromUser(token.userId as string, token);
          token.isAdmin = await db((client) => isAdmin(token.userId as string, client));
        }
      } catch (e) {
        console.error('[auth] jwt failed:', e);
      }

      return token;
    },
    async session({ session, token }) {
      const displayName =
        (token.discordServerNick as string) ??
        (token.discordNickname as string) ??
        (token.discordUsername as string);

      return {
        ...session,
        user: {
          id: token.userId as string,
          discordId: token.discordId as string,
          discordUsername: token.discordUsername as string,
          discordNickname: (token.discordNickname as string) ?? null,
          discordAvatar: (token.discordAvatar as string) ?? null,
          discordServerNick: (token.discordServerNick as string) ?? null,
          discordRoleNames: (token.discordRoleNames as string[]) ?? [],
          isInGuild: !!token.isInGuild,
          isAdmin: !!token.isAdmin,
          className: (token.className as string) ?? null,
          teacherName: (token.teacherName as string) ?? null,
          status: (token.status as string) ?? 'active',
          name: displayName,
          email: session.user?.email ?? null,
          image: (token.discordAvatar as string) ?? null,
        },
      };
    },
  },
});
