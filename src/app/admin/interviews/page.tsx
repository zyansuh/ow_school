'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

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
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">학생명</th>
                <th className="p-4">반</th>
                <th className="p-4">담당 선생님</th>
                <th className="p-4">동호회</th>
                <th className="p-4">제출일</th>
                <th className="p-4">상세</th>
              </tr>
            </thead>
            <tbody>
              {items.map((iv) => (
                <tr key={iv.id} className="border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30" onClick={() => setSelected(iv)}>
                  <td className="p-4">{iv.nickname}</td>
                  <td className="p-4">{iv.className || '-'}</td>
                  <td className="p-4">{iv.teacher?.name || '-'}</td>
                  <td className="p-4">{iv.joinedClub ? '예' : '아니오'}</td>
                  <td className="p-4 text-gray-500">{formatDate(iv.createdAt)}</td>
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
            <h2 className="font-semibold">
              {selected.nickname} · {selected.className || '미배정'}
            </h2>
            <div>
              <p className="text-gray-500 text-xs mb-1">질문 1 · 평겜마 콘텐츠 참여 경험</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{selected.contentExperience}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">질문 2 · 인상 깊었던 사람</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{selected.memorablePerson}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">질문 3 · 동호회 가입</p>
              <p className="text-gray-300 text-sm">{selected.joinedClub ? '예' : '아니오'}</p>
              {selected.joinedClub && parseClubNames(selected.clubNames).length > 0 && (
                <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
                  {parseClubNames(selected.clubNames).map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              )}
            </div>
            <button className="text-sm text-gray-400" onClick={() => setSelected(null)}>닫기</button>
          </div>
        </Card>
      )}
    </div>
  );
}
