'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { STATUS_LABELS, formatDate } from '@/lib/utils';
import { userDisplayName } from '@/lib/user-display';
import { ds } from '@/styles/design-system';
import { useMyPageData } from '@/hooks/mypage/use-mypage';

export default function MyPage() {
  const {
    session,
    data,
    loading,
    nickInput,
    setNickInput,
    savingNick,
    saveNick,
    requestingAdmin,
    requestAdminRole,
    refreshingDiscord,
    refreshDiscord,
  } = useMyPageData();

  if (loading) return <MainLayout><LoadingPage /></MainLayout>;

  if (!session) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center space-y-4">
          <p className={ds.textMuted}>마이페이지는 로그인 후 이용 가능합니다</p>
          <Button onClick={() => signIn('discord')}>Discord 로그인</Button>
        </div>
      </MainLayout>
    );
  }

  const displayNick = data ? userDisplayName(data) : '';
  const isTeacherOnly = session.user.isTeacher && !session.user.isAdmin;

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className={ds.title}>마이페이지</h1>
          <div className="flex flex-wrap gap-2">
            {isTeacherOnly && (
              <Button asChild variant="outline" size="sm">
                <Link href="/teacher/students">학생 관리</Link>
              </Button>
            )}
            {!session.user.isAdmin && (
              <Button variant="outline" size="sm" disabled={requestingAdmin} onClick={() => void requestAdminRole()}>
                {requestingAdmin ? '요청 중...' : '관리자 권한 요청'}
              </Button>
            )}
          </div>
        </div>

        <Card className={ds.card}>
          <div className={`${ds.cardPad} space-y-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={ds.sectionTitle}>디스코드 서버 정보</h2>
              <Badge variant="success">서버 가입</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={refreshingDiscord}
                onClick={() => void refreshDiscord()}
              >
                {refreshingDiscord ? '동기화 중...' : 'Discord 새로고침'}
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">표시 닉네임</span>
                <p className="text-gray-200 mt-1">{displayNick}</p>
              </div>
              <div>
                <span className="text-gray-500">서버 닉네임 (Guild)</span>
                <p className="text-gray-200 mt-1">{data?.serverNickname ?? data?.discordServerNick ?? '(미설정)'}</p>
              </div>
              <div>
                <span className="text-gray-500">글로벌 표시 이름</span>
                <p className="text-gray-200 mt-1">{data?.globalDisplayName ?? data?.discordNickname ?? '(미설정)'}</p>
              </div>
              <div>
                <span className="text-gray-500">디스코드 유저명</span>
                <p className="text-gray-200 mt-1">@{data?.discordUsername}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500">서버 역할</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data?.discordRoleNames?.length ? (
                    data.discordRoleNames.map((role) => (
                      <Badge key={role} variant="outline">{role}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">역할 없음</span>
                  )}
                </div>
              </div>
            </div>

            {(data?.isInGuild ?? true) && (
              <form onSubmit={saveNick} className="pt-2 border-t border-gray-800 space-y-3">
                <div>
                  <Label htmlFor="server-nick">서버 닉네임 변경</Label>
                  <Input
                    id="server-nick"
                    value={nickInput}
                    onChange={(e) => setNickInput(e.target.value)}
                    maxLength={32}
                    placeholder="디스코드 서버에 표시될 닉네임"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">최대 32자 · 비우면 글로벌 닉네임으로 초기화</p>
                </div>
                <Button type="submit" size="sm" disabled={savingNick}>
                  {savingNick ? '변경 중...' : '닉네임 저장'}
                </Button>
              </form>
            )}
          </div>
        </Card>

        <Card className={ds.card}>
          <div className="card-pad space-y-3">
            <h2 className="heading-section text-gray-200">수강 정보</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
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
              <Card key={app.id} className={ds.card}>
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
              <Card key={iv.id} className={ds.card}>
                <div className="card-pad flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="text-gray-300">제출 완료</span>
                    <span className="text-sm text-gray-500 ml-2">{formatDate(iv.createdAt)}</span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/interview">내용 보기 · 수정</Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
