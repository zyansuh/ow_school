'use client';

import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContentImageUploader } from '@/components/admin/contents/content-image-uploader';
import type { ContentFormState } from '@/hooks/admin/use-admin-contents';

type Props = {
  open: boolean;
  editing: string | null;
  form: ContentFormState;
  saving: boolean;
  onChange: (form: ContentFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

export function ContentFormDialog({
  open,
  editing,
  form,
  saving,
  onChange,
  onSubmit,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{editing ? '컨텐츠 수정' : '새 컨텐츠 등록'}</DialogTitle>
          <DialogDescription>
            제목·본문·이미지를 등록합니다. 이미지 순서는 위/아래 버튼으로 변경할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label>제목 *</Label>
            <Input
              required
              value={form.title}
              maxLength={200}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              className="break-words"
            />
          </div>

          <div className="space-y-2">
            <Label>요약 (카드용, 선택)</Label>
            <Input
              value={form.summary}
              maxLength={300}
              placeholder="비우면 본문 앞부분이 요약으로 표시됩니다"
              onChange={(e) => onChange({ ...form, summary: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>본문</Label>
            <Textarea
              value={form.body}
              onChange={(e) => onChange({ ...form, body: e.target.value })}
              className="min-h-[140px] break-words [overflow-wrap:anywhere]"
              placeholder="컨텐츠 소개 글을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label>이미지</Label>
            <ContentImageUploader
              images={form.images}
              thumbnailUrl={form.thumbnailUrl}
              disabled={saving}
              onChange={(images, thumbnailUrl) => onChange({ ...form, images, thumbnailUrl })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => onChange({ ...form, published: e.target.checked })}
            />
            공개 (체크 해제 시 목록에 표시되지 않음)
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
