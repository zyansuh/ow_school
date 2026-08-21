'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { groupByClassName } from '@/lib/admin/class-filter';
import { useLoadMore } from '@/hooks/admin/use-load-more';

type SectionProps<T> = {
  className: string;
  items: T[];
  defaultOpen?: boolean;
  renderList: (items: T[]) => ReactNode;
  renderMeta?: (items: T[], className: string) => ReactNode;
};

function ClassSection<T>({
  className,
  items,
  defaultOpen = true,
  renderList,
  renderMeta,
}: SectionProps<T>) {
  const [open, setOpen] = useState(defaultOpen);
  const { visible, hasMore, remaining, loadMore, total } = useLoadMore(items);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-b border-border pb-2 text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              !open && '-rotate-90',
            )}
          />
          <h2 className="text-base font-semibold text-foreground truncate">{className}</h2>
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {total}
          </span>
        </span>
        {renderMeta && (
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
            {renderMeta(items, className)}
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-3">
          {renderList(visible)}
          {hasMore && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={loadMore}>
                더 보기 ({remaining}명)
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type Props<T> = {
  items: T[];
  getClassName: (item: T) => string | null | undefined;
  renderList: (items: T[]) => ReactNode;
  renderMeta?: (items: T[], className: string) => ReactNode;
  emptyFallback?: ReactNode;
  /** 특정 반만 볼 때: 섹션 없이 더보기만 */
  flat?: boolean;
};

/** 전체: 반별 접기 섹션 / flat: 단일 목록 + 더 보기 */
export function AdminClassSections<T>({
  items,
  getClassName,
  renderList,
  renderMeta,
  emptyFallback,
  flat = false,
}: Props<T>) {
  if (items.length === 0) {
    return <>{emptyFallback ?? null}</>;
  }

  if (flat) {
    return <FlatLoadMoreList items={items} renderList={renderList} />;
  }

  const groups = groupByClassName(items, getClassName);

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <ClassSection
          key={g.className}
          className={g.className}
          items={g.items}
          renderList={renderList}
          renderMeta={renderMeta}
        />
      ))}
    </div>
  );
}

function FlatLoadMoreList<T>({
  items,
  renderList,
}: {
  items: T[];
  renderList: (items: T[]) => ReactNode;
}) {
  const { visible, hasMore, remaining, loadMore } = useLoadMore(items);
  return (
    <div className="space-y-3">
      {renderList(visible)}
      {hasMore && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={loadMore}>
            더 보기 ({remaining}명)
          </Button>
        </div>
      )}
    </div>
  );
}
