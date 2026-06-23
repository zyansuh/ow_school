'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { STATUS_LABELS, formatDate } from '@/lib/utils';

type MeData = {
  discordNickname: string | null;
  discordUsername: string;
  class: { name: string } | null;
  teacher: { name: string } | null;
  applications: Array<{ id: string; status: string; createdAt: string; teacher: { name: string } }>;
  interviews: Array<{ id: string; createdAt: string }>;
};

export default function MyPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch('/api/me').then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [session]);

  if (status === 'loading' || loading) return <MainLayout><LoadingPage /></MainLayout>;

  if (!session) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center space-y-4">
          <p className="text-gray-400">마이페이지는 로그인 후 이용 가능합니다</p>
          <Button onClick={() => signIn('discord')}>Discord 로그인</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">마이페이지</h1>

        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad space-y-3">
            <h2 className="heading-section text-gray-200">내 정보</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">닉네임</span><p className="text-gray-200 mt-1">{data?.discordNickname || data?.discordUsername}</p></div>
              <div><span className="text-gray-500">디스코드</span><p className="text-gray-200 mt-1">{data?.discordUsername}</p></div>
              <div><span className="text-gray-500">현재 반</span><p className="text-gray-200 mt-1">{data?.class?.name || '미배정'}</p></div>
              <div><span className="text-gray-500">담당 선생님</span><p className="text-gray-200 mt-1">{data?.teacher?.name || '-'}</p></div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="heading-section text-gray-200">신청 내역</h2>
          {!data?.applications?.length ? (
            <EmptyState title="신청 내역이 없습니다" description="수강 신청 페이지에서 신청해보세요" />
          ) : (
            data.applications.map((app) => (
              <Card key={app.id} className="bg-gray-900/80 border-gray-800">
                <div className="card-pad flex justify-between gap-4">
                  <div>
                    <p className="font-medium">{app.teacher.name} 선생님</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(app.createdAt)}</p>
                  </div>
                  <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}>
                    {STATUS_LABELS[app.status]}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="heading-section text-gray-200">졸업면담 내역</h2>
          {!data?.interviews?.length ? (
            <EmptyState title="제출한 졸업면담이 없습니다" />
          ) : (
            data.interviews.map((iv) => (
              <Card key={iv.id} className="bg-gray-900/80 border-gray-800">
                <div className="card-pad flex justify-between">
                  <span className="text-gray-300">제출 완료</span>
                  <span className="text-sm text-gray-500">{formatDate(iv.createdAt)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
