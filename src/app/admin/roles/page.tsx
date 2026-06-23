'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

type RoleUser = {
  discordUsername: string;
  discordNickname: string | null;
  discordServerNick: string | null;
  displayName: string;
};

type Role = { id: string; userId: string; user: RoleUser; createdAt: string };
type SearchUser = RoleUser & { id: string; isAdmin: boolean };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const load = () => fetch('/api/admin/roles').then((r) => r.json()).then((d) => { setRoles(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => { setResults(d); setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const action = async (action: 'grant' | 'revoke', targetId: string) => {
    const res = await fetch('/api/admin/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId: targetId }),
    });
    if (!res.ok) { toast.error('실패'); return; }
    toast.success(action === 'grant' ? '권한 부여됨' : '권한 해제됨');
    setQuery('');
    setResults([]);
    load();
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 권한</h1>
      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad space-y-3">
          <Input
            placeholder="서버 닉네임·디스코드 이름 검색 (2자 이상)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
                    <Button size="sm" onClick={() => action('grant', u.id)}>권한 부여</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
          )}
        </div>
      </Card>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 text-gray-400 text-left"><th className="p-4">서버 닉네임</th><th className="p-4">User ID</th><th className="p-4">부여일</th><th className="p-4">관리</th></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-gray-800/50">
                <td className="p-4">
                  <div className="font-medium">{r.user.displayName}</div>
                  <div className="text-xs text-gray-500">@{r.user.discordUsername}</div>
                </td>
                <td className="p-4 text-gray-500 font-mono text-xs">{r.userId}</td>
                <td className="p-4 text-gray-500">{formatDate(r.createdAt)}</td>
                <td className="p-4"><Button size="sm" variant="outline" onClick={() => action('revoke', r.userId)}>해제</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
