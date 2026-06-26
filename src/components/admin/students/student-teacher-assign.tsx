'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { toast } from 'sonner';

export type TeacherOption = {
  id: string;
  name: string;
  class: { name: string };
  isActive: boolean;
  currentStudents: number;
  maxStudents: number;
};

type Props = {
  studentId: string;
  currentTeacherId: string | null;
  teachers: TeacherOption[];
  onChanged: () => void;
};

export function StudentTeacherAssign({ studentId, currentTeacherId, teachers, onChanged }: Props) {
  const [teacherId, setTeacherId] = useState(currentTeacherId ?? '');
  const [saving, setSaving] = useState(false);

  const dirty = (teacherId || null) !== (currentTeacherId || null);

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacherId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '변경 실패');
      toast.success('담당 선생님이 변경되었습니다');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '변경 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-nowrap items-center gap-2">
      <Select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="w-[17rem] shrink-0 text-xs h-8"
      >
        <option value="">미배정</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.class.name})
            {!t.isActive ? ' · 휴식' : ''} · {t.currentStudents}/{t.maxStudents}
          </option>
        ))}
      </Select>
      <Button size="sm" variant="outline" className="shrink-0" disabled={!dirty || saving} onClick={() => void save()}>
        {saving ? '변경 중...' : '변경'}
      </Button>
    </div>
  );
}
