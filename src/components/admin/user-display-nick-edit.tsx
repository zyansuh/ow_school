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
  userId: string;
  /** PATCH URL — displayNickname만 전송 */
  saveUrl: string;
  currentDisplay: string;
  displayNickname: string | null;
  guildNickname: string;
  onSaved: () => void;
};

export function UserDisplayNickEdit({
  userId,
  saveUrl,
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
      const res = await fetch(saveUrl, {
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
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate">{currentDisplay}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 shrink-0"
          onClick={openModal}
          aria-label={`${currentDisplay} 표시 닉네임 수정`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>표시 닉네임 수정</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Discord 서버 닉을 바꾸지 않습니다. 관리자·사이트 사용자 목록에서 보이는 이름만
            저장합니다. 비우면 서버 닉네임({guildNickname})이 표시됩니다.
          </p>
          <p className="text-xs text-muted-foreground font-mono">User ID: {userId}</p>
          <div className="space-y-2">
            <Label htmlFor={`display-nick-${userId}`}>표시 닉네임</Label>
            <Input
              id={`display-nick-${userId}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={32}
              placeholder={guildNickname !== '-' ? guildNickname : '표시 이름'}
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
