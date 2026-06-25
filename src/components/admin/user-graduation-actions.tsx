'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Props = {
  userId: string;
  displayName: string;
  status: string;
  saveUrl: string;
  canGraduate: boolean;
  onSaved: () => void;
};

export function UserGraduationActions({
  userId,
  displayName,
  status,
  saveUrl,
  canGraduate,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);

  const run = async (statusAction: 'graduate' | 'ungraduate') => {
    const message =
      statusAction === 'graduate'
        ? `「${displayName}」님을 졸업 처리할까요?`
        : `「${displayName}」님의 졸업을 취소하고 재학생으로 복구할까요?`;
    if (!window.confirm(message)) return;

    setLoading(true);
    try {
      const res = await fetch(saveUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '처리 실패');
      toast.success(
        statusAction === 'graduate' ? '졸업 처리되었습니다' : '졸업이 취소되어 재학생으로 복구되었습니다',
      );
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '처리 실패');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'graduated') {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => void run('ungraduate')}
      >
        {loading ? '처리 중...' : '졸업 취소'}
      </Button>
    );
  }

  if (canGraduate && status === 'active') {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => void run('graduate')}
      >
        {loading ? '처리 중...' : '졸업'}
      </Button>
    );
  }

  return <span className="text-xs text-muted-foreground">-</span>;
}
