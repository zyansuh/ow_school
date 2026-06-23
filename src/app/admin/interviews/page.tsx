'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ds } from '@/styles/design-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

type Interview = {
  id: string;
  nickname: string;
  className?: string | null;
  contentExperience: string;
  memorablePerson: string;
  joinedClub: boolean;
  clubNames?: string | null;
  createdAt: string;
  teacher: { name: string } | null;
};

function parseClubNames(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminInterviewsPage() {
  const [items, setItems] = useState<Interview[]>([]);
  const [selected, setSelected] = useState<Interview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch('/api/admin/interviews')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setItems(d);
        setLoading(false);
      });

  useEffect(() => {
    void load();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/interviews/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('졸업면담이 삭제되었습니다');
      setDeleteTarget(null);
      setDeleteReason('');
      setSelected(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader title="졸업면담 관리" description="제출된 졸업면담을 확인하고 관리합니다." />
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <DataTable
          data={items}
          keyExtractor={(iv) => iv.id}
          emptyTitle="졸업면담이 없습니다"
          columns={[
            { key: 'nick', header: '서버닉네임', cell: (iv) => iv.nickname },
            { key: 'class', header: '반', cell: (iv) => iv.className || '-' },
            { key: 'teacher', header: '담당 선생님', cell: (iv) => iv.teacher?.name || '-' },
            { key: 'club', header: '동호회', cell: (iv) => (iv.joinedClub ? '예' : '아니오') },
            {
              key: 'date',
              header: '제출일',
              cell: (iv) => <span className="text-muted-foreground">{formatDate(iv.createdAt)}</span>,
            },
            {
              key: 'action',
              header: '관리',
              mobileFooter: true,
              cell: (iv) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(iv)}>
                    보기
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    onClick={() => setDeleteTarget(iv)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {selected && (
        <Card className={`${ds.card} ${ds.cardPad}`}>
          <div className="space-y-4">
            <h2 className={ds.sectionTitle}>
              {selected.nickname} · {selected.className || '미배정'}
            </h2>
            <div>
              <p className={ds.caption}>질문 1 · 평겜마 콘텐츠 참여 경험</p>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{selected.contentExperience}</p>
            </div>
            <div>
              <p className={ds.caption}>질문 2 · 인상 깊었던 사람</p>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{selected.memorablePerson}</p>
            </div>
            <div>
              <p className={ds.caption}>질문 3 · 동호회 가입</p>
              <p className="text-sm text-foreground mt-1">{selected.joinedClub ? '예' : '아니오'}</p>
              {selected.joinedClub && parseClubNames(selected.clubNames).length > 0 && (
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                  {parseClubNames(selected.clubNames).map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/interview" className="text-sm text-primary hover:underline">
                학생 수정 페이지
              </Link>
              <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>
                닫기
              </button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>졸업면담 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            정말 <span className="text-foreground">{deleteTarget?.nickname}</span>님의 졸업면담을 삭제하시겠습니까?
            <br />
            연결된 졸업·동호회 포인트 내역도 함께 삭제됩니다.
          </p>
          <Textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="삭제 사유 (선택)"
            className="mt-2"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
