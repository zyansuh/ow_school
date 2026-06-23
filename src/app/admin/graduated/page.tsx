'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

type Graduated = {
  id: string;
  nickname: string;
  discord: string;
  className: string;
  teacherName: string;
  graduatedAt: string;
};

export default function AdminGraduatedPage() {
  const [users, setUsers] = useState<Graduated[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/graduated')
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">졸업생 목록</h1>
        <Link href="/admin/students" className="text-sm text-purple-400 hover:text-purple-300">
          학생 관리 →
        </Link>
      </div>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {users.length === 0 ? <EmptyState title="졸업생이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">서버 닉네임</th>
                <th className="p-4">디스코드</th>
                <th className="p-4">반</th>
                <th className="p-4">담당 선생님</th>
                <th className="p-4">졸업 처리일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50">
                  <td className="p-4 font-medium">{u.nickname}</td>
                  <td className="p-4 text-gray-400">@{u.discord}</td>
                  <td className="p-4">{u.className}</td>
                  <td className="p-4">{u.teacherName}</td>
                  <td className="p-4 text-gray-500">{formatDate(u.graduatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
