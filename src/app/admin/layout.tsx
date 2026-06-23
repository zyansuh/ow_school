import Link from 'next/link';
import { AdminNav } from '@/components/admin/admin-nav';
import { SITE_NAME } from '@/lib/site-brand';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="admin-container py-4 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-primary hover:text-primary-hover transition-colors">
            {SITE_NAME} 관리자
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            사이트로 돌아가기
          </Link>
        </div>
      </div>
      <div className="admin-container py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6 page-enter">
        <AdminNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
