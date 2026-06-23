'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

type Role = { id: string; userId: string; user: { discordUsername: string; discordNickname: string | null }; createdAt: string };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => fetch('/api/admin/roles').then((r) => r.json()).then((d) => { setRoles(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const action = async (action: 'grant' | 'revoke', targetId: string) => {
    const res = await fetch('/api/admin/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId: targetId }),
    });
    if (!res.ok) { toast.error('실패'); return; }
    toast.success(action === 'grant' ? '권한 부여됨' : '권한 해제됨');
    load();
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 권한</h1>
      <Card className="bg-gray-900/80 border-gray-800">
        <div className="card-pad flex flex-col sm:flex-row gap-3">
          <Input placeholder="User ID (cuid)" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Button onClick={() => userId && action('grant', userId)}>권한 부여</Button>
        </div>
      </Card>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 text-gray-400 text-left"><th className="p-4">유저</th><th className="p-4">User ID</th><th className="p-4">부여일</th><th className="p-4">관리</th></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-gray-800/50">
                <td className="p-4">{r.user.discordNickname || r.user.discordUsername}</td>
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
