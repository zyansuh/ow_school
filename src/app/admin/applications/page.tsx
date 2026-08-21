'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminClassFilterBar } from '@/components/admin/admin-class-filter-bar';
import { AdminClassSections } from '@/components/admin/admin-class-sections';
import { formatDateTime, STATUS_LABELS } from '@/lib/utils';
import { useAdminClassFilter } from '@/hooks/admin/use-admin-class-filter';
import { ADMIN_CLASS_ALL, matchesClassFilter } from '@/lib/admin/class-filter';

type App = {
  id: string;
  nickname: string;
  status: string;
  createdAt: string;
  playTimeSlot?: string | null;
  teacher: { name: string };
  class: { name: string };
};

export default function AdminApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <AdminPageHeader title="신청 관리" description="불러오는 중…" />
          <SkeletonTable rows={6} />
        </div>
      }
    >
      <AdminApplicationsInner />
    </Suspense>
  );
}

function AdminApplicationsInner() {
  const { classFilter } = useAdminClassFilter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/applications')
      .then((r) => r.json())
      .then((d) => {
        setApps(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () => apps.filter((a) => matchesClassFilter(a.class.name, classFilter)),
    [apps, classFilter],
  );

  const columns: DataTableColumn<App>[] = [
    { key: 'nick', header: '신청자', cell: (a) => a.nickname },
    { key: 'teacher', header: '희망 선생님', cell: (a) => a.teacher.name },
    { key: 'class', header: '반', cell: (a) => a.class.name },
    {
      key: 'slot',
      header: '게임 시간대',
      cell: (a) => a.playTimeSlot || '-',
      hideOnMobile: true,
    },
    {
      key: 'date',
      header: '신청일',
      cell: (a) => formatDateTime(a.createdAt),
    },
    {
      key: 'status',
      header: '상태',
      cell: (a) => (
        <Badge
          variant={
            a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'
          }
        >
          {STATUS_LABELS[a.status]}
        </Badge>
      ),
    },
  ];

  const renderList = (rows: App[]) => (
    <DataTable
      data={rows}
      keyExtractor={(a) => a.id}
      emptyTitle="아직 신청 내역이 없습니다"
      emptyDescription="학생이 수강 신청을 완료하면 여기에 표시됩니다."
      columns={columns}
    />
  );

  return (
    <div>
      <AdminPageHeader
        title="신청 관리"
        description="수강 신청은 선생님 선택 시 자동 승인됩니다."
      />
      <AdminClassFilterBar className="mb-4" />
      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length}건
        {classFilter !== ADMIN_CLASS_ALL ? ` (전체 ${apps.length}건 중)` : ''}
      </p>
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <AdminClassSections
          items={filtered}
          getClassName={(a) => a.class.name}
          flat={classFilter !== ADMIN_CLASS_ALL}
          emptyFallback={renderList([])}
          renderList={renderList}
        />
      )}
    </div>
  );
}
