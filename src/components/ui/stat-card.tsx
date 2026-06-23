import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  suffix?: string;
};

export function StatCard({ label, value, icon: Icon, className, suffix }: Props) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[120px] flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/25 hover:bg-card-hover hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {value}
        {suffix && <span className="ml-1 text-lg font-semibold text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
