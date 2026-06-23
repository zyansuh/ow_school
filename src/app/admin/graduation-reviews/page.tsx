'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

type GraduationReview = {
  id: string;
  authorName: string;
  className: string;
  content: string;
  createdAt: string;
};

export default function AdminGraduationReviewsPage() {
  const [items, setItems] = useState<GraduationReview[]>([]);
  const [selected, setSelected] = useState<GraduationReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/graduation-reviews')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setItems(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">졸업후기 관리</h1>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState title="등록된 졸업후기가 없습니다" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">작성자</th>
                <th className="p-4">반</th>
                <th className="p-4">내용</th>
                <th className="p-4">작성일</th>
                <th className="p-4">상세</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30"
                  onClick={() => setSelected(r)}
                >
                  <td className="p-4 whitespace-nowrap">{r.authorName}</td>
                  <td className="p-4 text-purple-300 whitespace-nowrap">{r.className}</td>
                  <td className="p-4 text-gray-300 max-w-md">
                    <p className="line-clamp-2">{r.content}</p>
                  </td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
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
              {selected.authorName} · {selected.className}
            </h2>
            <p className="text-xs text-gray-500">{formatDate(selected.createdAt)}</p>
            <div>
              <p className="text-gray-500 text-xs mb-1">후기 내용</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{selected.content}</p>
            </div>
            <button type="button" className="text-sm text-gray-400" onClick={() => setSelected(null)}>
              닫기
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
