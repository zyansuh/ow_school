'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminClassFilterBar } from '@/components/admin/admin-class-filter-bar';
import { AdminClassSections } from '@/components/admin/admin-class-sections';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GraduateStudentDialog } from '@/components/admin/graduate-student-dialog';
import { WithdrawStudentDialog } from '@/components/admin/withdraw-student-dialog';
import {
  StudentTeacherAssign,
  type TeacherOption,
} from '@/components/admin/students/student-teacher-assign';
import { StudentDisplayNickEdit } from '@/components/admin/students/student-display-nick-edit';
import { useAdminClassFilter, useAdminQueryParam } from '@/hooks/admin/use-admin-class-filter';
import { ADMIN_CLASS_ALL, matchesClassFilter } from '@/lib/admin/class-filter';

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

function studentMatchesQuery(u: Student, q: string) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    u.nickname.toLowerCase().includes(s) ||
    u.guildNickname.toLowerCase().includes(s) ||
    u.discordId.includes(q) ||
    (u.displayNickname?.toLowerCase().includes(s) ?? false)
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<StudentsSkeleton />}>
      <AdminStudentsInner />
    </Suspense>
  );
}

function StudentsSkeleton() {
  return (
    <div>
      <AdminPageHeader title="학생 관리" description="불러오는 중…" />
      <SkeletonTable rows={8} />
    </div>
  );
}

function AdminStudentsInner() {
  const { classFilter } = useAdminClassFilter();
  const { query } = useAdminQueryParam();
  const [users, setUsers] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
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

  const filtered = useMemo(
    () =>
      users.filter(
        (u) => matchesClassFilter(u.className, classFilter) && studentMatchesQuery(u, query.trim()),
      ),
    [users, classFilter, query],
  );

  const columns: DataTableColumn<Student>[] = [
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
      key: 'date',
      header: '가입일',
      width: '8.5rem',
      cellClassName: 'whitespace-nowrap',
      cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>,
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
      key: 'status',
      header: '상태',
      width: '5rem',
      cellClassName: 'whitespace-nowrap',
      cell: (u) => <Badge variant="outline">{STATUS_LABELS[u.status] || u.status}</Badge>,
    },
  ];

  const renderList = (rows: Student[]) => (
    <DataTable
      layout="wide"
      scrollHint
      data={rows}
      keyExtractor={(u) => u.id}
      emptyTitle="학생이 없습니다"
      columns={columns}
    />
  );

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
      <AdminClassFilterBar className="mb-4" />
      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length}명
        {query.trim() || classFilter !== ADMIN_CLASS_ALL
          ? ` (전체 ${users.length}명 중)`
          : ''}
      </p>
      {loading ? (
        <SkeletonTable rows={8} />
      ) : (
        <AdminClassSections
          items={filtered}
          getClassName={(u) => u.className}
          flat={classFilter !== ADMIN_CLASS_ALL}
          emptyFallback={renderList([])}
          renderList={renderList}
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
