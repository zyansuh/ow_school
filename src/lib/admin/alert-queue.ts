import { prisma } from '@/lib/prisma';
import { ADMIN_CLASS_ORDER, normalizeClassLabel } from '@/lib/admin/class-filter';

export const ALERT_ACK_KEY = 'admin_alert_ack_at';

export type AlertQueueItem = {
  id: string;
  type: 'application' | 'interview';
  className: string;
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
  isNew: boolean;
};

export type AlertQueueGroup = {
  className: string;
  items: AlertQueueItem[];
  newCount: number;
};

export type AlertQueuePayload = {
  ackAt: string | null;
  groups: AlertQueueGroup[];
  totalNew: number;
  total: number;
};

const LOOKBACK_DAYS = 7;

export async function getAlertAckAt(): Promise<Date | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: ALERT_ACK_KEY } });
  if (!row?.value) return null;
  const d = new Date(row.value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function setAlertAckAt(at = new Date()) {
  const iso = at.toISOString();
  await prisma.siteSetting.upsert({
    where: { key: ALERT_ACK_KEY },
    create: { key: ALERT_ACK_KEY, value: iso },
    update: { value: iso },
  });
  return iso;
}

export async function getAdminAlertQueue(): Promise<AlertQueuePayload> {
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);
  const ackAt = await getAlertAckAt();

  const [apps, interviews] = await Promise.all([
    prisma.application.findMany({
      where: { createdAt: { gte: since } },
      include: { class: true, teacher: true },
      orderBy: { createdAt: 'desc' },
      take: 80,
    }),
    prisma.interview.findMany({
      where: { createdAt: { gte: since } },
      include: { teacher: true },
      orderBy: { createdAt: 'desc' },
      take: 80,
    }),
  ]);

  const items: AlertQueueItem[] = [
    ...apps.map((a) => {
      const className = normalizeClassLabel(a.class.name);
      const createdAt = a.createdAt.toISOString();
      return {
        id: `app:${a.id}`,
        type: 'application' as const,
        className,
        title: `신규 신청 · ${a.nickname}`,
        subtitle: `${a.teacher.name} · ${a.status}`,
        href: `/admin/applications?class=${encodeURIComponent(className)}`,
        createdAt,
        isNew: !ackAt || a.createdAt > ackAt,
      };
    }),
    ...interviews.map((iv) => {
      const className = normalizeClassLabel(iv.className);
      const createdAt = iv.createdAt.toISOString();
      return {
        id: `iv:${iv.id}`,
        type: 'interview' as const,
        className,
        title: `면담 제출 · ${iv.nickname}`,
        subtitle: iv.teacher?.name ? `담당 ${iv.teacher.name}` : '담당 미지정',
        href: `/admin/interviews?class=${encodeURIComponent(className)}&q=${encodeURIComponent(iv.nickname)}`,
        createdAt,
        isNew: !ackAt || iv.createdAt > ackAt,
      };
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const byClass = new Map<string, AlertQueueItem[]>();
  for (const item of items) {
    const list = byClass.get(item.className) ?? [];
    list.push(item);
    byClass.set(item.className, list);
  }

  const groups: AlertQueueGroup[] = Array.from(byClass.entries())
    .map(([className, groupItems]) => ({
      className,
      items: groupItems,
      newCount: groupItems.filter((i) => i.isNew).length,
    }))
    .sort((a, b) => {
      const ai = ADMIN_CLASS_ORDER.indexOf(a.className);
      const bi = ADMIN_CLASS_ORDER.indexOf(b.className);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  return {
    ackAt: ackAt?.toISOString() ?? null,
    groups,
    totalNew: items.filter((i) => i.isNew).length,
    total: items.length,
  };
}
