'use client';

import { Select } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { OpsQuickFilter } from '@/hooks/admin/use-admin-ops-filters';

export type TeacherFilterOption = {
  id: string;
  name: string;
  isActive?: boolean;
  className?: string;
};

const QUICK_OPTIONS: { value: OpsQuickFilter; label: string }[] = [
  { value: 'all', label: '전체 기간·면담' },
  { value: 'joinedThisMonth', label: '이번 달 가입' },
  { value: 'noInterview', label: '면담 미제출' },
];

type Props = {
  teachers: TeacherFilterOption[];
  teacherId: string;
  onTeacherChange: (id: string) => void;
  quick: OpsQuickFilter;
  onQuickChange: (v: OpsQuickFilter) => void;
  className?: string;
  /** 선생님 목록을 반 필터에 맞게 좁힐 때 */
  classFilterName?: string;
};

export function AdminOpsFilterBar({
  teachers,
  teacherId,
  onTeacherChange,
  quick,
  onQuickChange,
  className,
  classFilterName,
}: Props) {
  const teacherOptions =
    classFilterName && classFilterName !== '전체'
      ? teachers.filter(
          (t) => !t.className || t.className === classFilterName || t.className.includes(classFilterName),
        )
      : teachers;

  return (
    <div className={cn('flex flex-col sm:flex-row flex-wrap gap-3', className)}>
      <Select
        value={teacherId}
        onChange={(e) => onTeacherChange(e.target.value)}
        className="sm:w-56"
        aria-label="담당 선생님 필터"
      >
        <option value="">담당 선생님 · 전체</option>
        {teacherOptions.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {!t.isActive ? ' (비활성)' : ''}
            {t.className ? ` · ${t.className}` : ''}
          </option>
        ))}
      </Select>
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onQuickChange(o.value)}
            className={cn(
              'px-3 py-2 rounded-xl text-sm transition-colors min-h-10',
              quick === o.value
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
