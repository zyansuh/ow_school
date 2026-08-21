'use client';

import { cn } from '@/lib/utils';
import {
  ADMIN_CLASS_FILTERS,
  type AdminClassFilterValue,
} from '@/lib/admin/class-filter';

type Props = {
  value: AdminClassFilterValue;
  onChange: (next: AdminClassFilterValue) => void;
  className?: string;
};

export function AdminClassFilter({ value, onChange, className }: Props) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {ADMIN_CLASS_FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm transition-colors min-h-10',
            value === f
              ? 'bg-primary/15 text-primary font-medium'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
