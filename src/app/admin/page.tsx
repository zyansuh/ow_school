'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { MonthlyStatsEditor } from '@/components/admin/monthly-stats-editor';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

type MonthlyPoint = { month: string; count: number };

type GraduationReview = {
  id: string;
  authorName: string;
  className: string;
  content: string;
  createdAt: string;
};

function MonthlyChart({ data, color }: { data: MonthlyPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{d.count}</span>
          <div
            className={`w-full rounded-t ${color}`}
            style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%` }}
          />
          <span className="text-[10px] text-gray-600">{d.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalTeachers: number;
    monthlyApplicationCount: number;
    byClass: Record<string, number>;
    monthlyApplications: MonthlyPoint[];
    monthlyInterviews: MonthlyPoint[];
  } | null>(null);
  const [noticesText, setNoticesText] = useState('');
  const [savingNotices, setSavingNotices] = useState(false);
  const [reviews, setReviews] = useState<GraduationReview[]>([]);
  const [syncingDiscord, setSyncingDiscord] = useState(false);
  const [syncReport, setSyncReport] = useState<{
    usersSynced: number;
    usersFailed: number;
    teachersRecounted: number;
    teacherLinkMismatches: Array<{ userId: string; discordId: string }>;
  } | null>(null);

  const loadStats = () => fetch('/api/admin/stats').then((r) => r.json()).then((d) => setStats(d.stats));

  useEffect(() => {
    loadStats();
    fetch('/api/notices').then((r) => r.json()).then((d) => setNoticesText((d.items as string[]).join('\n')));
    fetch('/api/admin/graduation-reviews').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setReviews(d);
    });
  }, []);

  const runDiscordSync = async () => {
    setSyncingDiscord(true);
    setSyncReport(null);
    try {
      const res = await fetch('/api/admin/discord-sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '동기화 실패');
      setSyncReport(data);
      toast.success(`Discord 동기화 완료 (유저 ${data.usersSynced}명, 실패 ${data.usersFailed}명)`);
      loadStats();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '동기화 실패');
    } finally {
      setSyncingDiscord(false);
    }
  };

  const saveNotices = async () => {
    const items = noticesText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) {
      toast.error('공지사항을 한 줄 이상 입력하세요');
      return;
    }
    setSavingNotices(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error();
      toast.success('공지사항이 저장되었습니다');
    } catch {
      toast.error('저장 실패');
    } finally {
      setSavingNotices(false);
    }
  };

  if (!stats) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '총 학생 수', value: stats.totalStudents },
          { label: '총 선생님 수', value: stats.totalTeachers },
          { label: '이번 달 신청', value: stats.monthlyApplicationCount },
          { label: '반 수', value: Object.keys(stats.byClass).length },
        ].map((s) => (
          <Card key={s.label} className="bg-gray-900/80 border-gray-800">
            <div className="card-pad">
              <p className="text-sm text-gray-400 mb-2">{s.label}</p>
              <p className="text-3xl font-bold text-purple-400">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad space-y-3">
          <h2 className="font-semibold">Discord 동기화</h2>
          <p className="text-sm text-gray-400">
            서버 닉네임·역할을 최신화하고, 담당 학생 수·선생님 연결을 검증합니다.
          </p>
          <Button onClick={runDiscordSync} disabled={syncingDiscord}>
            {syncingDiscord ? '동기화 중...' : 'Discord 동기화'}
          </Button>
          {syncReport && (
            <div className="text-sm text-gray-400 space-y-1 pt-2 border-t border-gray-800">
              <p>동기화 성공: {syncReport.usersSynced}명 · 실패: {syncReport.usersFailed}명</p>
              <p>선생님 학생 수 재계산: {syncReport.teachersRecounted}명</p>
              {syncReport.teacherLinkMismatches.length > 0 && (
                <p className="text-amber-400">
                  선생님 연결 불일치 {syncReport.teacherLinkMismatches.length}건 (관리자 확인 필요)
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad">
            <MonthlyStatsEditor
              title="월별 신청 수 (최근 6개월)"
              type="applications"
              data={stats.monthlyApplications}
              onSaved={loadStats}
            />
            <MonthlyChart data={stats.monthlyApplications} color="bg-purple-500/80" />
          </div>
        </Card>
        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad">
            <MonthlyStatsEditor
              title="월별 졸업면담 수 (최근 6개월)"
              type="interviews"
              data={stats.monthlyInterviews}
              onSaved={loadStats}
            />
            <MonthlyChart data={stats.monthlyInterviews} color="bg-cyan-500/80" />
          </div>
        </Card>
      </div>

      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad">
          <h2 className="font-semibold mb-4">반별 학생 수</h2>
          <div className="space-y-2">
            {Object.entries(stats.byClass).map(([name, count]) => (
              <div key={name} className="flex justify-between text-sm">
                <span className="text-gray-300">{name}</span>
                <span className="text-purple-400">{count}명</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">졸업후기</h2>
            <Link href="/admin/graduation-reviews" className="text-sm text-purple-400 hover:text-purple-300">
              전체 보기 →
            </Link>
          </div>
          {reviews.length === 0 ? (
            <EmptyState title="등록된 졸업후기가 없습니다" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-left">
                    <th className="p-3 w-28">작성자</th>
                    <th className="p-3 w-24">반</th>
                    <th className="p-3">내용</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b border-gray-800/50">
                      <td className="p-3 text-gray-200">{r.authorName}</td>
                      <td className="p-3 text-purple-300">{r.className}</td>
                      <td className="p-3 text-gray-300"><p className="line-clamp-2">{r.content}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad space-y-3">
          <h2 className="font-semibold">메인 공지사항</h2>
          <Textarea value={noticesText} onChange={(e) => setNoticesText(e.target.value)} className="min-h-[120px] font-mono text-sm" />
          <Button onClick={saveNotices} disabled={savingNotices}>{savingNotices ? '저장 중...' : '공지사항 저장'}</Button>
        </div>
      </Card>
    </div>
  );
}
