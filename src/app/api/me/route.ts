import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { getGuildConfig, parseRoleNames, syncUserGuildData } from '@/lib/discord-guild';

export async function GET() {
  try {
    const user = await requireUser();

    if (getGuildConfig()) {
      await syncUserGuildData(user.discordId);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        class: true,
        teacher: true,
        applications: { include: { teacher: true, class: true }, orderBy: { createdAt: 'desc' } },
        interviews: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...dbUser,
      discordRoleNames: parseRoleNames(dbUser.discordRoleNames),
    });
  } catch (e) {
    return apiError(e);
  }
}
