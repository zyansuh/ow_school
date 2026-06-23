'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminGrantSearch } from '@/components/admin/admin-grant-search';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';

type AdminUser = {
  id: string;
  userId: string;
  displayName: string;
  discordId: string;
  discordUsername: string;
  roleNames: string[];
  isInGuild: boolean;
  grantedAt: string;
};

export default function AdminAdminsPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/admins')
      .then((r) => r.json())
      .then((d) => {
        setAdmins(Array.isArray(d) ? d : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (userId: string, name: string) => {
    const isSelf = userId === currentUserId;
    const msg = isSelf
      ? `본인(「${name}」)의 관리자 권한을 해제하면 관리자 페이지에 접근할 수 없습니다. 계속할까요?`
      : `「${name}」님의 관리자 권한을 해제할까요?`;
    if (!confirm(msg)) return;

    setRevokingId(userId);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '해제 실패');
      }
      toast.success('관리자 권한이 해제되었습니다');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '해제 실패');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader
        title="관리자 목록"
        description="관리자 등록·해제 및 권한 현황을 관리합니다. 테스트 시 자유롭게 등록/해제할 수 있습니다."
      />

      <AdminGrantSearch onChanged={load} />

      {loading ? (
        <SkeletonTable rows={4} />
      ) : (
        <DataTable
          data={admins}
          keyExtractor={(a) => a.id}
          emptyTitle="등록된 관리자가 없습니다"
          emptyDescription="위 검색으로 사용자를 찾아 관리자로 등록하세요."
          columns={[
            {
              key: 'name',
              header: '표시 이름',
              cell: (a) => (
                <div>
                  <div className="font-medium text-primary">{a.displayName}</div>
                  {a.userId === currentUserId && (
                    <Badge variant="outline" className="mt-1 text-xs">나</Badge>
                  )}
                  {!a.isInGuild && <Badge variant="warning" className="mt-1 ml-1">서버 미가입</Badge>}
                </div>
              ),
            },
            {
              key: 'discord',
              header: '디스코드',
              cell: (a) => (
                <span className="text-sm">
                  @{a.discordUsername}
                  <span className="block text-xs text-muted-foreground font-mono mt-0.5">{a.discordId}</span>
                </span>
              ),
            },
            {
              key: 'roles',
              header: '서버 역할',
              cell: (a) => (a.roleNames?.length ? a.roleNames.join(', ') : '-'),
              hideOnMobile: true,
            },
            {
              key: 'date',
              header: '등록일',
              cell: (a) => <span className="text-muted-foreground">{formatDate(a.grantedAt)}</span>,
            },
            {
              key: 'action',
              header: '관리',
              mobileFooter: true,
              cell: (a) => (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-danger border-danger/30 hover:bg-danger/10 min-h-11 sm:min-h-0"
                  disabled={revokingId === a.userId}
                  onClick={() => void revoke(a.userId, a.displayName)}
                >
                  {revokingId === a.userId ? '해제 중...' : '해제'}
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
