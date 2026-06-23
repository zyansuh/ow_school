import NextAuth from 'next-auth';
import { prisma } from '@/lib/prisma';
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
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { class: true, teacher: true, adminRole: true },
  });
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
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile }) {
      try {
        const p = profile as DiscordProfile | undefined;
        if (!p?.id || !p.username) return false;

        if (getGuildConfig()) {
          const member = await fetchGuildMember(p.id);
          if (!member) return '/login?error=NotInGuild';
        }

        const discordAvatar = p.avatar
          ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
          : null;

        const user = await prisma.user.upsert({
          where: { discordId: p.id },
          create: {
            discordId: p.id,
            discordUsername: p.username,
            discordNickname: p.global_name || p.username,
            discordAvatar,
          },
          update: {
            discordUsername: p.username,
            discordNickname: p.global_name || p.username,
            discordAvatar,
          },
        });

        await ensureDefaultAdmin(p.username, user.id);

        if (getGuildConfig()) {
          await syncUserGuildData(p.id);
        }

        return true;
      } catch (e) {
        console.error('[auth] signIn failed:', e);
        return '/login?error=AuthError';
      }
    },
    async jwt({ token, profile, trigger }) {
      const p = profile as DiscordProfile | undefined;

      if (p?.id) {
        const user = await prisma.user.findUnique({ where: { discordId: p.id } });
        if (user) await syncTokenFromUser(user.id, token);
      } else if (token.userId) {
        if (trigger === 'update' && token.discordId) {
          await syncUserGuildData(token.discordId as string);
        }
        await syncTokenFromUser(token.userId as string, token);
        token.isAdmin = await isAdmin(token.userId as string);
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
