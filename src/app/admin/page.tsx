'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';

type MonthlyPoint = { month: string; count: number };

function MonthlyChart({ title, data, color }: { title: string; data: MonthlyPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
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
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalTeachers: number;
    pendingApplications: number;
    byClass: Record<string, number>;
    monthlyApplications: MonthlyPoint[];
    monthlyInterviews: MonthlyPoint[];
  } | null>(null);
  const [noticesText, setNoticesText] = useState('');
  const [savingNotices, setSavingNotices] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then((d) => setStats(d.stats));
    fetch('/api/notices').then((r) => r.json()).then((d) => setNoticesText((d.items as string[]).join('\n')));
  }, []);

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
          { label: '승인 대기', value: stats.pendingApplications },
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

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad">
            <MonthlyChart title="월별 신청 수 (최근 6개월)" data={stats.monthlyApplications} color="bg-purple-500/80" />
          </div>
        </Card>
        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad">
            <MonthlyChart title="월별 졸업면담 수 (최근 6개월)" data={stats.monthlyInterviews} color="bg-cyan-500/80" />
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
        <div className="card-pad space-y-3">
          <h2 className="font-semibold">메인 공지사항</h2>
          <p className="text-xs text-gray-500">한 줄에 하나씩 입력하세요</p>
          <Textarea
            value={noticesText}
            onChange={(e) => setNoticesText(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
          />
          <Button onClick={saveNotices} disabled={savingNotices}>
            {savingNotices ? '저장 중...' : '공지사항 저장'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
