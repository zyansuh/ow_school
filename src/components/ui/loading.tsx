import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-purple-400', className)} />;
}

export function LoadingPage({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <LoadingSpinner className="h-8 w-8" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-16 px-4">
      <p className="text-gray-300 font-medium mb-2">{title}</p>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
    </div>
  );
}
