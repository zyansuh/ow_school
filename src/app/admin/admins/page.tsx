'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

type AdminUser = {
  id: string;
  userId: string;
  displayName: string;
  discord: string;
  roleNames: string[];
  isInGuild: boolean;
  grantedAt: string;
};

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/admins')
      .then((r) => r.json())
      .then((d) => {
        setAdmins(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">관리자 목록</h1>
        <Link href="/admin/roles" className="text-sm text-purple-400 hover:text-purple-300">
          관리자 권한 부여/해제 →
        </Link>
      </div>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {admins.length === 0 ? (
          <EmptyState title="등록된 관리자가 없습니다" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">서버 닉네임</th>
                <th className="p-4">디스코드</th>
                <th className="p-4">서버 역할</th>
                <th className="p-4">권한 부여일</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="font-medium text-purple-200">{a.displayName}</div>
                    {!a.isInGuild && <span className="text-xs text-amber-500">서버 미가입</span>}
                  </td>
                  <td className="p-4 text-gray-400">@{a.discord}</td>
                  <td className="p-4 text-gray-400 max-w-[200px]">
                    {a.roleNames?.length ? a.roleNames.join(', ') : '-'}
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(a.grantedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-xs text-gray-500">
        새 관리자 추가는 <Link href="/admin/roles" className="text-purple-400">관리자 권한</Link> 페이지에서 할 수 있습니다.
      </p>
    </div>
  );
}
