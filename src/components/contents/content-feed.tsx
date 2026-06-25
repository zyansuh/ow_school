'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentPostListItem } from '@/lib/contents/types';
import { ContentCard } from '@/components/contents/content-card';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/loading';

export function ContentFeed() {
  const [items, setItems] = useState<ContentPostListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (nextCursor?: string | null) => {
    const isInitial = !nextCursor;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      if (nextCursor) qs.set('cursor', nextCursor);
      const res = await fetch(`/api/contents?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '목록을 불러오지 못했습니다');

      setItems((prev) => (isInitial ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
      setHasMore(!!data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || !cursor) return;
    void fetchPage(cursor);
  }, [cursor, fetchPage, hasMore, loading, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="불러오기 실패"
        description={error}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="등록된 컨텐츠가 없습니다"
        description="곧 새로운 컨텐츠가 올라올 예정입니다."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
        {items.map((post, index) => (
          <ContentCard key={post.id} post={post} priority={index < 4} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" aria-hidden />

      {loadingMore && (
        <div className="flex justify-center py-6">
          <LoadingSpinner className="h-6 w-6" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground pb-4">마지막 게시글입니다</p>
      )}
    </div>
  );
}
