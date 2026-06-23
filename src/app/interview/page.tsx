'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    teacherId: '',
    satisfaction: '5',
    memorable: '',
    improvements: '',
    review: '',
  });

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
            <div><Label>닉네임 *</Label><Input required value={form.nickname || session.user.discordNickname || ''} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="mt-2" /></div>
            <div><Label>담당 선생님 ID (선택)</Label><Input value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} placeholder="자동 해제됩니다" className="mt-2" /></div>
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
