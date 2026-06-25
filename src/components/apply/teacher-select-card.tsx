'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatMainActivityTime, teacherRoleLabel } from '@/lib/teacher/display';
import { getRecruitmentStatus, recruitmentStatusLabel } from '@/lib/teacher/recruiting';

export type TeacherSelectItem = {
  id: string;
  name: string;
  mbti?: string | null;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  activityTimeSlot?: string | null;
  class: { name: string; gameKr: string };
  teacherClasses?: Array<{ class: { name: string; gameKr: string } }>;
};

type Props = {
  teacher: TeacherSelectItem;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function TeacherSelectCard({ teacher, selected, onSelect }: Props) {
  const status = getRecruitmentStatus(
    teacher.maxStudents,
    teacher.currentStudents,
    teacher.isActive,
  );
  const closed = status !== 'open';

  return (
    <button
      type="button"
      disabled={closed}
      onClick={() => onSelect(teacher.id)}
      className={cn(
        'w-full text-left rounded-xl border p-4 transition-all',
        closed && 'opacity-50 cursor-not-allowed',
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
          : 'border-border bg-card hover:border-primary/40 hover:bg-card-hover',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{teacher.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{teacherRoleLabel(teacher)}</p>
        </div>
        <Badge variant={closed ? 'danger' : 'success'} className="shrink-0">
          {recruitmentStatusLabel(status)}
        </Badge>
      </div>
      <div className="rounded-lg bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground mb-0.5">주 활동시간</p>
        <p className="text-sm text-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          {formatMainActivityTime(teacher.activityTimeSlot)}
        </p>
      </div>
    </button>
  );
}
