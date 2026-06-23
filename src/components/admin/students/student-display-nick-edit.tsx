'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  studentId: string;
  currentDisplay: string;
  displayNickname: string | null;
  guildNickname: string;
  onSaved: () => void;
};

export function StudentDisplayNickEdit({
  studentId,
  currentDisplay,
  displayNickname,
  guildNickname,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(displayNickname ?? '');
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    setValue(displayNickname ?? '');
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayNickname: value.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      toast.success('표시 닉네임이 저장되었습니다');
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span>{currentDisplay}</span>
        <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={openModal}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>표시 닉네임 수정</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500">
            Discord 서버 닉을 바꾸지 않습니다. 관리자 화면에서만 보이는 이름입니다.
            비우면 길드 닉네임({guildNickname})이 표시됩니다.
          </p>
          <div className="space-y-2">
            <Label htmlFor="display-nick">표시 닉네임</Label>
            <Input
              id="display-nick"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={32}
              placeholder={guildNickname}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
