'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_LIST_PAGE_SIZE } from '@/lib/admin/class-filter';

export function useLoadMore<T>(items: T[], pageSize = ADMIN_LIST_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const remaining = Math.max(0, items.length - visibleCount);

  const loadMore = useCallback(() => {
    setVisibleCount((n) => n + pageSize);
  }, [pageSize]);

  return { visible, hasMore, remaining, loadMore, total: items.length };
}
