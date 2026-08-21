'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';
import type { AlertQueuePayload } from '@/lib/admin/alert-queue';
import { formatDate } from '@/lib/utils';
import { Bell } from 'lucide-react';

export function AdminAlertQueuePanel() {
  const [data, setData] = useState<AlertQueuePayload | null>(null);
  const [acking, setAcking] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/alert-queue')
      .then((r) => r.json())
      .then((d) => {
        if (d?.groups) setData(d);
      })
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ack = async () => {
    setAcking(true);
    try {
      const res = await fetch('/api/admin/alert-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || '처리 실패');
      setData(d);
      toast.success('알림을 모두 확인 처리했습니다');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setAcking(false);
    }
  };

  if (!data) {
    return (
      <Card className={`${ds.card} ${ds.cardPad}`}>
        <h2 className={ds.sectionTitle}>알림 큐</h2>
        <p className="text-sm text-muted-foreground mt-2">불러오는 중…</p>
      </Card>
    );
  }

  return (
    <Card className={`${ds.card} ${ds.cardPad}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className={ds.sectionTitle}>알림 큐</h2>
          {data.totalNew > 0 && <Badge variant="warning">새 {data.totalNew}</Badge>}
        </div>
        <Button size="sm" variant="outline" disabled={acking || data.totalNew === 0} onClick={() => void ack()}>
          {acking ? '처리 중…' : '모두 확인'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        최근 7일 신규 신청·면담 제출을 반별로 묶습니다.
        {data.ackAt ? ` · 마지막 확인 ${formatDate(data.ackAt)}` : ''}
      </p>

      {data.groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">최근 알림이 없습니다.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {data.groups.map((g) => (
            <div key={g.className} className="border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold">{g.className}</h3>
                {g.newCount > 0 && (
                  <span className="text-[11px] text-warning tabular-nums">새 {g.newCount}</span>
                )}
              </div>
              <ul className="space-y-1.5">
                {g.items.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-sm rounded-lg px-2 py-1.5 hover:bg-muted/50"
                    >
                      <span className={item.isNew ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {item.isNew && <span className="text-warning mr-1">●</span>}
                        {item.title}
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                          {item.subtitle}
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatDate(item.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
                {g.items.length > 8 && (
                  <li className="text-xs text-muted-foreground px-2">외 {g.items.length - 8}건</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
