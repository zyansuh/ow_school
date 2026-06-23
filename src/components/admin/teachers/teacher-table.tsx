'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { adminStyles } from '@/styles/admin';
import type { AdminTeacher } from '@/hooks/admin/use-admin-teachers';

type Props = {
  teachers: AdminTeacher[];
  onEdit: (teacher: AdminTeacher) => void;
  onToggleActive: (teacher: AdminTeacher) => void;
  onRemove: (id: string) => void;
};

export function TeacherTable({ teachers, onEdit, onToggleActive, onRemove }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={adminStyles.tableHead}>
          <th className="p-4">이름</th>
          <th className="p-4">반</th>
          <th className="p-4">인원</th>
          <th className="p-4">Discord ID</th>
          <th className="p-4">상태</th>
          <th className="p-4">관리</th>
        </tr>
      </thead>
      <tbody>
        {teachers.map((t) => (
          <tr key={t.id} className={adminStyles.tableRow}>
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
              <Badge variant={t.isActive ? 'success' : 'danger'}>{t.isActive ? '활동' : '비활성'}</Badge>
            </td>
            <td className="p-4 flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => onToggleActive(t)}>{t.isActive ? '비활성' : '활성'}</Button>
              <Button size="sm" variant="ghost" onClick={() => onRemove(t.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
