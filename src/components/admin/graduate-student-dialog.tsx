'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export type GraduateTeacherOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  saveUrl: string;
  /** students API는 action, site-users API는 statusAction */
  apiMode?: 'students' | 'site-users';
  onGraduated: () => void;
};

export function GraduateStudentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  assignedTeacherId,
  assignedTeacherName,
  saveUrl,
  apiMode = 'students',
  onGraduated,
}: Props) {
  const [teachers, setTeachers] = useState<GraduateTeacherOption[]>([]);
  const [sendTeacherDm, setSendTeacherDm] = useState(true);
  const [dmTeacherId, setDmTeacherId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTeachers = useCallback(async () => {
    const res = await fetch('/api/admin/teachers');
    const data = await res.json();
    if (Array.isArray(data)) {
      setTeachers(
        data.map((t: { id: string; name: string; isActive: boolean }) => ({
          id: t.id,
          name: t.name,
          isActive: t.isActive,
        })),
      );
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSendTeacherDm(true);
    setDmTeacherId(assignedTeacherId ?? '');
    void loadTeachers();
  }, [open, assignedTeacherId, loadTeachers]);

  const submit = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        sendTeacherDm,
      };
      if (apiMode === 'site-users') {
        body.statusAction = 'graduate';
      } else {
        body.action = 'graduate';
      }
      if (sendTeacherDm && dmTeacherId) {
        body.dmTeacherId = dmTeacherId;
      }

      const res = await fetch(saveUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '졸업 처리 실패');

      if (data.dm?.sent) {
        toast.success('졸업 처리되었으며 담당 선생님에게 DM을 보냈습니다');
      } else if (sendTeacherDm && data.dm?.skippedReason === 'no_discord_user_id') {
        toast.success('졸업 처리되었습니다 (선생님 Discord ID 미연결로 DM 생략)');
      } else if (sendTeacherDm && data.dm?.skippedReason === 'send_failed') {
        toast.warning('졸업 처리되었으나 DM 발송에 실패했습니다');
      } else {
        toast.success('졸업 처리되었습니다');
      }

      onOpenChange(false);
      onGraduated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '졸업 처리 실패');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>졸업 처리</DialogTitle>
          <DialogDescription>
            「{studentName}」님을 졸업생으로 전환합니다. 담당 선생님에게 Discord DM 알림을 보낼 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={sendTeacherDm}
              onChange={(e) => setSendTeacherDm(e.target.checked)}
            />
            <span>
              담당 선생님에게 졸업 알림 DM 발송
              {assignedTeacherName && (
                <span className="block text-xs text-muted-foreground mt-0.5">
                  기본 담당: {assignedTeacherName}
                </span>
              )}
            </span>
          </label>

          {sendTeacherDm && (
            <div className="space-y-2">
              <Label className="text-sm">DM 수신 선생님</Label>
              <Select
                value={dmTeacherId}
                onChange={(e) => setDmTeacherId(e.target.value)}
              >
                <option value="">선생님 선택</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {!t.isActive ? ' (비활성)' : ''}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                담당 선생님이 없거나 다른 선생님에게 알릴 때 선택하세요.
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              취소
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={loading || (sendTeacherDm && !dmTeacherId)}>
              {loading ? '처리 중…' : '졸업 처리'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
