'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { TeacherActivityFields } from '@/components/teacher/teacher-activity-fields';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
            <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%` }} />
            <span className="text-[10px] text-gray-600">{d.month.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{
    teacher: { name: string; className: string; activityDays: string[]; activityTimeSlot: string | null; currentStudents: number; maxStudents: number };
    stats: { totalStudents: number; byClass: Record<string, number>; monthlyApplications: MonthlyPoint[]; monthlyInterviews: MonthlyPoint[] };
    students: Array<{ id: string; nickname: string; discord: string; className: string; status: string; createdAt: string }>;
  } | null>(null);
  const [activity, setActivity] = useState({ activityDays: [] as string[], activityTimeSlot: '' });
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch('/api/teacher/stats')
      .then((r) => {
        if (r.status === 403) throw new Error('forbidden');
        return r.json();
      })
      .then((d) => {
        setData(d);
        setActivity({
          activityDays: d.teacher.activityDays ?? [],
          activityTimeSlot: d.teacher.activityTimeSlot ?? '',
        });
      });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      load().catch(() => router.push('/mypage'));
    }
  }, [status, router]);

  const saveActivity = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (!res.ok) throw new Error();
      toast.success('활동 일정이 저장되었습니다');
      load();
    } catch {
      toast.error('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || !data) return <LoadingPage />;

  return (
    <MainLayout>
    <div className="page-container py-8 sm:py-12 section-gap max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">선생님 마이페이지</h1>
          <p className="text-gray-400 text-sm mt-1">{data.teacher.name} · {data.teacher.className}</p>
        </div>
        <Link href="/mypage" className="text-sm text-purple-400">일반 마이페이지</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900/80 border-gray-800"><div className="card-pad"><p className="text-sm text-gray-400">담당 학생</p><p className="text-3xl font-bold text-purple-400">{data.stats.totalStudents}</p></div></Card>
        <Card className="bg-gray-900/80 border-gray-800"><div className="card-pad"><p className="text-sm text-gray-400">정원</p><p className="text-3xl font-bold text-purple-400">{data.teacher.currentStudents}/{data.teacher.maxStudents}</p></div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900/80 border-gray-800"><div className="card-pad"><MonthlyChart title="월별 신청 수" data={data.stats.monthlyApplications} color="bg-purple-500/80" /></div></Card>
        <Card className="bg-gray-900/80 border-gray-800"><div className="card-pad"><MonthlyChart title="월별 졸업면담 수" data={data.stats.monthlyInterviews} color="bg-cyan-500/80" /></div></Card>
      </div>

      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad space-y-4">
          <h2 className="font-semibold">활동 일정</h2>
          <TeacherActivityFields activityDays={activity.activityDays} activityTimeSlot={activity.activityTimeSlot} onChange={setActivity} />
          <Button onClick={() => void saveActivity()} disabled={saving}>{saving ? '저장 중...' : '일정 저장'}</Button>
        </div>
      </Card>

      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        <div className="card-pad border-b border-gray-800"><h2 className="font-semibold">담당 학생</h2></div>
        {data.students.length === 0 ? <EmptyState title="담당 학생이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-gray-400 text-left"><th className="p-4">닉네임</th><th className="p-4">디스코드</th><th className="p-4">반</th><th className="p-4">상태</th><th className="p-4">배정일</th></tr></thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id} className="border-b border-gray-800/50">
                  <td className="p-4 font-medium">{s.nickname}</td>
                  <td className="p-4 text-gray-400">@{s.discord}</td>
                  <td className="p-4">{s.className}</td>
                  <td className="p-4"><Badge variant="outline">{STATUS_LABELS[s.status] || s.status}</Badge></td>
                  <td className="p-4 text-gray-500">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
    </MainLayout>
  );
}
