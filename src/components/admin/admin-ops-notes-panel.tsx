'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';
import { ADMIN_CLASS_NAMES } from '@/lib/admin/class-filter';
import type { OpsNotesPayload } from '@/lib/admin/ops-notes';

type TeacherRow = { id: string; name: string; className: string };

export function AdminOpsNotesPanel() {
  const [notes, setNotes] = useState<OpsNotesPayload>({ classes: {}, teachers: {} });
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [draftClasses, setDraftClasses] = useState<Record<string, string>>({});
  const [draftTeachers, setDraftTeachers] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/admin/ops-notes').then((r) => r.json()),
      fetch('/api/admin/teachers?for=student-assign').then((r) => r.json()),
    ]).then(([n, t]) => {
      const payload: OpsNotesPayload = {
        classes: n.classes ?? {},
        teachers: n.teachers ?? {},
      };
      setNotes(payload);
      setDraftClasses({ ...payload.classes });
      setDraftTeachers({ ...payload.teachers });
      setTeachers(
        Array.isArray(t)
          ? t.map((row: { id: string; name: string; class?: { name: string } }) => ({
              id: row.id,
              name: row.name,
              className: row.class?.name ?? '',
            }))
          : [],
      );
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ops-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes: draftClasses, teachers: draftTeachers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setNotes(data);
      setDraftClasses({ ...(data.classes ?? {}) });
      setDraftTeachers({ ...(data.teachers ?? {}) });
      toast.success('운영 메모가 저장되었습니다');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`${ds.card} ${ds.cardPad}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className={ds.sectionTitle}>반·선생님 운영 메모</h2>
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? '저장 중…' : '메모 저장'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        예: 「이번 주 휴식」, 「인원 조정 예정」 — 반·선생님 카드에 짧게 남겨 둡니다.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {ADMIN_CLASS_NAMES.filter((n) => n !== '미배정').map((name) => (
          <div key={name} className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <Input
              value={draftClasses[name] ?? ''}
              onChange={(e) => setDraftClasses((d) => ({ ...d, [name]: e.target.value }))}
              placeholder="운영 메모"
              className="h-9 text-sm"
              maxLength={120}
            />
            {notes.classes[name] && draftClasses[name] === notes.classes[name] && (
              <p className="text-[11px] text-muted-foreground">{notes.classes[name]}</p>
            )}
          </div>
        ))}
      </div>

      <h3 className="text-sm font-medium text-foreground mb-2">선생님 메모</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {teachers.map((t) => (
          <div
            key={t.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
          >
            <div className="sm:w-40 shrink-0 min-w-0">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.className}</p>
            </div>
            <Input
              value={draftTeachers[t.id] ?? ''}
              onChange={(e) => setDraftTeachers((d) => ({ ...d, [t.id]: e.target.value }))}
              placeholder="예: 이번 주 휴식"
              className="h-9 text-sm flex-1"
              maxLength={120}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
