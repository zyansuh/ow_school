'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/discord-sync', label: 'Discord 동기화' },
  { href: '/admin/students', label: '학생 관리' },
  { href: '/admin/graduated', label: '졸업생' },
  { href: '/admin/teachers', label: '선생님 관리' },
  { href: '/admin/applications', label: '신청 관리' },
  { href: '/admin/interviews', label: '졸업면담' },
  { href: '/admin/points', label: '포인트 관리' },
  { href: '/admin/graduation-reviews', label: '졸업후기' },
  { href: '/admin/admins', label: '관리자 목록' },
  { href: '/admin/roles', label: '권한 요청' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:w-52 shrink-0 -mx-1 px-1 snap-x snap-mandatory">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors snap-start min-h-11 flex items-center',
            pathname === l.href
              ? 'bg-primary/15 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
