"use client";

import { ACTIVITY_DAYS } from "@/lib/utils/form-options";
import { Label, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  activityDays: string[];
  activityTimeSlot: string;
  onChange: (next: {
    activityDays: string[];
    activityTimeSlot: string;
  }) => void;
  className?: string;
};

export function TeacherActivityFields({
  activityDays,
  activityTimeSlot,
  onChange,
  className,
}: Props) {
  const toggleDay = (day: string) => {
    const next = activityDays.includes(day)
      ? activityDays.filter((d) => d !== day)
      : [...activityDays, day];
    onChange({ activityDays: next, activityTimeSlot });
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <Label>활동 요일</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ACTIVITY_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                activityDays.includes(day)
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent",
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="activity-time">주 활동시간</Label>
        <Input
          id="activity-time"
          value={activityTimeSlot}
          onChange={(e) =>
            onChange({ activityDays, activityTimeSlot: e.target.value })
          }
          placeholder="예: 평일 19:00 ~ 24:00, 주말 오후 ~ 새벽"
          className="mt-2"
          maxLength={64}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          자유 입력 (최대 64자)
        </p>
      </div>
    </div>
  );
}
