'use client';

import { useEffect, useState, Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { PLAY_TIME_SLOTS } from '@/lib/form-options';
import { ds } from '@/styles/design-system';
import { useApplyForm } from '@/hooks/apply/use-apply-form';

function ApplyForm() {
  const { session, status, teachers, form, setForm, loading, submit, signIn } = useApplyForm();

  if (status === 'loading') return <LoadingPage />;

  if (!session) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className={ds.textMuted}>수강 신청은 로그인 후 가능합니다</p>
        <Button onClick={() => void signIn()}>Discord 로그인</Button>
      </div>
    );
  }

  return (
    <Card className={`${ds.card} max-w-lg mx-auto`}>
      <form onSubmit={submit} className="card-pad space-y-5">
        <div>
          <Label htmlFor="nickname">평겜마 닉네임(오픈카톡 닉네임) *</Label>
          <Input id="nickname" required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="discord">Discord User ID *</Label>
          <Input id="discord" required readOnly value={form.discord} className="mt-2 font-mono text-sm bg-muted/40" />
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
        <h1 className={ds.title}>수강 신청</h1>
        <Suspense fallback={<LoadingPage />}><ApplyForm /></Suspense>
      </div>
    </MainLayout>
  );
}
