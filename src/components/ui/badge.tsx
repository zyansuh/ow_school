import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-primary/15 text-primary',
        variant === 'info' && 'bg-secondary/15 text-secondary',
        variant === 'outline' && 'border border-border text-muted-foreground',
        variant === 'success' && 'bg-success/15 text-success',
        variant === 'warning' && 'bg-warning/15 text-warning',
        variant === 'danger' && 'bg-danger/15 text-danger',
        className,
      )}
      {...props}
    />
  );
}
