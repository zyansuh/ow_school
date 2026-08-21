'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ADMIN_CLASS_ALL,
  parseClassParam,
  type AdminClassFilterValue,
} from '@/lib/admin/class-filter';

/** URL `?class=` 와 동기화된 반 필터 */
export function useAdminClassFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const classFilter = useMemo(
    () => parseClassParam(searchParams.get('class')),
    [searchParams],
  );

  const setClassFilter = useCallback(
    (next: AdminClassFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === ADMIN_CLASS_ALL) {
        params.delete('class');
      } else {
        params.set('class', next);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { classFilter, setClassFilter };
}

/** URL `?q=` 텍스트 검색 (전역 검색·로컬 연동) */
export function useAdminQueryParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') ?? '';

  const setQuery = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (!trimmed) params.delete('q');
      else params.set('q', trimmed);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { query, setQuery };
}
