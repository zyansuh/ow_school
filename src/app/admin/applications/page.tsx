'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate, STATUS_LABELS } from '@/lib/utils';

type App = {
  id: string;
  nickname: string;
  status: string;
  createdAt: string;
  playTimeSlot?: string | null;
  teacher: { name: string };
  class: { name: string };
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/applications').then((r) => r.json()).then((d) => { setApps(d); setLoading(false); });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">신청 관리</h1>
      <p className="text-sm text-gray-500">수강 신청은 자동 승인됩니다.</p>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {apps.length === 0 ? <EmptyState title="신청이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">신청자</th>
                <th className="p-4">희망 선생님</th>
                <th className="p-4">반</th>
                <th className="p-4">게임 시간대</th>
                <th className="p-4">신청일</th>
                <th className="p-4">상태</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-gray-800/50">
                  <td className="p-4">{a.nickname}</td>
                  <td className="p-4">{a.teacher.name}</td>
                  <td className="p-4">{a.class.name}</td>
                  <td className="p-4 text-gray-400">{a.playTimeSlot || '-'}</td>
                  <td className="p-4 text-gray-500">{formatDate(a.createdAt)}</td>
                  <td className="p-4">
                    <Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}>
                      {STATUS_LABELS[a.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
