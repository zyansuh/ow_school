'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/loading';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** 모바일 카드에서 라벨로 표시 */
  mobileLabel?: string;
  hideOnMobile?: boolean;
  /** 모바일에서 카드 하단 전체 너비 버튼 영역 */
  mobileFooter?: boolean;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  className,
}: Props<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile && !c.mobileFooter);
  const footerColumns = columns.filter((c) => c.mobileFooter);

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-card overflow-hidden', className)}>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-max min-w-full text-sm table-auto">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="border-b border-border/50 hover:bg-card-hover/60 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-foreground align-middle whitespace-nowrap">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {data.map((row) => (
          <div key={keyExtractor(row)} className="p-4 space-y-3">
            {mobileColumns.map((col) => (
              <div key={col.key} className="flex justify-between items-center gap-3 text-sm min-w-0">
                <span className="text-muted-foreground shrink-0 whitespace-nowrap">{col.mobileLabel ?? col.header}</span>
                <span className="text-foreground text-right min-w-0 whitespace-nowrap overflow-x-auto">{col.cell(row)}</span>
              </div>
            ))}
            {footerColumns.length > 0 && (
              <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
                {footerColumns.map((col) => (
                  <div key={col.key} className="w-full [&_button]:w-full sm:[&_button]:w-auto">
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
