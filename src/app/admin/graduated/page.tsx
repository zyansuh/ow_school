'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Graduated = {
  id: string;
  nickname: string;
  discord: string;
  className: string;
  teacherName: string;
  graduatedAt: string;
};

export default function AdminGraduatedPage() {
  const [users, setUsers] = useState<Graduated[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = () =>
    fetch('/api/admin/graduated')
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d) ? d : []);
        setLoading(false);
      });

  useEffect(() => {
    void load();
  }, []);

  const ungraduate = async (id: string, nickname: string) => {
    if (
      !confirm(
        `「${nickname}」님의 졸업을 취소하고 다시 재학생(active)으로 복구할까요?\n마지막 담당 선생님·반이 자동 복원됩니다.`,
      )
    ) {
      return;
    }
    setRestoringId(id);
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ungraduate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '복구 실패');
      toast.success('졸업이 취소되어 재학생으로 복구되었습니다');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '복구 실패');
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">졸업생 목록</h1>
        <Link href="/admin/students" className="text-sm text-purple-400 hover:text-purple-300">
          학생 관리 →
        </Link>
      </div>
      <p className="text-sm text-gray-500">
        졸업 취소 시 상태가 active로 돌아가며, 졸업면담·신청 기록에 있던 마지막 담당 선생님과 반이 복원됩니다.
      </p>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {users.length === 0 ? (
          <EmptyState title="졸업생이 없습니다" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">서버 닉네임</th>
                <th className="p-4">디스코드</th>
                <th className="p-4">반</th>
                <th className="p-4">담당 선생님</th>
                <th className="p-4">졸업 처리일</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50">
                  <td className="p-4 font-medium">{u.nickname}</td>
                  <td className="p-4 text-gray-400">@{u.discord}</td>
                  <td className="p-4">{u.className}</td>
                  <td className="p-4">{u.teacherName}</td>
                  <td className="p-4 text-gray-500">{formatDate(u.graduatedAt)}</td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={restoringId === u.id}
                      onClick={() => void ungraduate(u.id, u.nickname)}
                    >
                      {restoringId === u.id ? '복구 중...' : '졸업 취소'}
                    </Button>
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
