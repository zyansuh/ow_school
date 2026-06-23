import { prisma } from '@/lib/prisma';

export type MonthlyPoint = { month: string; count: number };

const APP_OVERRIDE_KEY = 'statsMonthlyApplicationsOverride';
const IV_OVERRIDE_KEY = 'statsMonthlyInterviewsOverride';

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function lastMonths(count: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

async function readOverride(key: string): Promise<Record<string, number>> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeMonthlyOverride(
  type: 'applications' | 'interviews',
  data: MonthlyPoint[],
) {
  const key = type === 'applications' ? APP_OVERRIDE_KEY : IV_OVERRIDE_KEY;
  const map = Object.fromEntries(data.map((d) => [d.month, d.count]));
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(map) },
    update: { value: JSON.stringify(map) },
  });
}

export function buildMonthlyCounts<T extends { createdAt: Date }>(
  rows: T[],
  months: string[],
): MonthlyPoint[] {
  const byMonth = Object.fromEntries(months.map((m) => [m, 0]));
  for (const row of rows) {
    const k = monthKey(new Date(row.createdAt));
    if (k in byMonth) byMonth[k]++;
  }
  return months.map((m) => ({ month: m, count: byMonth[m] }));
}

export async function mergeMonthlyStats(
  computed: MonthlyPoint[],
  type: 'applications' | 'interviews',
): Promise<MonthlyPoint[]> {
  const overrides = await readOverride(type === 'applications' ? APP_OVERRIDE_KEY : IV_OVERRIDE_KEY);
  return computed.map((p) => ({
    month: p.month,
    count: overrides[p.month] ?? p.count,
  }));
}
