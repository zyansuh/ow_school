'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type MonthlyPoint = { month: string; count: number };

export function MonthlyStatsEditor({
  title,
  type,
  data,
  onSaved,
}: {
  title: string;
  type: 'applications' | 'interviews';
  data: MonthlyPoint[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MonthlyPoint[]>(data);
  const [saving, setSaving] = useState(false);

  const openEditor = () => {
    setDraft(data);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stats/monthly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: draft }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <Button type="button" size="sm" variant="outline" onClick={openEditor}>
          수정
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title} 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {draft.map((d, i) => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-16">{d.month.slice(5)}월</span>
                <Input
                  type="number"
                  min={0}
                  value={d.count}
                  onChange={(e) => {
                    const next = [...draft];
                    next[i] = { ...d, count: Number(e.target.value) };
                    setDraft(next);
                  }}
                />
              </div>
            ))}
            <Button className="w-full" onClick={() => void save()} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
