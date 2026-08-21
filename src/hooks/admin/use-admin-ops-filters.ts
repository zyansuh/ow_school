'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type OpsQuickFilter = 'all' | 'joinedThisMonth' | 'noInterview';

function monthStartIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** URL: teacherId, quick (joinedThisMonth|noInterview) */
export function useAdminOpsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const teacherId = searchParams.get('teacherId') || '';
  const quickRaw = searchParams.get('quick') || '';
  const quick: OpsQuickFilter =
    quickRaw === 'joinedThisMonth' || quickRaw === 'noInterview' ? quickRaw : 'all';

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete(key);
      else params.set(key, value);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setTeacherId = useCallback(
    (id: string) => setParam('teacherId', id || null),
    [setParam],
  );

  const setQuick = useCallback(
    (v: OpsQuickFilter) => setParam('quick', v === 'all' ? null : v),
    [setParam],
  );

  const joinedThisMonthCutoff = useMemo(() => monthStartIso(), []);

  return {
    teacherId,
    setTeacherId,
    quick,
    setQuick,
    joinedThisMonthCutoff,
  };
}

export function matchesJoinedThisMonth(createdAt: string | Date, cutoff: Date) {
  return new Date(createdAt) >= cutoff;
}
