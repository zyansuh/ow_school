'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadContentImageFile } from '@/hooks/admin/use-admin-contents';
import { toast } from 'sonner';

type ImageItem = { url: string; sortOrder: number };

type Props = {
  images: ImageItem[];
  thumbnailUrl: string;
  onChange: (images: ImageItem[], thumbnailUrl: string) => void;
  disabled?: boolean;
};

export function ContentImageUploader({ images, thumbnailUrl, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = images.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(
      next.map((img, i) => ({ ...img, sortOrder: i })),
      thumbnailUrl,
    );
  };

  const removeAt = (index: number) => {
    const removed = images[index];
    const next = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
    const nextThumb = thumbnailUrl === removed?.url ? (next[0]?.url ?? '') : thumbnailUrl;
    onChange(next, nextThumb);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    setUploading(true);
    try {
      const uploaded: ImageItem[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadContentImageFile(file);
        uploaded.push({ url, sortOrder: images.length + uploaded.length });
      }
      const next = [...images, ...uploaded].map((img, i) => ({ ...img, sortOrder: i }));
      const nextThumb = thumbnailUrl || next[0]?.url || '';
      onChange(next, nextThumb);
      toast.success(`${uploaded.length}장 업로드됨`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer transition-colors',
          disabled || uploading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40 hover:bg-accent/30',
        )}
      >
        <ImagePlus className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {uploading ? '업로드 중…' : '클릭하여 이미지 추가 (여러 장 선택 가능)'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      {images.length > 0 && (
        <ul className="space-y-3">
          {images.map((img, index) => (
            <li
              key={img.url}
              className="flex gap-3 items-center rounded-xl border border-border p-3 bg-card/50"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={img.url} alt="" fill className="object-cover" sizes="96px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{index + 1}번째 이미지</p>
                {thumbnailUrl === img.url && (
                  <span className="text-xs text-primary font-medium">썸네일</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={disabled}
                  onClick={() => onChange(images, img.url)}
                  title="썸네일로 설정"
                >
                  <Star className={cn('h-4 w-4', thumbnailUrl === img.url && 'fill-primary text-primary')} />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={disabled || index === 0}
                  onClick={() => reorder(index, index - 1)}
                  title="위로"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={disabled || index === images.length - 1}
                  onClick={() => reorder(index, index + 1)}
                  title="아래로"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-danger"
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
