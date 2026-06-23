import Link from 'next/link';

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
        <p className="text-[11px] text-gray-600">© OW School · 평화로운 게임마을</p>
      </div>
    </footer>
  );
}
