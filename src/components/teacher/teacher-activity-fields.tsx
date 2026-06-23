'use client';

import { ACTIVITY_DAYS } from '@/lib/form-options';
import { Label, Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  activityDays: string[];
  activityTimeSlot: string;
  onChange: (next: { activityDays: string[]; activityTimeSlot: string }) => void;
  className?: string;
};

export function TeacherActivityFields({ activityDays, activityTimeSlot, onChange, className }: Props) {
  const toggleDay = (day: string) => {
    const next = activityDays.includes(day)
      ? activityDays.filter((d) => d !== day)
      : [...activityDays, day];
    onChange({ activityDays: next, activityTimeSlot });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label>활동 요일</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {ACTIVITY_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                activityDays.includes(day)
                  ? 'border-purple-500/50 bg-purple-600/20 text-purple-200'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600',
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="activity-time">활동 시간</Label>
        <Input
          id="activity-time"
          value={activityTimeSlot}
          onChange={(e) => onChange({ activityDays, activityTimeSlot: e.target.value })}
          placeholder="예: 20:00 ~ 23:00, 주말 오후"
          className="mt-2"
          maxLength={64}
        />
        <p className="text-xs text-gray-500 mt-1">자유 입력 (최대 64자)</p>
      </div>
    </div>
  );
}
