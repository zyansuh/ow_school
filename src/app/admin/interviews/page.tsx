'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

type Interview = {
  id: string; nickname: string; satisfaction: number; memorable: string; improvements?: string; review: string; createdAt: string;
  teacher: { name: string } | null;
};

export default function AdminInterviewsPage() {
  const [items, setItems] = useState<Interview[]>([]);
  const [selected, setSelected] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/interviews').then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">졸업면담 관리</h1>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {items.length === 0 ? <EmptyState title="졸업면담이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-gray-400 text-left"><th className="p-4">학생명</th><th className="p-4">담당 선생님</th><th className="p-4">제출일</th><th className="p-4">만족도</th><th className="p-4">상세</th></tr></thead>
            <tbody>
              {items.map((iv) => (
                <tr key={iv.id} className="border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30" onClick={() => setSelected(iv)}>
                  <td className="p-4">{iv.nickname}</td>
                  <td className="p-4">{iv.teacher?.name || '-'}</td>
                  <td className="p-4 text-gray-500">{formatDate(iv.createdAt)}</td>
                  <td className="p-4">{iv.satisfaction}점</td>
                  <td className="p-4 text-purple-400">보기</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {selected && (
        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad space-y-4">
            <h2 className="font-semibold">{selected.nickname} · {selected.satisfaction}점</h2>
            <div><p className="text-gray-500 text-xs mb-1">기억에 남는 점</p><p className="text-gray-300 text-sm">{selected.memorable}</p></div>
            {selected.improvements && <div><p className="text-gray-500 text-xs mb-1">개선점</p><p className="text-gray-300 text-sm">{selected.improvements}</p></div>}
            <div><p className="text-gray-500 text-xs mb-1">후기</p><p className="text-gray-300 text-sm">{selected.review}</p></div>
            <button className="text-sm text-gray-400" onClick={() => setSelected(null)}>닫기</button>
          </div>
        </Card>
      )}
    </div>
  );
}
