import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' && 'bg-primary/20 text-primary',
        variant === 'outline' && 'border border-gray-600 text-gray-300',
        variant === 'success' && 'bg-green-500/20 text-green-400',
        variant === 'warning' && 'bg-amber-500/20 text-amber-400',
        variant === 'danger' && 'bg-red-500/20 text-red-400',
        className,
      )}
      {...props}
    />
  );
}
