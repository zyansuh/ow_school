'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';

type TeacherOption = { id: string; name: string; class: { name: string } };

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [form, setForm] = useState({
    nickname: '',
    teacherId: '',
    satisfaction: '5',
    memorable: '',
    improvements: '',
    review: '',
  });

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch('/api/teachers').then((r) => r.json()),
      fetch('/api/me').then((r) => r.json()),
    ]).then(([teacherList, me]) => {
      setTeachers(teacherList);
      setForm((f) => ({
        ...f,
        nickname: f.nickname || session.user.discordServerNick || session.user.discordNickname || session.user.discordUsername || '',
        teacherId: me?.teacherId || f.teacherId,
      }));
    });
  }, [session]);

  if (status === 'loading') return <MainLayout><LoadingPage /></MainLayout>;

  if (!session) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center space-y-4">
          <p className="text-gray-400">졸업면담은 로그인 후 작성할 수 있습니다</p>
          <Button onClick={() => signIn('discord')}>Discord 로그인</Button>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          satisfaction: Number(form.satisfaction),
          teacherId: form.teacherId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('졸업면담이 제출되었습니다');
      router.push('/mypage');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '제출 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">졸업면담</h1>
        <Card className="bg-gray-900/80 border-gray-800 max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="card-pad space-y-5">
            <div>
              <Label>닉네임 *</Label>
              <Input required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="mt-2" />
            </div>
            <div>
              <Label>담당 선생님 (선택)</Label>
              <Select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className="mt-2"
              >
                <option value="">선택 안 함</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.class.name})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>수업 만족도 *</Label>
              <Select required value={form.satisfaction} onChange={(e) => setForm({ ...form, satisfaction: e.target.value })} className="mt-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}점</option>)}
              </Select>
            </div>
            <div><Label>가장 기억에 남는 점 *</Label><Textarea required value={form.memorable} onChange={(e) => setForm({ ...form, memorable: e.target.value })} className="mt-2" /></div>
            <div><Label>개선점</Label><Textarea value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} className="mt-2" /></div>
            <div><Label>후기 *</Label><Textarea required minLength={10} value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} className="mt-2 min-h-[120px]" /></div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? '제출 중...' : '제출하기'}</Button>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
