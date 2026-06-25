'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDate, STATUS_LABELS, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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

  const load = () =>
    Promise.all([
      fetch('/api/admin/students').then((r) => r.json()),
      fetch('/api/admin/teachers').then((r) => r.json()),
    ]).then(([students, teacherList]) => {
      setUsers(Array.isArray(students) ? students : []);
      setTeachers(Array.isArray(teacherList) ? teacherList : []);
      setLoading(false);
    });

  useEffect(() => {
    void load();
  }, []);

  const filtered = filter === '전체' ? users : users.filter((u) => u.className === filter);

  const graduate = async (id: string) => {
    if (!confirm('이 학생을 졸업 처리하시겠습니까?')) return;
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'graduate' }),
    });
    if (!res.ok) {
      toast.error('졸업 처리 실패');
      return;
    }
    toast.success('졸업 처리되었습니다');
    void load();
  };

  return (
    <div>
      <AdminPageHeader
        title="학생 관리"
        description="담당 반장 변경은 반장 휴식·개인사정 시 다른 반장으로 옮길 때 사용하세요."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/graduated">졸업생 목록</Link>
          </Button>
        }
      />
      <p className="text-sm text-muted-foreground mb-4">
        반장 휴식은{' '}
        <Link href="/admin/teachers" className="text-primary hover:underline">
          반장 관리
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
          data={filtered}
          keyExtractor={(u) => u.id}
          emptyTitle="학생이 없습니다"
          columns={[
            {
              key: 'nick',
              header: '표시 이름',
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
            { key: 'guild', header: '길드 닉', cell: (u) => u.guildNickname },
            {
              key: 'discord',
              header: 'Discord ID',
              cell: (u) => <span className="font-mono text-xs text-muted-foreground">{u.discordId}</span>,
              hideOnMobile: true,
            },
            { key: 'class', header: '반', cell: (u) => u.className },
            {
              key: 'teacher',
              header: '담당 반장',
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
              cell: (u) => <Badge variant="outline">{STATUS_LABELS[u.status] || u.status}</Badge>,
            },
            {
              key: 'date',
              header: '가입일',
              cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>,
              hideOnMobile: true,
            },
            {
              key: 'action',
              header: '관리',
              mobileFooter: true,
              cell: (u) => (
                <Button size="sm" variant="outline" onClick={() => void graduate(u.id)}>
                  졸업
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
