'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalTeachers: number;
    pendingApplications: number;
    byClass: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then((d) => setStats(d.stats));
  }, []);

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
    </div>
  );
}
