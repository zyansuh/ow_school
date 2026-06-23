import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site-brand';

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-gray-800/40 py-6">
      <div className="page-container flex flex-col items-center gap-2">
        <Link
          href="/admin"
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          관리자 페이지
        </Link>
        <p className="text-[11px] text-gray-600">© {SITE_NAME} · {SITE_TAGLINE}</p>
      </div>
    </footer>
  );
}
