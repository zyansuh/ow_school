'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageIcon, ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DEFAULT_TEACHER_PROFILE_IMAGE,
  TEACHER_AVATAR_ACCEPT,
  TEACHER_AVATAR_MAX_BYTES,
  TEACHER_AVATAR_MIME_TYPES,
} from '@/lib/teacher-avatar-constants';

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

function validateClientFile(file: File): string | null {
  const type = file.type?.toLowerCase().split(';')[0]?.trim();
  const ext = file.name.split('.').pop()?.toLowerCase();
  const extOk = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  if (!type && !extOk) return 'JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.';
  if (type && !TEACHER_AVATAR_MIME_TYPES.has(type) && !extOk) {
    return 'JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.';
  }
  if (file.size > TEACHER_AVATAR_MAX_BYTES) {
    return `이미지는 ${TEACHER_AVATAR_MAX_BYTES / (1024 * 1024)}MB 이하만 업로드할 수 있습니다.`;
  }
  if (file.size === 0) return '빈 파일은 업로드할 수 없습니다.';
  return null;
}

export function ProfileImageField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateClientFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setUploading(true);

      try {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/admin/upload/teacher-avatar', {
          method: 'POST',
          body,
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다');
        onChange(data.url as string);
        toast.success('프로필 사진이 업로드되었습니다');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다');
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
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
    if (file) void uploadFile(file);
  };

  const previewSrc = localPreview || value || null;

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
            <div className="flex flex-col xs:flex-row gap-2 justify-center flex-wrap">
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
                onClick={() => onChange(DEFAULT_TEACHER_PROFILE_IMAGE)}
              >
                <ImageIcon className="h-4 w-4" />
                기본 이미지
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
              JPG · PNG · WEBP · 최대 4MB · 휴대폰 카메라/앨범 지원
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={TEACHER_AVATAR_ACCEPT}
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
