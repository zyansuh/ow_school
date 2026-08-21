'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { SkeletonTable, SkeletonStatGrid } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminClassFilterBar } from '@/components/admin/admin-class-filter-bar';
import { AdminClassSections } from '@/components/admin/admin-class-sections';
import { DeleteGraduationPointDialog } from '@/components/admin/points/delete-graduation-point-dialog';
import { formatPoint } from '@/lib/points';
import type { MonthlyPointRow, MonthlyPointSummary } from '@/lib/admin/points';
import { Download, Users, GraduationCap, Trophy, Coins, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminClassFilter } from '@/hooks/admin/use-admin-class-filter';
import { ADMIN_CLASS_ALL, matchesClassFilter } from '@/lib/admin/class-filter';

type Report = {
  year: number;
  month: number;
  summary: MonthlyPointSummary;
  rows: MonthlyPointRow[];
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR');
}

async function downloadExcel(report: Report) {
  const XLSX = await import('xlsx');
  const sheetRows = report.rows.map((r) => ({
    반: r.className,
    서버닉네임: r.serverNick,
    '담당 선생님': r.teacherName,
    '졸업 포인트': r.graduationPoint,
    '동호회 포인트': r.clubPoint,
    '기타 포인트': r.otherPoint,
    '총 포인트': r.totalPoint,
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '포인트');
  XLSX.writeFile(wb, `포인트_${report.year}년_${report.month}월.xlsx`);
}

function PointRowsTable({
  rows,
  emptyTitle,
  onDelete,
}: {
  rows: MonthlyPointRow[];
  emptyTitle: string;
  onDelete: (row: MonthlyPointRow) => void;
}) {
  return (
    <DataTable
      data={rows}
      keyExtractor={(r) => r.userId}
      emptyTitle={emptyTitle}
      columns={[
        { key: 'nick', header: '서버닉네임', cell: (r) => r.serverNick },
        { key: 'teacher', header: '담당 선생님', cell: (r) => r.teacherName },
        {
          key: 'grad',
          header: '졸업 포인트',
          cell: (r) => <span className="tabular-nums">{formatAmount(r.graduationPoint)}</span>,
        },
        {
          key: 'club',
          header: '동호회 포인트',
          cell: (r) => <span className="tabular-nums">{formatAmount(r.clubPoint)}</span>,
          hideOnMobile: true,
        },
        {
          key: 'other',
          header: '기타 포인트',
          cell: (r) => <span className="tabular-nums">{formatAmount(r.otherPoint)}</span>,
          hideOnMobile: true,
        },
        {
          key: 'total',
          header: '총 포인트',
          cell: (r) => (
            <span className="tabular-nums font-semibold text-primary">{formatAmount(r.totalPoint)}</span>
          ),
        },
        {
          key: 'action',
          header: '관리',
          width: '5.5rem',
          cellClassName: 'whitespace-nowrap',
          mobileFooter: true,
          cell: (r) =>
            r.graduationPoint > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="text-danger border-danger/40 hover:bg-danger/10"
                onClick={() => onDelete(r)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                삭제
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
      ]}
    />
  );
}

export default function AdminPointsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <AdminPageHeader title="포인트 관리" description="불러오는 중…" />
          <SkeletonStatGrid />
          <SkeletonTable rows={6} />
        </div>
      }
    >
      <AdminPointsInner />
    </Suspense>
  );
}

function AdminPointsInner() {
  const now = new Date();
  const { classFilter } = useAdminClassFilter();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<MonthlyPointRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/points?year=${y}&month=${m}`);
      const data = await res.json();
      if (res.ok) {
        setReport({
          year: data.year,
          month: data.month,
          summary: data.summary,
          rows: Array.isArray(data.rows) ? data.rows : [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(year, month);
  }, [year, month, load]);

  const confirmDeleteGraduation = async () => {
    if (!deleteTarget || !report) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/points/graduation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deleteTarget.userId,
          year: report.year,
          month: report.month,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      toast.success('졸업 포인트가 삭제되었습니다');
      setDeleteTarget(null);
      await load(year, month);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeleting(false);
    }
  };

  const summary = report?.summary;
  const rows = report?.rows ?? [];
  const filtered = useMemo(
    () => rows.filter((r) => matchesClassFilter(r.className, classFilter)),
    [rows, classFilter],
  );

  const renderList = (list: MonthlyPointRow[]) => (
    <PointRowsTable
      rows={list}
      emptyTitle={`${year}년 ${month}월 포인트 내역이 없습니다`}
      onDelete={setDeleteTarget}
    />
  );

  return (
    <div>
      <AdminPageHeader
        title="포인트 관리"
        description="월별 포인트 지급 현황을 반별로 구분합니다 (캡처·엑셀 전달용)"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </Select>
            <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))} className="w-24">
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={!report || rows.length === 0}
              onClick={() => report && void downloadExcel(report)}
            >
              <Download className="h-4 w-4" /> 엑셀 다운로드
            </Button>
          </div>
        }
      />

      <AdminClassFilterBar className="mb-6" />

      {loading && !summary ? (
        <>
          <SkeletonStatGrid />
          <SkeletonTable rows={6} />
        </>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="총 학생 수" value={summary.studentCount} suffix="명" icon={Users} />
              <StatCard
                label="졸업 포인트 지급 예정"
                value={formatPoint(summary.graduationTotal)}
                icon={GraduationCap}
              />
              <StatCard
                label="동호회 포인트 지급 예정"
                value={formatPoint(summary.clubTotal)}
                icon={Trophy}
              />
              <StatCard
                label="총 지급 예정 포인트"
                value={formatPoint(summary.totalPoints)}
                icon={Coins}
              />
            </div>
          )}

          <AdminClassSections
            items={filtered}
            getClassName={(r) => r.className}
            flat={classFilter !== ADMIN_CLASS_ALL}
            emptyFallback={
              <PointRowsTable
                rows={[]}
                emptyTitle={
                  classFilter === ADMIN_CLASS_ALL
                    ? `${year}년 ${month}월 포인트 내역이 없습니다`
                    : `${classFilter} 포인트 내역이 없습니다`
                }
                onDelete={setDeleteTarget}
              />
            }
            renderList={renderList}
            renderMeta={(list) => {
              const total = list.reduce((s, r) => s + r.totalPoint, 0);
              const grad = list.reduce((s, r) => s + r.graduationPoint, 0);
              const club = list.reduce((s, r) => s + r.clubPoint, 0);
              return `총 ${formatAmount(total)}P · 졸업 ${formatAmount(grad)}P · 동호회 ${formatAmount(club)}P`;
            }}
          />
        </>
      )}

      <DeleteGraduationPointDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        studentName={deleteTarget?.serverNick ?? ''}
        loading={deleting}
        onConfirm={() => void confirmDeleteGraduation()}
      />
    </div>
  );
}
