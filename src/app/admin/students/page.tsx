'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const FILTERS = ['전체', '수달반', '사자반', '여우반'];

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<Array<{
    id: string; nickname: string; discord: string; className: string; teacherName: string; status: string; createdAt: string;
  }>>([]);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then((d) => { setUsers(d.users); setLoading(false); });
  }, []);

  const filtered = filter === '전체' ? users : users.filter((u) => u.className === filter);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">학생 관리</h1>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 rounded-lg text-sm', filter === f ? 'bg-purple-600/30 text-purple-300' : 'bg-gray-800 text-gray-400')}>
            {f}
          </button>
        ))}
      </div>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {filtered.length === 0 ? <EmptyState title="학생이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">닉네임</th><th className="p-4">디스코드</th><th className="p-4">반</th><th className="p-4">담당 선생님</th><th className="p-4">상태</th><th className="p-4">가입일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">{u.nickname}</td>
                  <td className="p-4 text-gray-400">{u.discord}</td>
                  <td className="p-4">{u.className}</td>
                  <td className="p-4">{u.teacherName}</td>
                  <td className="p-4"><Badge variant="outline">{STATUS_LABELS[u.status] || u.status}</Badge></td>
                  <td className="p-4 text-gray-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-xs text-gray-500">반 필터를 클릭하면 해당 반 학생만 표시됩니다. <Link href="/admin" className="text-purple-400">대시보드</Link></p>
    </div>
  );
}
