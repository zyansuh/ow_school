'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  loading?: boolean;
  onConfirm: () => void;
};

export function DeleteGraduationPointDialog({
  open,
  onOpenChange,
  studentName,
  loading,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{studentName} — 졸업 포인트 삭제</DialogTitle>
          <DialogDescription className="sr-only">졸업 포인트 삭제 확인</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-foreground">
          <p>정말 삭제하시겠습니까?</p>
          <p className="text-muted-foreground">삭제 후 복구할 수 없습니다.</p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? '삭제 중…' : '삭제'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
