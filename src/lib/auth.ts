import NextAuth from 'next-auth';
import { prisma, db } from '@/lib/prisma';
import { ensureDefaultAdmin, isAdmin } from '@/lib/rbac';
import { authConfig } from '@/lib/auth.config';
import {
  checkUserGuildMembership,
  getGuildConfig,
  parseRoleNames,
  syncUserGuildData,
  syncUserGuildDataBestEffort,
} from '@/lib/discord-guild';
import { userDisplayName } from '@/lib/user-display';
import { isTeacherFromDiscordRoles } from '@/lib/user-header';

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
      isTeacher: boolean;
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

  const roleNames = parseRoleNames(user.discordRoleNames);
  const teacherRecord = await db((client) =>
    client.teacher.findFirst({
      where: { discord: { equals: user.discordUsername, mode: 'insensitive' } },
      select: { id: true },
    }),
  );

  token.userId = user.id;
  token.discordId = user.discordId;
  token.discordUsername = user.discordUsername;
  token.discordNickname = user.discordNickname;
  token.discordAvatar = user.discordAvatar;
  token.discordServerNick = user.discordServerNick;
  token.discordRoleNames = roleNames;
  token.isInGuild = user.isInGuild;
  token.isAdmin = !!user.adminRole;
  token.isTeacher = !!teacherRecord || isTeacherFromDiscordRoles(roleNames);
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
    async signIn({ profile, account }) {
      try {
        const p = profile as DiscordProfile | undefined;
        const username = p ? discordUsernameFromProfile(p) : '';
        if (!p?.id || !username) {
          console.warn('[auth] signIn rejected: missing discord id/username', profile);
          return false;
        }

        if (getGuildConfig()) {
          const membership = await checkUserGuildMembership(
            p.id,
            account?.access_token,
          );
          if (membership === 'out') return '/login?error=NotInGuild';
          if (membership === 'unknown') {
            console.warn('[auth] guild membership unknown — allowing login');
          }
        }

        return true;
      } catch (e) {
        console.error('[auth] signIn failed:', e);
        return false;
      }
    },
    async jwt({ token, profile, account, trigger }) {
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
            await syncUserGuildDataBestEffort(p.id, account?.access_token);
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
      const userFields = {
        discordServerNick: (token.discordServerNick as string) ?? null,
        discordNickname: (token.discordNickname as string) ?? null,
        discordUsername: token.discordUsername as string,
      };
      const displayName = userDisplayName(userFields);

      return {
        ...session,
        user: {
          id: token.userId as string,
          discordId: token.discordId as string,
          discordUsername: userFields.discordUsername,
          discordNickname: userFields.discordNickname,
          discordAvatar: (token.discordAvatar as string) ?? null,
          discordServerNick: userFields.discordServerNick,
          discordRoleNames: (token.discordRoleNames as string[]) ?? [],
          isInGuild: !!token.isInGuild,
          isAdmin: !!token.isAdmin,
          isTeacher: !!token.isTeacher,
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
