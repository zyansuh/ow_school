'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserDisplayNickEdit } from '@/components/admin/user-display-nick-edit';
import { UserSiteRoleEdit } from '@/components/admin/user-site-role-edit';
import { UserGraduationActions } from '@/components/admin/user-graduation-actions';
import { formatDate, cn } from '@/lib/utils';
import { type SiteUserRole } from '@/lib/users/role';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';

type SiteUser = {
  id: string;
  discordId: string;
  displayNickname: string | null;
  displayName: string;
  guildNickname: string;
  discordUsername: string;
  role: SiteUserRole;
  roleLabel: string;
  siteRole: SiteUserRole | null;
  inferredRole: SiteUserRole;
  isInGuild: boolean;
  guildJoinedAt: string | null;
  className: string;
  teacherName: string;
  status: string;
  interviewCount: number;
  applicationCount: number;
  createdAt: string;
};

const ROLE_FILTERS = ['전체', '마을주민', '학생', '선생님', '관리자'] as const;
const ROLE_FILTER_MAP: Record<(typeof ROLE_FILTERS)[number], SiteUserRole | null> = {
  전체: null,
  마을주민: 'resident',
  학생: 'student',
  선생님: 'teacher',
  관리자: 'admin',
};

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
        description="Discord 로그인 계정 전체 목록입니다. 자동 역할: 서버 가입 2달 미만은 학생, 그 외 일반 회원은 마을주민입니다. 졸업·졸업 취소는 관리자가 처리할 수 있습니다."
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
          className="mx-1 sm:mx-2"
          data={filtered}
          keyExtractor={(u) => u.id}
          emptyTitle="사용자가 없습니다"
          columns={[
            {
              key: 'name',
              header: '표시 이름',
              width: '11rem',
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
              width: '10.5rem',
              cellClassName: 'font-mono text-xs text-muted-foreground',
              cell: (u) => (
                <span className="block truncate" title={u.discordId}>
                  {u.discordId}
                </span>
              ),
              hideOnMobile: true,
            },
            {
              key: 'role',
              header: '사이트 역할',
              width: '12.5rem',
              cell: (u) => (
                <UserSiteRoleEdit
                  userId={u.id}
                  saveUrl={`/api/admin/site-users/${u.id}`}
                  role={u.role}
                  siteRole={u.siteRole}
                  inferredRole={u.inferredRole}
                  onSaved={() => void load()}
                />
              ),
            },
            {
              key: 'class',
              header: '반',
              width: '5.5rem',
              cell: (u) => <span className="block truncate">{u.className}</span>,
              hideOnMobile: true,
            },
            {
              key: 'teacher',
              header: '담당 선생님',
              width: '7rem',
              cell: (u) => <span className="block truncate">{u.teacherName}</span>,
              hideOnMobile: true,
            },
            {
              key: 'status',
              header: '상태',
              width: '4.5rem',
              cell: (u) => (
                <Badge variant={u.status === 'graduated' ? 'outline' : 'success'}>
                  {u.status === 'graduated' ? '졸업' : '활동'}
                </Badge>
              ),
            },
            {
              key: 'graduation',
              header: '졸업 관리',
              width: '7.5rem',
              mobileFooter: true,
              cell: (u) => (
                <UserGraduationActions
                  userId={u.id}
                  displayName={u.displayName}
                  status={u.status}
                  saveUrl={`/api/admin/site-users/${u.id}`}
                  canGraduate={u.role === 'student'}
                  onSaved={() => void load()}
                />
              ),
            },
            {
              key: 'guild',
              header: '서버',
              width: '4.5rem',
              cell: (u) => (
                <Badge variant={u.isInGuild ? 'success' : 'warning'}>
                  {u.isInGuild ? '가입' : '미가입'}
                </Badge>
              ),
              hideOnMobile: true,
            },
            {
              key: 'guildJoin',
              header: '서버 가입일',
              width: '6.5rem',
              cell: (u) => (
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {u.guildJoinedAt ? formatDate(u.guildJoinedAt) : u.isInGuild ? '동기화 대기' : '-'}
                </span>
              ),
              hideOnMobile: true,
            },
            {
              key: 'joined',
              header: '최초 로그인',
              width: '6.5rem',
              cell: (u) => (
                <span className="text-muted-foreground text-xs whitespace-nowrap">{formatDate(u.createdAt)}</span>
              ),
              hideOnMobile: true,
            },
          ]}
        />
      )}
    </div>
  );
}
