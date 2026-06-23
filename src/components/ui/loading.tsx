import type { ComponentType } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-primary', className)} />;
}

export function LoadingPage({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 page-enter">
      <LoadingSpinner className="h-8 w-8" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-foreground font-medium mb-1">{title}</p>
      {description && <p className="text-muted-foreground text-sm max-w-sm">{description}</p>}
    </div>
  );
}
