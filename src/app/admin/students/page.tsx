'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDate, STATUS_LABELS, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GraduateStudentDialog } from '@/components/admin/graduate-student-dialog';
import { WithdrawStudentDialog } from '@/components/admin/withdraw-student-dialog';
import {
  StudentTeacherAssign,
  type TeacherOption,
} from '@/components/admin/students/student-teacher-assign';
import { StudentDisplayNickEdit } from '@/components/admin/students/student-display-nick-edit';

const FILTERS = ['전체', '수달반', '사자반', '여우반'];

type Student = {
  id: string;
  discordId: string;
  nickname: string;
  guildNickname: string;
  displayNickname: string | null;
  discord: string;
  className: string;
  teacherId: string | null;
  teacherName: string;
  status: string;
  createdAt: string;
};

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [graduateTarget, setGraduateTarget] = useState<Student | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Student | null>(null);

  const load = () =>
    Promise.all([
      fetch('/api/admin/students').then((r) => r.json()),
      fetch('/api/admin/teachers?for=student-assign').then((r) => r.json()),
    ]).then(([students, teacherList]) => {
      setUsers(Array.isArray(students) ? students : []);
      setTeachers(Array.isArray(teacherList) ? teacherList : []);
      setLoading(false);
    });

  useEffect(() => {
    void load();
  }, []);

  const filtered = filter === '전체' ? users : users.filter((u) => u.className === filter);

  return (
    <div>
      <AdminPageHeader
        title="학생 관리"
        description="담당 선생님 변경은 선생님 휴식·개인사정 시 다른 선생님으로 옮길 때 사용하세요."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/withdrawn">퇴교생 목록</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/graduated">졸업생 목록</Link>
            </Button>
          </div>
        }
      />
      <p className="text-sm text-muted-foreground mb-4">
        선생님 휴식은{' '}
        <Link href="/admin/teachers" className="text-primary hover:underline">
          선생님 관리
        </Link>
        에서 비활성 처리할 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm transition-colors',
              filter === f
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {loading ? (
        <SkeletonTable rows={8} />
      ) : (
        <DataTable
          layout="wide"
          scrollHint
          data={filtered}
          keyExtractor={(u) => u.id}
          emptyTitle="학생이 없습니다"
          columns={[
            {
              key: 'nick',
              header: '표시 이름',
              width: '12rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => (
                <StudentDisplayNickEdit
                  studentId={u.id}
                  currentDisplay={u.nickname}
                  displayNickname={u.displayNickname}
                  guildNickname={u.guildNickname}
                  onSaved={load}
                />
              ),
            },
            {
              key: 'guild',
              header: '길드 닉',
              width: '9rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => u.guildNickname,
            },
            {
              key: 'discord',
              header: 'Discord ID',
              width: '11rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => <span className="font-mono text-xs text-muted-foreground">{u.discordId}</span>,
              hideOnMobile: true,
            },
            {
              key: 'class',
              header: '반',
              width: '6rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => u.className,
            },
            {
              key: 'teacher',
              header: '담당 선생님',
              width: '26rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => (
                <StudentTeacherAssign
                  key={`${u.id}-${u.teacherId ?? 'none'}`}
                  studentId={u.id}
                  currentTeacherId={u.teacherId}
                  teachers={teachers}
                  onChanged={load}
                />
              ),
            },
            {
              key: 'status',
              header: '상태',
              width: '5rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => <Badge variant="outline">{STATUS_LABELS[u.status] || u.status}</Badge>,
            },
            {
              key: 'date',
              header: '가입일',
              width: '8.5rem',
              cellClassName: 'whitespace-nowrap',
              cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>,
              hideOnMobile: true,
            },
            {
              key: 'action',
              header: '관리',
              width: '11.5rem',
              cellClassName: 'whitespace-nowrap',
              mobileFooter: true,
              cell: (u) => (
                <div className="flex flex-nowrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setGraduateTarget(u)}>
                    졸업
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger border-danger/40 hover:bg-danger/10"
                    onClick={() => setWithdrawTarget(u)}
                  >
                    퇴교
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {graduateTarget && (
        <GraduateStudentDialog
          open={!!graduateTarget}
          onOpenChange={(open) => !open && setGraduateTarget(null)}
          studentId={graduateTarget.id}
          studentName={graduateTarget.nickname}
          assignedTeacherId={graduateTarget.teacherId}
          assignedTeacherName={graduateTarget.teacherName}
          saveUrl={`/api/admin/students/${graduateTarget.id}`}
          apiMode="students"
          onGraduated={() => {
            setGraduateTarget(null);
            void load();
          }}
        />
      )}

      {withdrawTarget && (
        <WithdrawStudentDialog
          open={!!withdrawTarget}
          onOpenChange={(open) => !open && setWithdrawTarget(null)}
          studentId={withdrawTarget.id}
          studentName={withdrawTarget.nickname}
          onWithdrawn={() => {
            setWithdrawTarget(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
