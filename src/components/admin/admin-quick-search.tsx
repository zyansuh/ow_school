'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Hit = {
  id: string;
  displayName: string;
  discordId: string;
  status: string;
  className: string;
  role: string;
  roleLabel: string;
  interviewCount: number;
};

export function AdminQuickSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((term: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (term.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      void fetch(`/api/admin/quick-search?q=${encodeURIComponent(term.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          setHits(Array.isArray(data) ? data : []);
          setOpen(true);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 250);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <div ref={wrapRef} className={cn('relative w-full max-w-xs', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            search(v);
            setOpen(true);
          }}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim().length >= 2) {
              e.preventDefault();
              go(`/admin/users?q=${encodeURIComponent(q.trim())}`);
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="닉 / Discord ID 검색"
          className="pl-9 h-9 text-sm"
          aria-label="관리자 빠른 검색"
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {loading && hits.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">검색 중…</p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">결과 없음</p>
          ) : (
            <ul className="py-1">
              {hits.map((h) => (
                <li key={h.id} className="border-b border-border/50 last:border-0">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground truncate">{h.displayName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {h.discordId} · {h.roleLabel} · {h.className}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Link
                        href={`/admin/users?q=${encodeURIComponent(h.discordId)}`}
                        className="text-xs text-primary hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        사용자
                      </Link>
                      {h.role === 'student' && h.status === 'active' && (
                        <Link
                          href={`/admin/students?q=${encodeURIComponent(h.discordId)}`}
                          className="text-xs text-primary hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          학생
                        </Link>
                      )}
                      {h.interviewCount > 0 && (
                        <Link
                          href={`/admin/interviews?q=${encodeURIComponent(h.displayName)}`}
                          className="text-xs text-primary hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          면담
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
