import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { syncUserGuildDataIfStale } from '@/lib/discord-guild';
import { userDisplayName } from '@/lib/user-display';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const refresh = req.nextUrl.searchParams.get('refresh') === '1';

    await syncUserGuildDataIfStale(user.discordId, null, refresh);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        class: true,
        teacher: true,
        applications: { include: { teacher: true, class: true }, orderBy: { createdAt: 'desc' } },
        interviews: { orderBy: { createdAt: 'desc' } },
        graduationReview: true,
      },
    });

    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { parseRoleNames } = await import('@/lib/discord-guild');

    return NextResponse.json({
      ...dbUser,
      discordRoleNames: parseRoleNames(dbUser.discordRoleNames),
      displayName: userDisplayName(dbUser),
    });
  } catch (e) {
    return apiError(e);
  }
}
