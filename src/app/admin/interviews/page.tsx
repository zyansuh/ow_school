'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminClassFilterBar } from '@/components/admin/admin-class-filter-bar';
import { AdminClassSections } from '@/components/admin/admin-class-sections';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ds } from '@/styles/design-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useAdminClassFilter, useAdminQueryParam } from '@/hooks/admin/use-admin-class-filter';
import { ADMIN_CLASS_ALL, matchesClassFilter, normalizeClassLabel } from '@/lib/admin/class-filter';

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
  return (
    <Suspense
      fallback={
        <div className={ds.pageGap}>
          <AdminPageHeader title="졸업면담 관리" description="불러오는 중…" />
          <SkeletonTable rows={6} />
        </div>
      }
    >
      <AdminInterviewsInner />
    </Suspense>
  );
}

function AdminInterviewsInner() {
  const { classFilter } = useAdminClassFilter();
  const { query } = useAdminQueryParam();
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((iv) => {
      if (!matchesClassFilter(iv.className, classFilter)) return false;
      if (!q) return true;
      return (
        iv.nickname.toLowerCase().includes(q) ||
        (iv.teacher?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, classFilter, query]);

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

  const columns: DataTableColumn<Interview>[] = [
    { key: 'nick', header: '서버닉네임', cell: (iv) => iv.nickname },
    { key: 'class', header: '반', cell: (iv) => normalizeClassLabel(iv.className) },
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
  ];

  const renderList = (rows: Interview[]) => (
    <DataTable
      data={rows}
      keyExtractor={(iv) => iv.id}
      emptyTitle="졸업면담이 없습니다"
      columns={columns}
    />
  );

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader title="졸업면담 관리" description="제출된 졸업면담을 확인하고 관리합니다." />
      <AdminClassFilterBar className="mb-4" />
      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length}건
        {query.trim() || classFilter !== ADMIN_CLASS_ALL
          ? ` (전체 ${items.length}건 중)`
          : ''}
      </p>
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <AdminClassSections
          items={filtered}
          getClassName={(iv) => iv.className}
          flat={classFilter !== ADMIN_CLASS_ALL}
          emptyFallback={renderList([])}
          renderList={renderList}
        />
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.nickname} · {normalizeClassLabel(selected?.className)}
            </DialogTitle>
            <DialogDescription className="sr-only">졸업면담 상세</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className={ds.caption}>질문 1 · 평겜마 콘텐츠 참여 경험</p>
                <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
                  {selected.contentExperience}
                </p>
              </div>
              <div>
                <p className={ds.caption}>질문 2 · 인상 깊었던 사람</p>
                <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
                  {selected.memorablePerson}
                </p>
              </div>
              <div>
                <p className={ds.caption}>질문 3 · 동호회 가입</p>
                <p className="text-sm text-foreground mt-1">
                  {selected.joinedClub ? '예' : '아니오'}
                </p>
                {selected.joinedClub && parseClubNames(selected.clubNames).length > 0 && (
                  <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                    {parseClubNames(selected.clubNames).map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Link href="/interview" className="text-sm text-primary hover:underline">
                  학생 수정 페이지
                </Link>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setSelected(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>졸업면담 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            정말 <span className="text-foreground">{deleteTarget?.nickname}</span>님의 졸업면담을
            삭제하시겠습니까?
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
