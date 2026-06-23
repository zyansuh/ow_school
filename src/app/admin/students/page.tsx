'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FILTERS = ['전체', '수달반', '사자반', '여우반'];

type Student = {
  id: string;
  nickname: string;
  discord: string;
  siteDisplayName: string | null;
  className: string;
  teacherName: string;
  status: string;
  createdAt: string;
};

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<Student[]>([]);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<Student | null>(null);
  const [nickDraft, setNickDraft] = useState('');

  const load = () =>
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); });

  useEffect(() => { load(); }, []);

  const filtered = filter === '전체' ? users : users.filter((u) => u.className === filter);

  const graduate = async (id: string) => {
    if (!confirm('이 학생을 졸업 처리하시겠습니까?')) return;
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'graduate' }),
    });
    if (!res.ok) { toast.error('졸업 처리 실패'); return; }
    toast.success('졸업 처리되었습니다');
    load();
  };

  const saveNick = async () => {
    if (!editUser) return;
    const res = await fetch(`/api/admin/students/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteDisplayName: nickDraft.trim() || null }),
    });
    if (!res.ok) { toast.error('저장 실패'); return; }
    toast.success('닉네임이 저장되었습니다');
    setEditUser(null);
    load();
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">학생 관리</h1>
        <Link href="/admin/graduated" className="text-sm text-purple-400 hover:text-purple-300">
          졸업생 목록 →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 rounded-lg text-sm', filter === f ? 'bg-purple-600/30 text-purple-300' : 'bg-gray-800 text-gray-400')}>
            {f}
          </button>
        ))}
      </div>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {filtered.length === 0 ? <EmptyState title="학생이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">서버 닉네임</th>
                <th className="p-4">디스코드</th>
                <th className="p-4">반</th>
                <th className="p-4">담당 선생님</th>
                <th className="p-4">상태</th>
                <th className="p-4">가입일</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4 font-medium">{u.nickname}</td>
                  <td className="p-4 text-gray-400">@{u.discord}</td>
                  <td className="p-4">{u.className}</td>
                  <td className="p-4">{u.teacherName}</td>
                  <td className="p-4"><Badge variant="outline">{STATUS_LABELS[u.status] || u.status}</Badge></td>
                  <td className="p-4 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="p-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditUser(u); setNickDraft(u.siteDisplayName || u.nickname); }}>닉 수정</Button>
                    <Button size="sm" variant="outline" onClick={() => void graduate(u.id)}>졸업</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 닉네임 수정</DialogTitle>
          </DialogHeader>
          <Input value={nickDraft} onChange={(e) => setNickDraft(e.target.value)} maxLength={32} className="mt-2" />
          <Button className="w-full mt-4" onClick={() => void saveNick()}>저장</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
