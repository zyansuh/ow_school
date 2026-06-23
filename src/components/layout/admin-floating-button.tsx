'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings } from 'lucide-react';

export function AdminFloatingButton() {
  const { data: session } = useSession();
  if (!session?.user?.isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900/90 border border-gray-600/50 text-gray-400 opacity-70 hover:opacity-100 hover:text-purple-300 hover:border-purple-500/40 hover:scale-105 transition-all shadow-lg"
      aria-label="관리자"
      title="관리자"
    >
      <Settings className="h-4 w-4" />
    </Link>
  );
}
