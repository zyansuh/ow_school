'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate, formatDateTime, STATUS_LABELS } from '@/lib/utils';
import { formatPoint, POINT_TYPE_LABELS } from '@/lib/points';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TeacherStudentDetail, TeacherStudentRow, TeacherStudentStats } from '@/lib/teacher-students';

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
      <div className="page-container py-8 sm:py-12 section-gap max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">학생 관리</h1>
            <p className="text-gray-400 text-sm mt-1">담당 학생 현황을 확인하세요</p>
          </div>
          <Link href="/teacher" className="text-sm text-purple-400 hover:text-purple-300">
            선생님 마이페이지
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: '총 담당 학생', value: `${stats.totalStudents}명` },
              { label: '졸업 학생', value: `${stats.graduatedCount}명` },
              { label: '졸업 대기', value: `${stats.pendingGraduationCount}명` },
              { label: '면담 완료', value: `${stats.interviewCompletedCount}명` },
              { label: '면담 미작성', value: `${stats.interviewPendingCount}명` },
            ].map((item) => (
              <Card key={item.label} className="bg-gray-900/80 border-gray-800">
                <div className="card-pad py-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-purple-300 mt-1">{item.value}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
          {students.length === 0 ? (
            <EmptyState title="담당 학생이 없습니다" />
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="border-b border-gray-800 text-gray-400 text-left">
                    <th className="px-3 py-2">서버 닉네임</th>
                    <th className="px-3 py-2">담당 반</th>
                    <th className="px-3 py-2">수강 신청일</th>
                    <th className="px-3 py-2">현재 상태</th>
                    <th className="px-3 py-2">졸업 여부</th>
                    <th className="px-3 py-2">졸업면담</th>
                    <th className="px-3 py-2">최근 수정일</th>
                    <th className="px-3 py-2">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                      <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{s.serverNickname}</td>
                      <td className="px-3 py-2 text-gray-400">{s.className}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {s.applicationDate ? formatDateTime(s.applicationDate) : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{STATUS_LABELS[s.status] ?? s.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{s.isGraduated ? '졸업' : '재원'}</td>
                      <td className="px-3 py-2">
                        <Badge variant={s.hasInterview ? 'success' : 'warning'}>
                          {s.hasInterview ? '작성' : '미작성'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(s.lastUpdatedAt)}</td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="ghost" className="text-purple-400" onClick={() => setSelectedId(s.id)}>
                          보기
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>학생 상세 정보</DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <p className="text-sm text-gray-500 py-8 text-center">불러오는 중...</p>
            ) : !detail ? (
              <p className="text-sm text-gray-500 py-8 text-center">정보를 불러올 수 없습니다</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-gray-500 text-xs">서버 닉네임</p><p className="text-gray-200">{detail.serverNickname}</p></div>
                  <div><p className="text-gray-500 text-xs">담당 선생님</p><p className="text-gray-200">{detail.teacherName}</p></div>
                  <div><p className="text-gray-500 text-xs">반</p><p className="text-gray-200">{detail.className}</p></div>
                  <div><p className="text-gray-500 text-xs">상태</p><p className="text-gray-200">{STATUS_LABELS[detail.status] ?? detail.status}</p></div>
                </div>

                <div className="border-t border-gray-800 pt-3">
                  <h3 className="font-medium text-gray-300 mb-2">수강 신청</h3>
                  {detail.application ? (
                    <div className="space-y-1 text-gray-400">
                      <p>신청일: {formatDateTime(detail.application.createdAt)}</p>
                      <p>상태: {STATUS_LABELS[detail.application.status]}</p>
                      <p>활동 시간대: {detail.application.playTimeSlot ?? '-'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">신청 내역 없음</p>
                  )}
                </div>

                <div className="border-t border-gray-800 pt-3">
                  <h3 className="font-medium text-gray-300 mb-2">졸업면담</h3>
                  {detail.interview ? (
                    <div className="space-y-2 text-gray-400">
                      <p>제출일: {formatDate(detail.interview.createdAt)}</p>
                      <p className="whitespace-pre-wrap"><span className="text-gray-500">Q1 </span>{detail.interview.contentExperience}</p>
                      <p className="whitespace-pre-wrap"><span className="text-gray-500">Q2 </span>{detail.interview.memorablePerson}</p>
                      <p>동호회 가입: {detail.interview.joinedClub ? '예' : '아니오'}</p>
                      {detail.interview.joinedClub && detail.interview.clubNames.length > 0 && (
                        <ul className="list-disc list-inside">
                          {detail.interview.clubNames.map((n) => <li key={n}>{n}</li>)}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">미작성</p>
                  )}
                </div>

                <div className="border-t border-gray-800 pt-3">
                  <h3 className="font-medium text-gray-300 mb-2">포인트 내역</h3>
                  {detail.points.length === 0 ? (
                    <p className="text-gray-500">지급 내역 없음</p>
                  ) : (
                    <ul className="space-y-1 text-gray-400">
                      {detail.points.map((p) => (
                        <li key={p.id}>
                          {POINT_TYPE_LABELS[p.pointType] ?? p.pointType} {formatPoint(p.pointAmount)}
                          <span className="text-gray-600 ml-2">{formatDate(p.createdAt)}</span>
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
