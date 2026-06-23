'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type MeData = {
  displayName: string;
  serverNickname?: string | null;
  globalDisplayName?: string | null;
  discordNickname: string | null;
  discordUsername: string;
  discordServerNick: string | null;
  discordRoleNames: string[];
  isInGuild: boolean;
  class: { name: string } | null;
  teacher: { name: string } | null;
  applications: Array<{ id: string; status: string; createdAt: string; teacher: { name: string } }>;
  interviews: Array<{ id: string; createdAt: string }>;
};

export function useMyPageData() {
  const { data: session, update } = useSession();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickInput, setNickInput] = useState('');
  const [savingNick, setSavingNick] = useState(false);
  const [requestingAdmin, setRequestingAdmin] = useState(false);

  const load = useCallback(() =>
    fetch('/api/me?refresh=1')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setNickInput(d.discordServerNick ?? d.serverNickname ?? '');
      }), []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, [session, load]);

  const saveNick = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNick(true);
    try {
      const res = await fetch('/api/me/guild-nick', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: nickInput.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '변경 실패');
      toast.success('서버 닉네임이 변경되었습니다');
      await load();
      await update();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '변경 실패');
    } finally {
      setSavingNick(false);
    }
  };

  const requestAdminRole = async () => {
    setRequestingAdmin(true);
    try {
      const res = await fetch('/api/admin/role-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '관리자 권한 요청' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '요청 실패');
      toast.success('관리자 권한 요청이 접수되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '요청 실패');
    } finally {
      setRequestingAdmin(false);
    }
  };

  return {
    session,
    data,
    loading,
    nickInput,
    setNickInput,
    savingNick,
    saveNick,
    requestingAdmin,
    requestAdminRole,
  };
}
