'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ds } from '@/styles/design-system';
import type { AdminTeacher } from '@/hooks/admin/use-admin-teachers';
import { getRecruitmentStatus, recruitmentStatusLabel } from '@/lib/teacher-recruiting';

type Props = {
  teachers: AdminTeacher[];
  deletingId: string | null;
  onEdit: (teacher: AdminTeacher) => void;
  onToggleActive: (teacher: AdminTeacher) => void;
  onRemove: (id: string) => void;
};

export function TeacherTable({ teachers, deletingId, onEdit, onToggleActive, onRemove }: Props) {
  const busy = deletingId !== null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={ds.tableHead}>
          <th className="p-4">이름</th>
          <th className="p-4">반</th>
          <th className="p-4">인원</th>
          <th className="p-4">Discord ID</th>
          <th className="p-4">상태</th>
          <th className="p-4">관리</th>
        </tr>
      </thead>
      <tbody>
        {teachers.map((t) => {
          const isDeleting = deletingId === t.id;
          return (
            <tr
              key={t.id}
              className={cn(
                ds.tableRow,
                'transition-opacity duration-200',
                isDeleting && 'opacity-40',
                busy && !isDeleting && 'opacity-60',
              )}
            >
              <td className="p-4 font-medium">{t.name}</td>
              <td className="p-4">{t.class.name}</td>
              <td className="p-4">{t.currentStudents}/{t.maxStudents}</td>
              <td className="p-4">
                {t.discordUserId ? (
                  <Badge variant="success" className="font-mono text-[10px]">{t.discordUserId.slice(0, 8)}…</Badge>
                ) : (
                  <Badge variant="warning">미연결</Badge>
                )}
              </td>
              <td className="p-4">
                {(() => {
                  const status = getRecruitmentStatus(t.maxStudents, t.currentStudents, t.isActive);
                  return (
                    <Badge variant={status === 'open' ? 'success' : 'danger'}>
                      {recruitmentStatusLabel(status)}
                    </Badge>
                  );
                })()}
              </td>
              <td className="p-4 flex gap-1 items-center">
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onToggleActive(t)}>
                  {t.isActive ? '비활성' : '활성'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => onRemove(t.id)}
                  className="min-w-[2rem]"
                >
                  {isDeleting ? (
                    <LoadingSpinner className="h-4 w-4 text-red-400" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-400" />
                  )}
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
