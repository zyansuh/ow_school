'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Graduated = {
  id: string;
  nickname: string;
  guildNickname?: string;
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
    if (!confirm(`「${nickname}」님의 졸업을 취소하고 재학생으로 복구할까요?`)) return;
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

  return (
    <div>
      <AdminPageHeader
        title="졸업생 목록"
        description="졸업 취소 시 active로 복구되며 마지막 담당 반장·반이 복원됩니다."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/students">학생 관리</Link>
          </Button>
        }
      />
      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <DataTable
          data={users}
          keyExtractor={(u) => u.id}
          emptyTitle="졸업생이 없습니다"
          columns={[
            { key: 'nick', header: '표시 이름', cell: (u) => u.nickname },
            { key: 'guild', header: '길드 닉', cell: (u) => u.guildNickname ?? '-' },
            { key: 'class', header: '반', cell: (u) => u.className },
            { key: 'teacher', header: '담당 반장', cell: (u) => u.teacherName },
            { key: 'date', header: '졸업 처리일', cell: (u) => formatDate(u.graduatedAt) },
            {
              key: 'action',
              header: '관리',
              mobileFooter: true,
              cell: (u) => (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restoringId === u.id}
                  onClick={() => void ungraduate(u.id, u.nickname)}
                >
                  {restoringId === u.id ? '복구 중...' : '졸업 취소'}
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
