'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { DiscordSyncReport } from '@/lib/discord-sync-admin';

export function useDiscordSync() {
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState<DiscordSyncReport | null>(null);

  const runSync = async () => {
    setSyncing(true);
    setReport(null);
    try {
      const res = await fetch('/api/admin/discord-sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '동기화 실패');
      setReport(data);
      toast.success(`Discord 동기화 완료 (유저 ${data.usersSynced}명)`);
      return data as DiscordSyncReport;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '동기화 실패');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  const fixLink = async (userId: string, teacherId: string | null) => {
    const res = await fetch('/api/admin/discord-sync/fix-link', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, teacherId }),
    });
    if (!res.ok) {
      toast.error('연결 수정 실패');
      return false;
    }
    toast.success('선생님 연결이 수정되었습니다');
    return true;
  };

  return { syncing, report, runSync, fixLink, setReport };
}
