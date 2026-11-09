'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TeacherDiscordRoleEntry } from '@/lib/teacher/discord-roles';

type Props = {
  className?: string;
};

export function TeacherDiscordRolesPanel({ className }: Props) {
  const [roles, setRoles] = useState<TeacherDiscordRoleEntry[]>([]);
  const [defaults, setDefaults] = useState<TeacherDiscordRoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teacher-discord-roles');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setRoles(data.roles ?? []);
      setDefaults(data.defaults ?? []);
    } catch {
      toast.error('Discord 선생님 역할을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateRow(index: number, patch: Partial<TeacherDiscordRoleEntry>) {
    setRoles((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRoles((prev) => [...prev, { name: '', priority: (prev.at(-1)?.priority ?? 0) + 1 || 1 }]);
  }

  function removeRow(index: number) {
    setRoles((prev) => prev.filter((_, i) => i !== index));
  }

  function resetDefaults() {
    setRoles(defaults.length ? defaults : []);
  }

  async function onSave() {
    const cleaned = roles
      .map((r) => ({ name: r.name.trim(), priority: Number(r.priority) || 99 }))
      .filter((r) => r.name.length > 0);

    if (cleaned.length === 0) {
      toast.error('역할명을 하나 이상 입력하세요');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/teacher-discord-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'save failed');
      setRoles(data.roles ?? cleaned);
      toast.success('Discord 선생님 역할을 저장했습니다');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={className}>
      <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Discord 선생님 역할</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discord 서버 역할명과 우선순위(1=주임 · 2=교사 · 3=보조)를 입력합니다. 사이트 역할 자동
            분류에 쓰이며, <strong className="font-medium text-foreground">선생님 관리에 등록·연결된
            사람</strong>
            이 Discord 역할보다 우선합니다. 수강 신청·배정은 등록된 선생님만 사용합니다.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : (
          <div className="space-y-3">
            {roles.map((role, index) => (
              <div
                key={`role-${index}`}
                className="grid grid-cols-[1fr_5.5rem_auto] gap-2 items-end sm:grid-cols-[1fr_6rem_auto]"
              >
                <div className="space-y-1.5">
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground">역할명 (정확 일치)</p>
                  )}
                  <Input
                    value={role.name}
                    placeholder="예: 신입반 주임교사"
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  {index === 0 && <p className="text-xs text-muted-foreground">우선순위</p>}
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={role.priority}
                    onChange={(e) =>
                      updateRow(index, { priority: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => removeRow(index)}
                  aria-label="역할 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={loading || saving}>
            <Plus className="h-4 w-4" /> 역할 추가
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetDefaults}
            disabled={loading || saving || defaults.length === 0}
          >
            <RotateCcw className="h-4 w-4" /> 기본값
          </Button>
          <Button type="button" size="sm" onClick={() => void onSave()} disabled={loading || saving}>
            <Save className="h-4 w-4" /> 저장
          </Button>
        </div>
      </div>
    </section>
  );
}
