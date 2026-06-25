'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { LoadingPage } from '@/components/ui/loading';
import { formatDate, formatDateTime, STATUS_LABELS } from '@/lib/utils';
import { formatPoint, POINT_TYPE_LABELS } from '@/lib/points';
import { ds } from '@/styles/design-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, GraduationCap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { TeacherStudentDetail, TeacherStudentRow, TeacherStudentStats } from '@/lib/teacher/students';

export default function TeacherStudentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<TeacherStudentStats | null>(null);
  const [students, setStudents] = useState<TeacherStudentRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeacherStudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch('/api/teacher/students')
      .then((r) => {
        if (r.status === 403) throw new Error('forbidden');
        return r.json();
      })
      .then((d) => {
        setStats(d.stats);
        setStudents(d.students ?? []);
      });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      load()
        .catch(() => router.push('/mypage'))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/teacher/students/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setDetail(d);
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  if (status === 'loading' || loading) return <LoadingPage />;

  return (
    <MainLayout>
      <div className={`page-container py-8 sm:py-12 max-w-6xl mx-auto ${ds.pageGap}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={ds.title}>학생 관리</h1>
            <p className={ds.subtitle}>담당 학생 현황을 확인하세요</p>
          </div>
          <Link href="/teacher" className="text-sm text-primary hover:underline">
            선생님 마이페이지
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="총 담당 학생" value={stats.totalStudents} suffix="명" icon={Users} />
            <StatCard label="졸업 학생" value={stats.graduatedCount} suffix="명" icon={GraduationCap} />
            <StatCard label="졸업 대기" value={stats.pendingGraduationCount} suffix="명" icon={Clock} />
            <StatCard label="면담 완료" value={stats.interviewCompletedCount} suffix="명" icon={CheckCircle} />
            <StatCard label="면담 미작성" value={stats.interviewPendingCount} suffix="명" icon={AlertCircle} />
          </div>
        )}

        <DataTable
          data={students}
          keyExtractor={(s) => s.id}
          emptyTitle="아직 담당 학생이 없습니다"
          columns={[
            { key: 'nick', header: '서버 닉네임', cell: (s) => s.serverNickname },
            { key: 'class', header: '담당 반', cell: (s) => s.className },
            {
              key: 'date',
              header: '수강 신청일',
              cell: (s) => (s.applicationDate ? formatDateTime(s.applicationDate) : '-'),
            },
            {
              key: 'status',
              header: '현재 상태',
              cell: (s) => <Badge variant="outline">{STATUS_LABELS[s.status] ?? s.status}</Badge>,
            },
            { key: 'grad', header: '졸업 여부', cell: (s) => (s.isGraduated ? '졸업' : '재원') },
            {
              key: 'interview',
              header: '졸업면담',
              cell: (s) => (
                <Badge variant={s.hasInterview ? 'success' : 'warning'}>
                  {s.hasInterview ? '작성' : '미작성'}
                </Badge>
              ),
            },
            {
              key: 'updated',
              header: '최근 수정일',
              cell: (s) => <span className="text-muted-foreground">{formatDate(s.lastUpdatedAt)}</span>,
              hideOnMobile: true,
            },
            {
              key: 'action',
              header: '상세',
              cell: (s) => (
                <Button size="sm" variant="ghost" className="text-primary" onClick={() => setSelectedId(s.id)}>
                  보기
                </Button>
              ),
            },
          ]}
        />

        <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>학생 상세 정보</DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">불러오는 중...</p>
            ) : !detail ? (
              <p className="text-sm text-muted-foreground py-8 text-center">정보를 불러올 수 없습니다</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className={ds.caption}>서버 닉네임</p><p className="text-foreground">{detail.serverNickname}</p></div>
                  <div><p className={ds.caption}>담당 선생님</p><p className="text-foreground">{detail.teacherName}</p></div>
                  <div><p className={ds.caption}>반</p><p className="text-foreground">{detail.className}</p></div>
                  <div><p className={ds.caption}>상태</p><p className="text-foreground">{STATUS_LABELS[detail.status] ?? detail.status}</p></div>
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="font-medium text-foreground mb-2">수강 신청</h3>
                  {detail.application ? (
                    <div className="space-y-1 text-muted-foreground">
                      <p>신청일: {formatDateTime(detail.application.createdAt)}</p>
                      <p>상태: {STATUS_LABELS[detail.application.status]}</p>
                      <p>활동 시간대: {detail.application.playTimeSlot ?? '-'}</p>
                    </div>
                  ) : (
                    <p className="text-subtle">신청 내역 없음</p>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="font-medium text-foreground mb-2">졸업면담</h3>
                  {detail.interview ? (
                    <div className="space-y-2 text-muted-foreground">
                      <p>제출일: {formatDate(detail.interview.createdAt)}</p>
                      <p className="whitespace-pre-wrap"><span className="text-subtle">Q1 </span>{detail.interview.contentExperience}</p>
                      <p className="whitespace-pre-wrap"><span className="text-subtle">Q2 </span>{detail.interview.memorablePerson}</p>
                      <p>동호회 가입: {detail.interview.joinedClub ? '예' : '아니오'}</p>
                      {detail.interview.joinedClub && detail.interview.clubNames.length > 0 && (
                        <ul className="list-disc list-inside">
                          {detail.interview.clubNames.map((n) => <li key={n}>{n}</li>)}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-subtle">미작성</p>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="font-medium text-foreground mb-2">포인트 내역</h3>
                  {detail.points.length === 0 ? (
                    <p className="text-subtle">지급 내역 없음</p>
                  ) : (
                    <ul className="space-y-1 text-muted-foreground">
                      {detail.points.map((p) => (
                        <li key={p.id}>
                          {POINT_TYPE_LABELS[p.pointType] ?? p.pointType} {formatPoint(p.pointAmount)}
                          <span className="text-subtle ml-2">{formatDate(p.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
