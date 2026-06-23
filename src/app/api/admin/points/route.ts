import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { POINT_TYPE_LABELS } from '@/lib/points';
import { userDisplayName } from '@/lib/user-display';

export async function GET() {
  try {
    await requireAdminUser();

    const histories = await prisma.pointHistory.findMany({
      include: { user: true },
      orderBy: [{ userId: 'asc' }, { createdAt: 'desc' }],
    });

    const grouped = new Map<
      string,
      {
        userId: string;
        displayName: string;
        serverNick: string | null;
        items: Array<{
          id: string;
          pointType: string;
          pointTypeLabel: string;
          pointAmount: number;
          createdAt: Date;
        }>;
        totalPoints: number;
      }
    >();

    for (const h of histories) {
      const key = h.userId;
      const entry = grouped.get(key) ?? {
        userId: h.userId,
        displayName: userDisplayName(h.user),
        serverNick: h.user.discordServerNick,
        items: [],
        totalPoints: 0,
      };
      entry.items.push({
        id: h.id,
        pointType: h.pointType,
        pointTypeLabel: POINT_TYPE_LABELS[h.pointType] ?? h.pointType,
        pointAmount: h.pointAmount,
        createdAt: h.createdAt,
      });
      entry.totalPoints += h.pointAmount;
      grouped.set(key, entry);
    }

    return NextResponse.json(
      Array.from(grouped.values()).sort((a, b) => b.totalPoints - a.totalPoints),
    );
  } catch (e) {
    return apiError(e);
  }
}
