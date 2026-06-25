'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserDisplayNickEdit } from '@/components/admin/user-display-nick-edit';
import { formatDate, cn } from '@/lib/utils';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';

type SiteUser = {
  id: string;
  discordId: string;
  displayNickname: string | null;
  displayName: string;
  guildNickname: string;
  discordUsername: string;
  role: 'admin' | 'teacher' | 'student';
  roleLabel: string;
  isInGuild: boolean;
  className: string;
  teacherName: string;
  status: string;
  interviewCount: number;
  applicationCount: number;
  createdAt: string;
};

const ROLE_FILTERS = ['전체', '관리자', '선생님', '학생'] as const;
const ROLE_FILTER_MAP: Record<(typeof ROLE_FILTERS)[number], SiteUser['role'] | null> = {
  전체: null,
  관리자: 'admin',
  선생님: 'teacher',
  학생: 'student',
};

function roleBadgeVariant(role: SiteUser['role']) {
  if (role === 'admin') return 'default' as const;
  if (role === 'teacher') return 'outline' as const;
  return 'info' as const;
}

export default function AdminSiteUsersPage() {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>('전체');

  const load = useCallback(() => {
    setLoading(true);
    return fetch('/api/admin/site-users')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          toast.error('사용자 목록을 불러오지 못했습니다');
          setUsers([]);
          return;
        }
        setUsers(data);
      })
      .catch(() => toast.error('사용자 목록을 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const role = ROLE_FILTER_MAP[roleFilter];
    return users.filter((u) => {
      if (role && u.role !== role) return false;
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.discordId.includes(q) ||
        u.discordUsername.toLowerCase().includes(q) ||
        u.guildNickname.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader
        title="사이트 사용자"
        description="Discord로 로그인한 적이 있는 전체 계정입니다. 표시 닉네임은 관리자 화면용이며 Discord 서버 닉은 변경되지 않습니다."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·Discord ID·username 검색"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRoleFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm transition-colors',
                roleFilter === f
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        총 {filtered.length}명
        {query || roleFilter !== '전체' ? ` (전체 ${users.length}명 중)` : ''}
      </p>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(u) => u.id}
          emptyTitle="사용자가 없습니다"
          columns={[
            {
              key: 'name',
              header: '표시 이름',
              cell: (u) => (
                <UserDisplayNickEdit
                  userId={u.id}
                  saveUrl={`/api/admin/site-users/${u.id}`}
                  currentDisplay={u.displayName}
                  displayNickname={u.displayNickname}
                  guildNickname={u.guildNickname}
                  onSaved={() => void load()}
                />
              ),
            },
            {
              key: 'discordId',
              header: 'Discord ID',
              cell: (u) => (
                <span className="font-mono text-xs text-muted-foreground break-all">{u.discordId}</span>
              ),
              hideOnMobile: true,
            },
            {
              key: 'role',
              header: '역할',
              cell: (u) => <Badge variant={roleBadgeVariant(u.role)}>{u.roleLabel}</Badge>,
            },
            {
              key: 'class',
              header: '반',
              cell: (u) => u.className,
              hideOnMobile: true,
            },
            {
              key: 'teacher',
              header: '담당 선생님',
              cell: (u) => u.teacherName,
              hideOnMobile: true,
            },
            {
              key: 'status',
              header: '상태',
              cell: (u) => (
                <Badge variant={u.status === 'graduated' ? 'outline' : 'success'}>
                  {u.status === 'graduated' ? '졸업' : '활동'}
                </Badge>
              ),
            },
            {
              key: 'guild',
              header: '서버',
              cell: (u) => (
                <Badge variant={u.isInGuild ? 'success' : 'warning'}>
                  {u.isInGuild ? '가입' : '미가입'}
                </Badge>
              ),
              hideOnMobile: true,
            },
            {
              key: 'joined',
              header: '최초 로그인',
              cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>,
              hideOnMobile: true,
            },
          ]}
        />
      )}
    </div>
  );
}
