'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/students', label: '학생 관리' },
  { href: '/admin/teachers', label: '선생님 관리' },
  { href: '/admin/applications', label: '신청 관리' },
  { href: '/admin/interviews', label: '졸업면담' },
  { href: '/admin/roles', label: '관리자 권한' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:w-48 shrink-0">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            'px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors',
            pathname === l.href ? 'bg-purple-600/30 text-purple-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
