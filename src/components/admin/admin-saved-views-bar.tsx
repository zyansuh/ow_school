'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import type { SavedView } from '@/lib/admin/saved-views';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** 현재 페이지 쿼리를 저장할 때 기본 경로 (예: /admin/students) */
  saveBasePath?: string;
};

export function AdminSavedViewsBar({ className, saveBasePath }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/saved-views')
      .then((r) => r.json())
      .then((d) => setViews(Array.isArray(d.views) ? d.views : []))
      .catch(() => setViews([]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCurrent = async () => {
    const label = name.trim();
    if (!label) {
      toast.error('프리셋 이름을 입력하세요');
      return;
    }
    const base = saveBasePath || pathname;
    const qs = searchParams.toString();
    const href = qs ? `${base}?${qs}` : base;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: label, href }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setViews(Array.isArray(data.views) ? data.views : []);
      setName('');
      toast.success('보기가 저장되었습니다');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('이 저장된 보기를 삭제할까요?')) return;
    try {
      const res = await fetch('/api/admin/saved-views', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      setViews(Array.isArray(data.views) ? data.views : []);
      toast.success('삭제되었습니다');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bookmark className="h-4 w-4" />
        <span>저장된 보기</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <div key={v.id} className="inline-flex items-center gap-1">
            <Link
              href={v.href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                v.builtin
                  ? 'border-border bg-muted/40 text-foreground hover:border-primary/40'
                  : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
              )}
            >
              {v.name}
            </Link>
            {!v.builtin && (
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-danger"
                aria-label={`${v.name} 삭제`}
                onClick={() => void remove(v.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="현재 필터를 이름으로 저장"
          className="sm:max-w-xs h-9 text-sm"
        />
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void saveCurrent()}>
          <Plus className="h-3.5 w-3.5" />
          {saving ? '저장 중…' : '현재 보기 저장'}
        </Button>
      </div>
    </div>
  );
}
