import { prisma } from '@/lib/prisma';
import { adminUserDisplayName, normalizeNickFields } from '@/lib/users/display';
import { ADMIN_CLASS_ORDER } from '@/lib/admin/class-filter';

export type MonthlyPointRow = {
  userId: string;
  serverNick: string;
  teacherName: string;
  className: string;
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

export type MonthlyPointClassGroup = {
  className: string;
  rows: MonthlyPointRow[];
  summary: MonthlyPointSummary;
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

function resolveClassName(user: {
  class?: { name: string } | null;
  interviews?: Array<{ className?: string | null }>;
  teacher?: { class?: { name: string } | null } | null;
}) {
  return (
    user.class?.name ??
    user.interviews?.[0]?.className ??
    user.teacher?.class?.name ??
    '미배정'
  );
}

function summarizeRows(rows: MonthlyPointRow[]): MonthlyPointSummary {
  return {
    studentCount: rows.length,
    graduationTotal: rows.reduce((s, r) => s + r.graduationPoint, 0),
    clubTotal: rows.reduce((s, r) => s + r.clubPoint, 0),
    otherTotal: rows.reduce((s, r) => s + r.otherPoint, 0),
    totalPoints: rows.reduce((s, r) => s + r.totalPoint, 0),
  };
}

export async function getMonthlyPointReport(year: number, month: number) {
  const { start, end } = monthRange(year, month);

  const histories = await prisma.pointHistory.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: {
      user: {
        include: {
          class: true,
          teacher: { include: { class: true } },
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
      serverNick: adminUserDisplayName(normalizeNickFields(h.user)),
      teacherName: resolveTeacherName(h.user),
      className: resolveClassName(h.user),
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

  const rows = Array.from(byUser.values()).sort((a, b) => {
    const classCmp =
      (ADMIN_CLASS_ORDER.indexOf(a.className) === -1 ? 99 : ADMIN_CLASS_ORDER.indexOf(a.className)) -
      (ADMIN_CLASS_ORDER.indexOf(b.className) === -1 ? 99 : ADMIN_CLASS_ORDER.indexOf(b.className));
    if (classCmp !== 0) return classCmp;
    return a.serverNick.localeCompare(b.serverNick, 'ko');
  });

  const byClass = new Map<string, MonthlyPointRow[]>();
  for (const row of rows) {
    const list = byClass.get(row.className) ?? [];
    list.push(row);
    byClass.set(row.className, list);
  }

  const classGroups: MonthlyPointClassGroup[] = Array.from(byClass.entries())
    .map(([className, classRows]) => ({
      className,
      rows: classRows,
      summary: summarizeRows(classRows),
    }))
    .sort((a, b) => {
      const ai = ADMIN_CLASS_ORDER.indexOf(a.className);
      const bi = ADMIN_CLASS_ORDER.indexOf(b.className);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const summary = summarizeRows(rows);

  return { year, month, summary, rows, classGroups };
}

function monthRangeBounds(year: number, month: number) {
  return monthRange(year, month);
}

/** 해당 월·학생의 졸업 포인트 내역만 삭제 (다른 포인트·다른 월 데이터는 유지) */
export async function deleteGraduationPointsForUser(userId: string, year: number, month: number) {
  const { start, end } = monthRangeBounds(year, month);
  const result = await prisma.pointHistory.deleteMany({
    where: {
      userId,
      pointType: 'graduation',
      createdAt: { gte: start, lt: end },
    },
  });
  return result.count;
}
