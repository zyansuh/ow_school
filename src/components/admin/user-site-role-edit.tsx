'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  SITE_ROLE_LABELS,
  SITE_USER_ROLES,
  type SiteUserRole,
} from '@/lib/users/role';

type Props = {
  userId: string;
  saveUrl: string;
  role: SiteUserRole;
  siteRole: SiteUserRole | null;
  inferredRole: SiteUserRole;
  onSaved: () => void;
};

const AUTO_VALUE = '';

function roleBadgeVariant(role: SiteUserRole) {
  if (role === 'admin') return 'default' as const;
  if (role === 'teacher') return 'outline' as const;
  if (role === 'resident') return 'warning' as const;
  return 'info' as const;
}

export function UserSiteRoleEdit({
  userId,
  saveUrl,
  role,
  siteRole,
  inferredRole,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const selectValue = siteRole ?? AUTO_VALUE;

  const save = async (nextValue: string) => {
    const nextSiteRole = nextValue === AUTO_VALUE ? null : (nextValue as SiteUserRole);
    const nextEffective = nextSiteRole ?? inferredRole;

    if (
      role === 'admin' &&
      nextEffective !== 'admin' &&
      !window.confirm('관리자 권한이 해제됩니다. 계속할까요?')
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(saveUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteRole: nextSiteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '역할 저장 실패');
      toast.success('사이트 역할이 저장되었습니다');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '역할 저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[9rem]">
      <Badge variant={roleBadgeVariant(role)} className="w-fit">
        {SITE_ROLE_LABELS[role]}
      </Badge>
      <Select
        value={selectValue}
        disabled={saving}
        onChange={(e) => void save(e.target.value)}
        aria-label={`${userId} 사이트 역할 변경`}
        className="h-10 text-xs"
      >
        <option value={AUTO_VALUE}>
          자동 ({SITE_ROLE_LABELS[inferredRole]})
        </option>
        {SITE_USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {SITE_ROLE_LABELS[r]}
          </option>
        ))}
      </Select>
    </div>
  );
}
