'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDateTime, STATUS_LABELS } from '@/lib/utils';

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

  return (
    <div>
      <AdminPageHeader
        title="신청 관리"
        description="수강 신청은 반장 선택 시 자동 승인됩니다."
      />
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <DataTable
          data={apps}
          keyExtractor={(a) => a.id}
          emptyTitle="아직 신청 내역이 없습니다"
          emptyDescription="학생이 수강 신청을 완료하면 여기에 표시됩니다."
          columns={[
            { key: 'nick', header: '신청자', cell: (a) => a.nickname },
            { key: 'teacher', header: '희망 반장', cell: (a) => a.teacher.name },
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
                <Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}>
                  {STATUS_LABELS[a.status]}
                </Badge>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
