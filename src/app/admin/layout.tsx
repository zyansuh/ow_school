import Link from 'next/link';
import { AdminNav } from '@/components/admin/admin-nav';
import { SITE_NAME } from '@/lib/site-brand';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-purple-400">{SITE_NAME} 관리자</Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">사이트로 돌아가기</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <AdminNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
