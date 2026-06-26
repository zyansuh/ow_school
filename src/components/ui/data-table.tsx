'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/loading';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** 데스크톱 열 최소 너비 (예: '12rem') — `layout="wide"`에서 가로 스크롤 기준 */
  width?: string;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  mobileFooter?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /**
   * wide — 열 최소 너비 유지 + 가로 스크롤 (관리자 넓은 테이블용)
   * compact — 뷰포트에 맞춤 (기본)
   */
  layout?: 'compact' | 'wide';
  /** wide 레이아웃 시 스크롤 안내 문구 */
  scrollHint?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  className,
  layout = 'compact',
  scrollHint = false,
}: Props<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile && !c.mobileFooter);
  const footerColumns = columns.filter((c) => c.mobileFooter);
  const hasColumnWidths = columns.some((c) => c.width);
  const isWide = layout === 'wide' && hasColumnWidths;

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-card', className)}>
      <div
        className={cn(
          'hidden md:block',
          isWide && 'overflow-x-auto overscroll-x-contain',
        )}
      >
        {isWide && scrollHint && (
          <p className="px-4 sm:px-6 pt-3 pb-1 text-xs text-muted-foreground">
            열이 많을 때는 표를 좌우로 스크롤할 수 있습니다.
          </p>
        )}
        <div className={cn('px-4 sm:px-6 py-1', isWide && scrollHint && 'pt-0')}>
          <table
            className={cn(
              'text-sm',
              isWide ? 'w-max min-w-full table-auto' : hasColumnWidths ? 'w-full table-fixed' : 'w-full table-auto min-w-full',
            )}
          >
            {hasColumnWidths && (
              <colgroup>
                {columns.map((col) => (
                  <col
                    key={col.key}
                    style={
                      col.width
                        ? isWide
                          ? { minWidth: col.width }
                          : { width: col.width }
                        : undefined
                    }
                  />
                ))}
              </colgroup>
            )}
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap align-middle',
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-border/50 hover:bg-card-hover/60 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-3 text-foreground align-middle',
                        col.cellClassName,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden divide-y divide-border">
        {data.map((row) => (
          <div key={keyExtractor(row)} className="p-4 space-y-3">
            {mobileColumns.map((col) => (
              <div key={col.key} className="flex justify-between items-start gap-3 text-sm min-w-0">
                <span className="text-muted-foreground shrink-0 whitespace-nowrap">
                  {col.mobileLabel ?? col.header}
                </span>
                <div className="text-foreground text-right min-w-0 max-w-[70%] overflow-x-auto">
                  {col.cell(row)}
                </div>
              </div>
            ))}
            {footerColumns.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
                {footerColumns.map((col) => (
                  <div key={col.key} className="[&_button]:shrink-0">
                    {col.cell(row)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
