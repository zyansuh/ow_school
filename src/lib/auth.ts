import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { prisma } from '@/lib/prisma';
import { ensureDefaultAdmin } from '@/lib/rbac';
import { isAdmin } from '@/lib/rbac';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      discordId: string;
      discordUsername: string;
      discordNickname: string | null;
      discordAvatar: string | null;
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

type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const p = profile as DiscordProfile | undefined;
      if (!p?.id || !p.username) return false;

      const discordId = p.id;
      const discordUsername = p.username;
      const discordNickname = p.global_name || p.username;
      const discordAvatar = p.avatar
        ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
        : null;

      const user = await prisma.user.upsert({
        where: { discordId },
        create: { discordId, discordUsername, discordNickname, discordAvatar },
        update: { discordUsername, discordNickname, discordAvatar },
      });

      await ensureDefaultAdmin(discordUsername, user.id);
      return true;
    },
    async jwt({ token, profile }) {
      const p = profile as DiscordProfile | undefined;
      if (p?.id) {
        const user = await prisma.user.findUnique({
          where: { discordId: p.id },
          include: { class: true, teacher: true, adminRole: true },
        });
        if (user) {
          token.userId = user.id;
          token.discordId = user.discordId;
          token.discordUsername = user.discordUsername;
          token.discordNickname = user.discordNickname;
          token.discordAvatar = user.discordAvatar;
          token.isAdmin = !!user.adminRole;
          token.className = user.class?.name ?? null;
          token.teacherName = user.teacher?.name ?? null;
          token.status = user.status;
        }
      } else if (token.userId) {
        const user = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: { class: true, teacher: true },
        });
        if (user) {
          token.isAdmin = await isAdmin(user.id);
          token.className = user.class?.name ?? null;
          token.teacherName = user.teacher?.name ?? null;
          token.status = user.status;
          token.discordNickname = user.discordNickname;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.userId as string,
          discordId: token.discordId as string,
          discordUsername: token.discordUsername as string,
          discordNickname: (token.discordNickname as string) ?? null,
          discordAvatar: (token.discordAvatar as string) ?? null,
          isAdmin: !!token.isAdmin,
          className: (token.className as string) ?? null,
          teacherName: (token.teacherName as string) ?? null,
          status: (token.status as string) ?? 'active',
          name: (token.discordNickname as string) ?? (token.discordUsername as string),
          email: session.user?.email ?? null,
          image: (token.discordAvatar as string) ?? null,
        },
      };
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
