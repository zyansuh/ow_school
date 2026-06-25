'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <div className="flex items-center gap-3 min-w-0 py-0.5">
        <span className="truncate flex-1 min-w-0">{currentDisplay}</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          onClick={openModal}
          aria-label={`${currentDisplay} 표시 닉네임 수정`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle>표시 닉네임 수정</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Discord 서버 닉을 바꾸지 않습니다. 관리자·사이트 사용자 목록에서 보이는 이름만
              저장합니다. 비우면 서버 닉네임({guildNickname})이 표시됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <p className="text-xs text-muted-foreground font-mono break-all rounded-lg bg-muted/40 px-3 py-2">
              User ID: {userId}
            </p>

            <div className="space-y-3">
              <Label htmlFor={`display-nick-${userId}`} className="mb-0">
                표시 닉네임
              </Label>
              <Input
                id={`display-nick-${userId}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={32}
                placeholder={guildNickname !== '-' ? guildNickname : '표시 이름'}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-[88px]"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto sm:min-w-[88px]"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
