'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Withdrawn = {
  id: string;
  nickname: string;
  guildNickname?: string;
  className: string;
  teacherName: string;
  withdrawnAt: string;
};

export default function AdminWithdrawnPage() {
  const [users, setUsers] = useState<Withdrawn[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = () =>
    fetch('/api/admin/withdrawn')
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d) ? d : []);
        setLoading(false);
      });

  useEffect(() => {
    void load();
  }, []);

  const restore = async (id: string, nickname: string) => {
    if (!confirm(`「${nickname}」님을 재학생 목록으로 복구할까요?`)) return;
    setRestoringId(id);
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unwithdraw' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '복구 실패');
      toast.success('재학생 목록으로 복구되었습니다');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '복구 실패');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="퇴교생 목록"
        description="퇴교 처리된 학생입니다. 재학생 목록으로 복구할 수 있습니다."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/students">학생 관리</Link>
          </Button>
        }
      />
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <DataTable
          data={users}
          keyExtractor={(u) => u.id}
          emptyTitle="퇴교생이 없습니다"
          columns={[
            { key: 'nick', header: '표시 이름', cell: (u) => u.nickname },
            { key: 'guild', header: '길드 닉', cell: (u) => u.guildNickname ?? '-' },
            { key: 'class', header: '반', width: '5.5rem', cellClassName: 'whitespace-nowrap', cell: (u) => u.className },
            { key: 'teacher', header: '담당 선생님', cell: (u) => u.teacherName },
            {
              key: 'date',
              header: '퇴교일',
              cell: (u) => <span className="text-muted-foreground">{formatDate(u.withdrawnAt)}</span>,
            },
            {
              key: 'action',
              header: '관리',
              width: '6rem',
              cellClassName: 'whitespace-nowrap',
              mobileFooter: true,
              cell: (u) => (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restoringId === u.id}
                  onClick={() => void restore(u.id, u.nickname)}
                >
                  {restoringId === u.id ? '복구 중…' : '복구'}
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
