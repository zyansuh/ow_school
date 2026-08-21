'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { toast } from 'sonner';
import type { TeacherFilterOption } from '@/components/admin/admin-ops-filter-bar';

type Props = {
  selectedIds: string[];
  teachers: TeacherFilterOption[];
  onCleared: () => void;
  onDone: () => void;
  exportRows: () => void;
};

export function AdminStudentBulkBar({
  selectedIds,
  teachers,
  onCleared,
  onDone,
  exportRows,
}: Props) {
  const [teacherId, setTeacherId] = useState('');
  const [busy, setBusy] = useState(false);
  const n = selectedIds.length;

  if (n === 0) return null;

  const run = async (action: 'assignTeacher' | 'graduate' | 'withdraw') => {
    if (action === 'assignTeacher' && !teacherId) {
      toast.error('담당 선생님을 선택하세요');
      return;
    }
    if (action === 'graduate' && !confirm(`선택한 ${n}명을 졸업 처리할까요?`)) return;
    if (action === 'withdraw' && !confirm(`선택한 ${n}명을 퇴교 처리할까요? 신중히 진행하세요.`))
      return;
    if (
      action === 'assignTeacher' &&
      !confirm(`선택한 ${n}명의 담당 선생님을 변경할까요?`)
    ) {
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedIds,
          action,
          teacherId: action === 'assignTeacher' ? teacherId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '일괄 처리 실패');
      toast.success(`완료 ${data.okCount}명` + (data.failCount ? ` · 실패 ${data.failCount}명` : ''));
      onCleared();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '일괄 처리 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky bottom-4 z-20 mx-1 sm:mx-2 rounded-xl border border-primary/30 bg-card/95 backdrop-blur shadow-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm font-medium text-foreground shrink-0">{n}명 선택</p>
      <Select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="sm:w-48"
        disabled={busy}
      >
        <option value="">담당 변경 대상…</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {!t.isActive ? ' (비활성)' : ''}
          </option>
        ))}
      </Select>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy || !teacherId} onClick={() => void run('assignTeacher')}>
          담당 변경
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={exportRows}>
          선택 엑셀
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run('graduate')}
        >
          일괄 졸업
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-danger border-danger/40"
          disabled={busy}
          onClick={() => void run('withdraw')}
        >
          일괄 퇴교
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCleared}>
          선택 해제
        </Button>
      </div>
    </div>
  );
}
