'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GraduateStudentDialog } from '@/components/admin/graduate-student-dialog';
import { WithdrawStudentDialog } from '@/components/admin/withdraw-student-dialog';

type Props = {
  userId: string;
  displayName: string;
  status: string;
  saveUrl: string;
  canGraduate: boolean;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  onSaved: () => void;
};

export function UserGraduationActions({
  userId,
  displayName,
  status,
  saveUrl,
  canGraduate,
  assignedTeacherId,
  assignedTeacherName,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [graduateOpen, setGraduateOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const ungraduate = async () => {
    if (!window.confirm(`「${displayName}」님의 졸업을 취소하고 재학생으로 복구할까요?`)) return;

    setLoading(true);
    try {
      const res = await fetch(saveUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusAction: 'ungraduate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '처리 실패');
      toast.success('졸업이 취소되어 재학생으로 복구되었습니다');
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
        onClick={() => void ungraduate()}
      >
        {loading ? '처리 중...' : '졸업 취소'}
      </Button>
    );
  }

  if (status === 'withdrawn') {
    return <span className="text-xs text-muted-foreground">퇴교</span>;
  }

  if (canGraduate && status === 'active') {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setGraduateOpen(true)}
          >
            졸업
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-danger border-danger/40 hover:bg-danger/10"
            onClick={() => setWithdrawOpen(true)}
          >
            퇴교
          </Button>
        </div>
        <GraduateStudentDialog
          open={graduateOpen}
          onOpenChange={setGraduateOpen}
          studentId={userId}
          studentName={displayName}
          assignedTeacherId={assignedTeacherId}
          assignedTeacherName={assignedTeacherName}
          saveUrl={saveUrl}
          apiMode={saveUrl.includes('/site-users/') ? 'site-users' : 'students'}
          onGraduated={onSaved}
        />
        <WithdrawStudentDialog
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          studentId={userId}
          studentName={displayName}
          saveUrl={saveUrl.includes('/site-users/') ? saveUrl : undefined}
          onWithdrawn={onSaved}
        />
      </>
    );
  }

  return <span className="text-xs text-muted-foreground">-</span>;
}
