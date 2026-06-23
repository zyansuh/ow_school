'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { adminStyles } from '@/styles/admin';
import {
  StudentTeacherAssign,
  type TeacherOption,
} from '@/components/admin/students/student-teacher-assign';

const FILTERS = ['전체', '수달반', '사자반', '여우반'];

type Student = {
  id: string;
  nickname: string;
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

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">학생 관리</h1>
        <Link href="/admin/graduated" className="text-sm text-purple-400 hover:text-purple-300">
          졸업생 목록 →
        </Link>
      </div>
      <p className={adminStyles.muted}>
        담당 선생님 변경은 선생님 휴식·개인사정 시 다른 선생님으로 옮길 때 사용하세요. 선생님 휴식은
        {' '}
        <Link href="/admin/teachers" className="text-purple-400 hover:text-purple-300">선생님 관리</Link>
        에서 비활성 처리할 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm',
              filter === f ? 'bg-purple-600/30 text-purple-300' : 'bg-gray-800 text-gray-400',
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <Card className={`${adminStyles.card} overflow-x-auto`}>
        {filtered.length === 0 ? (
          <EmptyState title="학생이 없습니다" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={adminStyles.tableHead}>
                <th className="p-4">서버 닉네임</th>
                <th className="p-4">디스코드</th>
                <th className="p-4">반</th>
                <th className="p-4">담당 선생님</th>
                <th className="p-4">상태</th>
                <th className="p-4">가입일</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={`${adminStyles.tableRow} hover:bg-gray-800/30`}>
                  <td className="p-4 font-medium">{u.nickname}</td>
                  <td className="p-4 text-gray-400">@{u.discord}</td>
                  <td className="p-4">{u.className}</td>
                  <td className="p-4">
                    <StudentTeacherAssign
                      key={`${u.id}-${u.teacherId ?? 'none'}`}
                      studentId={u.id}
                      currentTeacherId={u.teacherId}
                      teachers={teachers}
                      onChanged={load}
                    />
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{STATUS_LABELS[u.status] || u.status}</Badge>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => void graduate(u.id)}>
                      졸업
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
