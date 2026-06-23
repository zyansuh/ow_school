import { prisma } from '@/lib/prisma';
import { userDisplayName } from '@/lib/user-display';

export type MonthlyPointRow = {
  userId: string;
  serverNick: string;
  teacherName: string;
  graduationPoint: number;
  clubPoint: number;
  otherPoint: number;
  totalPoint: number;
};

export type MonthlyPointSummary = {
  studentCount: number;
  graduationTotal: number;
  clubTotal: number;
  otherTotal: number;
  totalPoints: number;
};

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function resolveTeacherName(user: {
  teacher?: { name: string } | null;
  interviews?: Array<{ teacher?: { name: string } | null }>;
}) {
  return user.teacher?.name ?? user.interviews?.[0]?.teacher?.name ?? '-';
}

export async function getMonthlyPointReport(year: number, month: number) {
  const { start, end } = monthRange(year, month);

  const histories = await prisma.pointHistory.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: {
      user: {
        include: {
          teacher: true,
          interviews: {
            include: { teacher: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }],
  });

  const byUser = new Map<string, MonthlyPointRow>();

  for (const h of histories) {
    const row = byUser.get(h.userId) ?? {
      userId: h.userId,
      serverNick: h.user.discordServerNick ?? userDisplayName(h.user),
      teacherName: resolveTeacherName(h.user),
      graduationPoint: 0,
      clubPoint: 0,
      otherPoint: 0,
      totalPoint: 0,
    };

    if (h.pointType === 'graduation') row.graduationPoint += h.pointAmount;
    else if (h.pointType === 'club') row.clubPoint += h.pointAmount;
    else row.otherPoint += h.pointAmount;

    row.totalPoint += h.pointAmount;
    byUser.set(h.userId, row);
  }

  const rows = Array.from(byUser.values()).sort((a, b) =>
    a.serverNick.localeCompare(b.serverNick, 'ko'),
  );

  const summary: MonthlyPointSummary = {
    studentCount: rows.length,
    graduationTotal: rows.reduce((s, r) => s + r.graduationPoint, 0),
    clubTotal: rows.reduce((s, r) => s + r.clubPoint, 0),
    otherTotal: rows.reduce((s, r) => s + r.otherPoint, 0),
    totalPoints: rows.reduce((s, r) => s + r.totalPoint, 0),
  };

  return { year, month, summary, rows };
}
