'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onWithdrawn: () => void;
};

export function WithdrawStudentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  onWithdrawn,
}: Props) {
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '퇴교 처리 실패');
      toast.success('퇴교 처리되었습니다');
      onOpenChange(false);
      onWithdrawn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '퇴교 처리 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{studentName} — 퇴교 처리</DialogTitle>
          <DialogDescription className="sr-only">퇴교 처리 확인</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-foreground">
          <p>정말 퇴교 처리하시겠습니까?</p>
          <p className="text-muted-foreground">퇴교 처리된 학생은 일반 학생 목록에서 제외됩니다.</p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={() => void submit()} disabled={loading}>
              {loading ? '처리 중…' : '퇴교'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
