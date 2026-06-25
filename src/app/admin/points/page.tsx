'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { SkeletonTable, SkeletonStatGrid } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatPoint } from '@/lib/points';
import type { MonthlyPointRow, MonthlyPointSummary } from '@/lib/admin/points';
import { Download, Users, GraduationCap, Trophy, Coins } from 'lucide-react';

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

export default function AdminPointsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/points?year=${y}&month=${m}`);
      const data = await res.json();
      if (res.ok) setReport(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(year, month);
  }, [year, month, load]);

  const summary = report?.summary;
  const rows = report?.rows ?? [];

  return (
    <div>
      <AdminPageHeader
        title="포인트 관리"
        description="월별 포인트 지급 현황 (캡처·엑셀 전달용)"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </Select>
            <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))} className="w-24">
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}월</option>
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
              <StatCard label="졸업 포인트 지급 예정" value={formatPoint(summary.graduationTotal)} icon={GraduationCap} />
              <StatCard label="동호회 포인트 지급 예정" value={formatPoint(summary.clubTotal)} icon={Trophy} />
              <StatCard label="총 지급 예정 포인트" value={formatPoint(summary.totalPoints)} icon={Coins} />
            </div>
          )}

          <DataTable
            data={rows}
            keyExtractor={(r) => r.userId}
            emptyTitle={`${year}년 ${month}월 포인트 내역이 없습니다`}
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
                cell: (r) => <span className="tabular-nums font-semibold text-primary">{formatAmount(r.totalPoint)}</span>,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
