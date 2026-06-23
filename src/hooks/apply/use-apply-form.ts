'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userDisplayName } from '@/lib/user-display';
import { PLAY_TIME_SLOTS } from '@/lib/form-options';

type Teacher = { id: string; name: string; class: { name: string } };

export function useApplyForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const preTeacher = params.get('teacher');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    discord: '',
    playTimeSlot: PLAY_TIME_SLOTS[0] as string,
    teacherId: preTeacher || '',
  });

  useEffect(() => {
    fetch('/api/teachers').then((r) => r.json()).then(setTeachers);
  }, []);

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        discord: session.user.discordUsername,
      }));
      // 세션 JWT는 길드 닉 동기화 전 값일 수 있어 /api/me 최신 표시명 사용
      fetch('/api/me')
        .then((r) => r.json())
        .then((me) => {
          if (me?.displayName) {
            setForm((f) => ({ ...f, nickname: me.displayName }));
          } else {
            setForm((f) => ({ ...f, nickname: userDisplayName(session.user) }));
          }
        })
        .catch(() => {
          setForm((f) => ({ ...f, nickname: userDisplayName(session.user) }));
        });
    }
  }, [session]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('수강 신청이 완료되었습니다');
      router.push('/mypage');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '신청 실패');
    } finally {
      setLoading(false);
    }
  };

  return { session, status, teachers, form, setForm, loading, submit, signIn };
}
