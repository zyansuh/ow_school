import NextAuth from 'next-auth';
import { prisma, db } from '@/lib/prisma';
import { ensureDefaultAdmin, isAdmin } from '@/lib/auth/rbac';
import { authConfig } from '@/lib/auth/config';
import {
  checkUserGuildMembership,
  getGuildConfig,
  parseRoleNames,
  syncUserGuildData,
  syncUserGuildDataBestEffort,
} from '@/lib/discord/guild';
import { normalizeNickFields, userDisplayName } from '@/lib/users/display';
import { resolveTeacherEntityForUser } from '@/lib/teacher/identity';
import { getUserRole, loadUserRoleContext, type UserRoleContext } from '@/lib/users/role';
import { backfillTeacherDiscordUserId } from '@/lib/teacher/discord-link';

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
  let roleCtx: UserRoleContext = { teacherDiscordUserIds: new Set(), teacherDiscordNames: new Set() };
  try {
    roleCtx = await loadUserRoleContext();
  } catch (e) {
    console.warn('[auth] loadUserRoleContext failed, using empty context:', e);
  }
  const siteRole = getUserRole(user, roleCtx);

  token.userId = user.id;
  token.discordId = user.discordId;
  token.discordUsername = user.discordUsername;
  token.discordNickname = user.discordNickname;
  token.discordAvatar = user.discordAvatar;
  token.discordServerNick = user.discordServerNick;
  token.discordRoleNames = roleNames;
  token.isInGuild = user.isInGuild;
  token.isAdmin = siteRole === 'admin';
  token.isTeacher = siteRole === 'teacher';
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
          return '/login?error=AccessDenied';
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
        return '/login?error=AuthError';
      }
    },
    async jwt({ token, profile, account, trigger }) {
      const p = profile as DiscordProfile | undefined;
      try {
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
                discordNickname: p.global_name?.trim() || null,
                discordAvatar,
              },
              update: {
                discordUsername: username,
                discordNickname: p.global_name?.trim() || null,
                discordAvatar,
              },
            }),
          );

          if (getGuildConfig()) {
            try {
              await syncUserGuildDataBestEffort(p.id, account?.access_token);
            } catch (e) {
              console.warn('[auth] guild sync on sign-in failed:', e);
            }
          }

          await backfillTeacherDiscordUserId(p.id, username);

          await db((client) => ensureDefaultAdmin(p.id, username, user.id, client));

          await resolveTeacherEntityForUser({
            id: user.id,
            discordId: user.discordId,
            discordUsername: user.discordUsername,
            discordRoleNames: user.discordRoleNames,
          });

          await syncTokenFromUser(user.id, token);
          console.info('[auth] login ok', { discordId: p.id, userId: user.id });
        } else if (token.userId) {
          if (trigger === 'update' && token.discordId) {
            await syncUserGuildData(token.discordId as string);
          }
          await syncTokenFromUser(token.userId as string, token);
          token.isAdmin = await db((client) => isAdmin(token.userId as string, client));
        }
      } catch (e) {
        console.error('[auth] jwt failed:', e);
        if (p?.id) {
          throw e;
        }
      }

      return token;
    },
    async session({ session, token }) {
      const userFields = normalizeNickFields({
        discordUsername: token.discordUsername as string,
        discordNickname: (token.discordNickname as string) ?? null,
        discordServerNick: (token.discordServerNick as string) ?? null,
      });
      const displayName = userDisplayName(userFields);

      return {
        ...session,
        user: {
          id: token.userId as string,
          discordId: token.discordId as string,
          discordUsername: userFields.discordUsername,
          discordNickname: userFields.discordDisplayName ?? null,
          discordAvatar: (token.discordAvatar as string) ?? null,
          discordServerNick: userFields.discordServerNickname ?? null,
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
