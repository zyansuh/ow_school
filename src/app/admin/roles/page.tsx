'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { adminStyles } from '@/styles/admin';

type RoleUser = {
  discordUsername: string;
  displayName: string;
};

type Role = { id: string; userId: string; user: RoleUser; createdAt: string };
type SearchUser = RoleUser & { id: string; isAdmin: boolean };
type PendingRequest = {
  id: string;
  userId: string;
  displayName: string;
  message: string | null;
  createdAt: string;
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const load = () =>
    Promise.all([
      fetch('/api/admin/roles').then((r) => r.json()),
      fetch('/api/admin/role-requests').then((r) => r.json()),
    ]).then(([r, req]) => {
      setRoles(r);
      setRequests(req);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => { setResults(d); setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const grantOrRevoke = async (action: 'grant' | 'revoke', targetId: string) => {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId: targetId }),
    });
    if (!res.ok) { toast.error('실패'); return; }
    toast.success(action === 'grant' ? '권한 부여됨' : '권한 해제됨');
    setQuery('');
    setResults([]);
    load();
  };

  const reviewRequest = async (requestId: string, approve: boolean) => {
    const res = await fetch('/api/admin/role-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, approve }),
    });
    if (!res.ok) { toast.error('처리 실패'); return; }
    toast.success(approve ? '승인되었습니다' : '거절되었습니다');
    load();
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 리스트</h1>
      <p className={adminStyles.muted}>사용자 검색 후 권한 부여, 또는 아래 요청을 승인/거절할 수 있습니다.</p>

      {requests.length > 0 && (
        <Card className={adminStyles.card}>
          <div className={`${adminStyles.cardPad} space-y-3`}>
            <h2 className="font-semibold">대기 중인 권한 요청 ({requests.length})</h2>
            <ul className="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
              {requests.map((req) => (
                <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-950/50">
                  <div>
                    <p className="font-medium">{req.displayName}</p>
                    <p className="text-xs text-gray-500">{formatDate(req.createdAt)}</p>
                    {req.message && <p className="text-sm text-gray-400 mt-1">{req.message}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => reviewRequest(req.id, true)}>승인</Button>
                    <Button size="sm" variant="outline" onClick={() => reviewRequest(req.id, false)}>거절</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Card className={adminStyles.card}>
        <div className={`${adminStyles.cardPad} space-y-3`}>
          <Input placeholder="서버 닉네임·디스코드 이름 검색 (2자 이상)" value={query} onChange={(e) => setQuery(e.target.value)} />
          {searching && <p className="text-sm text-gray-500">검색 중...</p>}
          {results.length > 0 && (
            <ul className="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
              {results.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 p-3 bg-gray-950/50">
                  <div>
                    <p className="font-medium">{u.displayName}</p>
                    <p className="text-xs text-gray-500">@{u.discordUsername}</p>
                  </div>
                  {u.isAdmin ? (
                    <span className="text-xs text-purple-400">이미 관리자</span>
                  ) : (
                    <Button size="sm" onClick={() => grantOrRevoke('grant', u.id)}>권한 부여</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className={`${adminStyles.card} overflow-x-auto`}>
        <div className={`${adminStyles.cardPad} border-b border-gray-800`}>
          <h2 className="font-semibold text-sm text-gray-300">권한 해제</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className={adminStyles.tableHead}>
              <th className="p-4">서버 닉네임</th>
              <th className="p-4">User ID</th>
              <th className="p-4">부여일</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className={adminStyles.tableRow}>
                <td className="p-4">
                  <div className="font-medium">{r.user.displayName}</div>
                  <div className="text-xs text-gray-500">@{r.user.discordUsername}</div>
                </td>
                <td className="p-4 text-gray-500 font-mono text-xs">{r.userId}</td>
                <td className="p-4 text-gray-500">{formatDate(r.createdAt)}</td>
                <td className="p-4">
                  <Button size="sm" variant="outline" onClick={() => grantOrRevoke('revoke', r.userId)}>해제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
