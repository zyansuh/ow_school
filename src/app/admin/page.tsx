'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { StatCard } from '@/components/ui/stat-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MonthlyStatsEditor } from '@/components/admin/monthly-stats-editor';
import { DiscordSyncPanel } from '@/components/admin/discord-sync/discord-sync-panel';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';
import { Users, GraduationCap, FileText, Layers } from 'lucide-react';

type MonthlyPoint = { month: string; count: number };

function MonthlyChart({ data, color }: { data: MonthlyPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">{d.count}</span>
          <div
            className={`w-full rounded-t ${color}`}
            style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%` }}
          />
          <span className="text-[10px] text-subtle">{d.month.slice(5)}</span>
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

  const loadStats = () => fetch('/api/admin/stats').then((r) => r.json()).then((d) => setStats(d.stats));

  useEffect(() => {
    loadStats();
    fetch('/api/notices').then((r) => r.json()).then((d) => setNoticesText((d.items as string[]).join('\n')));
  }, []);

  const saveNotices = async () => {
    const items = noticesText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) { toast.error('공지사항을 한 줄 이상 입력하세요'); return; }
    setSavingNotices(true);
    try {
      const res = await fetch('/api/notices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      if (!res.ok) throw new Error();
      toast.success('공지사항이 저장되었습니다');
    } catch { toast.error('저장 실패'); } finally { setSavingNotices(false); }
  };

  if (!stats) return <LoadingPage />;

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader title="대시보드" description="정착지원국 운영 현황을 한눈에 확인합니다." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="총 학생 수" value={stats.totalStudents} suffix="명" icon={Users} />
        <StatCard label="총 선생님 수" value={stats.totalTeachers} suffix="명" icon={GraduationCap} />
        <StatCard label="이번 달 신청" value={stats.monthlyApplicationCount} suffix="건" icon={FileText} />
        <StatCard label="반 수" value={Object.keys(stats.byClass).length} suffix="개" icon={Layers} />
      </div>

      <DiscordSyncPanel onSynced={loadStats} />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className={`${ds.card} ${ds.cardPad}`}>
          <MonthlyStatsEditor title="월별 신청 수 (최근 6개월)" type="applications" data={stats.monthlyApplications} onSaved={loadStats} />
          <MonthlyChart data={stats.monthlyApplications} color="bg-primary/80" />
        </Card>
        <Card className={`${ds.card} ${ds.cardPad}`}>
          <MonthlyStatsEditor title="월별 졸업면담 수 (최근 6개월)" type="interviews" data={stats.monthlyInterviews} onSaved={loadStats} />
          <MonthlyChart data={stats.monthlyInterviews} color="bg-secondary/80" />
        </Card>
      </div>

      <Card className={`${ds.card} ${ds.cardPad}`}>
        <h2 className={ds.sectionTitle}>반별 학생 수</h2>
        <div className="mt-4 space-y-2">
          {Object.entries(stats.byClass).map(([name, count]) => (
            <div key={name} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{name}</span>
              <span className="text-primary font-medium">{count}명</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className={`${ds.card} ${ds.cardPad}`}>
        <div className="space-y-3">
          <h2 className={ds.sectionTitle}>메인 공지사항</h2>
          <Textarea value={noticesText} onChange={(e) => setNoticesText(e.target.value)} className="font-mono text-sm" />
          <Button onClick={() => void saveNotices()} disabled={savingNotices}>
            {savingNotices ? '저장 중...' : '공지사항 저장'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
