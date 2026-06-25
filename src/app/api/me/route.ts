import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import {
  syncUserGuildDataIfStale,
  runGuildSyncIfStale,
} from '@/lib/discord/guild';
import { resolveGuildMembershipFromDb } from '@/lib/discord/guild-membership';
import { normalizeNickFields, userDisplayName } from '@/lib/users/display';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const refresh = req.nextUrl.searchParams.get('refresh') === '1';

    const meta = await prisma.user.findUnique({
      where: { id: user.id },
      select: { guildSyncedAt: true },
    });
    const neverSynced = !meta?.guildSyncedAt;

    if (refresh || neverSynced) {
      await syncUserGuildDataIfStale(user.discordId, null, refresh || neverSynced);
    } else {
      after(async () => {
        try {
          await runGuildSyncIfStale(user.discordId);
        } catch (e) {
          console.warn('[me] background guild sync failed:', e);
        }
      });
    }

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

    const { parseRoleNames } = await import('@/lib/discord/guild');

    return NextResponse.json({
      ...dbUser,
      discordRoleNames: parseRoleNames(dbUser.discordRoleNames),
      displayName: userDisplayName(normalizeNickFields(dbUser)),
      serverNickname: dbUser.discordServerNick,
      globalDisplayName: dbUser.discordNickname,
      isInGuild: resolveGuildMembershipFromDb(dbUser.isInGuild),
    });
  } catch (e) {
    return apiError(e);
  }
}
