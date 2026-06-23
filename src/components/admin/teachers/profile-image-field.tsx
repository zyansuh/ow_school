'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function ProfileImageField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/admin/upload/teacher-avatar', {
          method: 'POST',
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '업로드 실패');
        onChange(data.url as string);
        toast.success('프로필 사진이 업로드되었습니다');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '업로드 실패');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onChange],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) void uploadFile(file);
  };

  const previewSrc = value || null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
        <div
          className={cn(
            'relative h-24 w-24 shrink-0 rounded-2xl border border-border bg-muted/40 overflow-hidden',
            !previewSrc && 'flex items-center justify-center',
          )}
        >
          {previewSrc ? (
            // 업로드 직후 로컬·Blob URL 모두 미리보기
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="프로필 미리보기" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground/50" aria-hidden />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled && !uploading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'rounded-xl border-2 border-dashed p-4 text-center transition-colors',
              dragOver ? 'border-primary/50 bg-primary/5' : 'border-border bg-surface/30',
              (disabled || uploading) && 'opacity-60 pointer-events-none',
            )}
          >
            <p className="text-sm text-muted-foreground mb-3">
              갤러리에서 선택하거나 사진을 끌어다 놓으세요
            </p>
            <div className="flex flex-col xs:flex-row gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                사진 선택
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11"
                disabled={disabled || uploading}
                onClick={() => setShowUrl((v) => !v)}
              >
                <Link2 className="h-4 w-4" />
                URL 입력
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11 text-danger hover:text-danger"
                  disabled={disabled || uploading}
                  onClick={() => onChange('')}
                >
                  <Trash2 className="h-4 w-4" />
                  제거
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              JPG · PNG · WebP · 최대 5MB · 휴대폰 카메라/앨범 지원
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={onFileChange}
          />

          {showUrl && (
            <div className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://... 또는 /uploads/..."
                disabled={disabled || uploading}
                className="text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {value && !showUrl && (
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Upload className="h-3 w-3 shrink-0" />
          {value}
        </p>
      )}
    </div>
  );
}
