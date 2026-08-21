'use client';

import { Suspense } from 'react';
import { AdminClassFilter } from '@/components/admin/admin-class-filter';
import { useAdminClassFilter } from '@/hooks/admin/use-admin-class-filter';
import { ADMIN_CLASS_ALL, type AdminClassFilterValue } from '@/lib/admin/class-filter';

function ClassFilterInner({ className }: { className?: string }) {
  const { classFilter, setClassFilter } = useAdminClassFilter();
  return (
    <AdminClassFilter value={classFilter} onChange={setClassFilter} className={className} />
  );
}

/** `useSearchParams`용 Suspense 포함 반 필터 바 */
export function AdminClassFilterBar({ className }: { className?: string }) {
  return (
    <Suspense
      fallback={
        <AdminClassFilter
          value={ADMIN_CLASS_ALL}
          onChange={(_v: AdminClassFilterValue) => {}}
          className={className}
        />
      }
    >
      <ClassFilterInner className={className} />
    </Suspense>
  );
}
