'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { toast } from 'sonner';

type App = {
  id: string; nickname: string; status: string; createdAt: string;
  teacher: { name: string }; class: { name: string };
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch('/api/admin/applications').then((r) => r.json()).then((d) => { setApps(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast.error('변경 실패'); return; }
    toast.success('상태가 변경되었습니다'); load();
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">신청 관리</h1>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {apps.length === 0 ? <EmptyState title="신청이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-gray-400 text-left"><th className="p-4">신청자</th><th className="p-4">희망 선생님</th><th className="p-4">반</th><th className="p-4">신청일</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-gray-800/50">
                  <td className="p-4">{a.nickname}</td>
                  <td className="p-4">{a.teacher.name}</td>
                  <td className="p-4">{a.class.name}</td>
                  <td className="p-4 text-gray-500">{formatDate(a.createdAt)}</td>
                  <td className="p-4"><Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}>{STATUS_LABELS[a.status]}</Badge></td>
                  <td className="p-4 flex gap-2">
                    {a.status === 'pending' && (<><Button size="sm" onClick={() => updateStatus(a.id, 'approved')}>승인</Button><Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'rejected')}>거절</Button></>)}
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
