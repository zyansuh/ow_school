'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';
import { formatPoint } from '@/lib/points';

type PointItem = {
  id: string;
  pointType: string;
  pointTypeLabel: string;
  pointAmount: number;
  createdAt: string;
};

type PointGroup = {
  userId: string;
  displayName: string;
  serverNick: string | null;
  items: PointItem[];
  totalPoints: number;
};

export default function AdminPointsPage() {
  const [groups, setGroups] = useState<PointGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/points')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setGroups(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">포인트 관리</h1>
      {groups.length === 0 ? (
        <Card className="bg-gray-900/80 border-gray-800">
          <EmptyState title="포인트 지급 내역이 없습니다" />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.userId} className="bg-gray-900/80 border-gray-800">
              <div className="card-pad space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-gray-100">{group.displayName}</h2>
                    {group.serverNick && group.serverNick !== group.displayName && (
                      <p className="text-xs text-gray-500 mt-0.5">서버닉: {group.serverNick}</p>
                    )}
                  </div>
                  <p className="text-sm text-purple-300 font-medium">합계 {formatPoint(group.totalPoints)}</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap justify-between gap-2 border-t border-gray-800/60 pt-2 first:border-0 first:pt-0">
                      <span>· {item.pointTypeLabel} {formatPoint(item.pointAmount)}</span>
                      <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
