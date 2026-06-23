'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import { userDisplayName } from '@/lib/user-display';
import { PLAY_TIME_SLOTS } from '@/lib/form-options';

type Teacher = { id: string; name: string; class: { name: string } };

function ApplyForm() {
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
        nickname: userDisplayName(session.user),
      }));
    }
  }, [session]);

  if (status === 'loading') return <LoadingPage />;

  if (!session) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-gray-400">수강 신청은 로그인 후 가능합니다</p>
        <Button onClick={() => signIn('discord')}>Discord 로그인</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <Card className="bg-gray-900/80 border-gray-800 max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="card-pad space-y-5">
        <div>
          <Label htmlFor="nickname">평겜마 닉네임(오픈카톡 닉네임) *</Label>
          <Input id="nickname" required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="discord">디스코드 *</Label>
          <Input id="discord" required value={form.discord} onChange={(e) => setForm({ ...form, discord: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="playTimeSlot">평소 게임하는 시간대 *</Label>
          <Select id="playTimeSlot" required value={form.playTimeSlot} onChange={(e) => setForm({ ...form, playTimeSlot: e.target.value })} className="mt-2">
            {PLAY_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="teacherId">희망 선생님 *</Label>
          <Select id="teacherId" required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="mt-2">
            <option value="">선택하세요</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.class.name})</option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? '신청 중...' : '신청하기'}</Button>
      </form>
    </Card>
  );
}

export default function ApplyPage() {
  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">수강 신청</h1>
        <Suspense fallback={<LoadingPage />}><ApplyForm /></Suspense>
      </div>
    </MainLayout>
  );
}
