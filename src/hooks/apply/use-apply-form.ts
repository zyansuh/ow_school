'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithDiscord } from '@/hooks/auth/use-discord-sign-in';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userDisplayName } from '@/lib/users/display';
import { PLAY_TIME_SLOTS } from '@/lib/utils/form-options';
import type { TeacherSelectItem } from '@/components/apply/teacher-select-card';

export function useApplyForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const preTeacher = params.get('teacher');
  const classSlug = params.get('class');

  const [teachers, setTeachers] = useState<TeacherSelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    discord: '',
    playTimeSlot: PLAY_TIME_SLOTS[0] as string,
    teacherId: preTeacher || '',
  });

  useEffect(() => {
    const url = classSlug
      ? `/api/teachers?slug=${encodeURIComponent(classSlug)}`
      : '/api/teachers';
    fetch(url)
      .then((r) => r.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []));
  }, [classSlug]);

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        discord: session.user.discordId,
      }));
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
    if (!form.teacherId) {
      toast.error('희망 선생님을 선택해 주세요');
      return;
    }
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

  return { session, status, teachers, form, setForm, loading, submit, signIn: signInWithDiscord };
}
