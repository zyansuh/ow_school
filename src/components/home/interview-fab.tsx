'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InterviewFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <Link
      href="/graduation"
      className={cn(
        'fixed z-50 flex items-center gap-2 rounded-full border border-primary/40',
        'bg-primary/90 px-4 py-3 text-sm font-medium text-primary-foreground',
        'shadow-lg shadow-primary/25 backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        'hover:scale-105 hover:border-primary/60 hover:bg-primary hover:shadow-xl hover:shadow-primary/35',
        'active:scale-[0.98]',
        'bottom-6 right-4 sm:bottom-8 sm:right-6',
        'min-h-11',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
      aria-label="졸업면담 작성"
    >
      <Pencil className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sm:hidden">졸업면담</span>
      <span className="hidden sm:inline">졸업면담 작성</span>
    </Link>
  );
}
