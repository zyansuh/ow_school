'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatPoint } from '@/lib/points';
import type { MonthlyPointRow, MonthlyPointSummary } from '@/lib/admin-points';
import { Download } from 'lucide-react';

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
    load(year, month);
  }, [year, month, load]);

  if (loading && !report) return <LoadingPage />;

  const summary = report?.summary;
  const rows = report?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">포인트 관리</h1>
          <p className="text-sm text-gray-500 mt-1">월별 포인트 지급 현황 (캡처·엑셀 전달용)</p>
        </div>
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
            onClick={() => report && downloadExcel(report)}
          >
            <Download className="h-4 w-4" /> 엑셀 다운로드
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <Card className="bg-gray-900/80 border-gray-800 px-3 py-2">
            <p className="text-gray-500 text-xs">총 학생 수</p>
            <p className="font-semibold text-gray-100">{summary.studentCount}명</p>
          </Card>
          <Card className="bg-gray-900/80 border-gray-800 px-3 py-2">
            <p className="text-gray-500 text-xs">졸업 포인트 지급 예정</p>
            <p className="font-semibold text-gray-100">{formatPoint(summary.graduationTotal)}</p>
          </Card>
          <Card className="bg-gray-900/80 border-gray-800 px-3 py-2">
            <p className="text-gray-500 text-xs">동호회 포인트 지급 예정</p>
            <p className="font-semibold text-gray-100">{formatPoint(summary.clubTotal)}</p>
          </Card>
          <Card className="bg-gray-900/80 border-gray-800 px-3 py-2">
            <p className="text-gray-500 text-xs">총 지급 예정 포인트</p>
            <p className="font-semibold text-purple-300">{formatPoint(summary.totalPoints)}</p>
          </Card>
        </div>
      )}

      <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={`${year}년 ${month}월 포인트 내역이 없습니다`} />
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-2 py-2 font-medium whitespace-nowrap">서버닉네임</th>
                  <th className="px-2 py-2 font-medium whitespace-nowrap">담당 선생님</th>
                  <th className="px-2 py-2 font-medium text-right whitespace-nowrap">졸업 포인트</th>
                  <th className="px-2 py-2 font-medium text-right whitespace-nowrap">동호회 포인트</th>
                  <th className="px-2 py-2 font-medium text-right whitespace-nowrap">기타 포인트</th>
                  <th className="px-2 py-2 font-medium text-right whitespace-nowrap">총 포인트</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.userId} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                    <td className="px-2 py-1.5 text-gray-200 whitespace-nowrap">{row.serverNick}</td>
                    <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">{row.teacherName}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{formatAmount(row.graduationPoint)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{formatAmount(row.clubPoint)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300 tabular-nums">{formatAmount(row.otherPoint)}</td>
                    <td className="px-2 py-1.5 text-right text-purple-300 font-medium tabular-nums">{formatAmount(row.totalPoint)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
