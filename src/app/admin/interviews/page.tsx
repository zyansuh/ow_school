'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

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
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch('/api/admin/interviews')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItems(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/interviews/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('졸업면담이 삭제되었습니다');
      setDeleteTarget(null);
      setDeleteReason('');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">졸업면담 관리</h1>
      <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
        {items.length === 0 ? <EmptyState title="졸업면담이 없습니다" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">서버닉네임</th>
                <th className="p-4">반</th>
                <th className="p-4">담당 선생님</th>
                <th className="p-4">동호회</th>
                <th className="p-4">제출일</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((iv) => (
                <tr key={iv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">{iv.nickname}</td>
                  <td className="p-4">{iv.className || '-'}</td>
                  <td className="p-4">{iv.teacher?.name || '-'}</td>
                  <td className="p-4">{iv.joinedClub ? '예' : '아니오'}</td>
                  <td className="p-4 text-gray-500">{formatDate(iv.createdAt)}</td>
                  <td className="p-4 space-x-2">
                    <button type="button" className="text-purple-400 hover:text-purple-300" onClick={() => setSelected(iv)}>
                      보기
                    </button>
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                      onClick={() => setDeleteTarget(iv)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 삭제
                    </button>
                  </td>
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
            <div className="flex gap-2">
              <Link href={`/interview`} className="text-sm text-purple-400">학생 수정 페이지</Link>
              <button type="button" className="text-sm text-gray-400" onClick={() => setSelected(null)}>닫기</button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>졸업면담 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-400">
            정말 <span className="text-gray-200">{deleteTarget?.nickname}</span>님의 졸업면담을 삭제하시겠습니까?
            <br />
            연결된 졸업·동호회 포인트 내역도 함께 삭제됩니다.
          </p>
          <Textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="삭제 사유 (선택)"
            className="mt-2"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
