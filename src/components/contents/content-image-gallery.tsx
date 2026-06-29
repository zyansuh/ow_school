'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isSelfHostedContentImage } from '@/lib/contents/image-url';
import { cn } from '@/lib/utils';

type Props = {
  images: { url: string; sortOrder: number }[];
  title?: string;
};

export function ContentImageGallery({ images, title }: Props) {
  const sorted = images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : Math.min(i + 1, sorted.length - 1)));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, lightboxIndex, sorted.length]);

  if (sorted.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          'grid gap-3 sm:gap-4',
          sorted.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {sorted.map((img, index) => (
          <button
            key={`${img.url}-${index}`}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-border bg-muted/30 aspect-[4/3] w-full',
              sorted.length === 1 && 'sm:aspect-[16/10]',
              index === 0 && sorted.length > 2 && 'sm:col-span-2 sm:aspect-[21/9]',
            )}
          >
            <Image
              src={img.url}
              alt={title ? `${title} 이미지 ${index + 1}` : `이미지 ${index + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-contain bg-black/20 transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized={isSelfHostedContentImage(img.url)}
            />
            <span className="absolute bottom-2 right-2 rounded-lg bg-background/80 backdrop-blur px-2 py-1 text-xs text-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-3.5 w-3.5" /> 확대
            </span>
          </button>
        ))}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-[min(96vw,1200px)] w-full p-0 gap-0 border-border bg-background/95 overflow-hidden">
          {lightboxIndex !== null && (
            <div className="relative flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm text-muted-foreground truncate pr-4">
                  {lightboxIndex + 1} / {sorted.length}
                </p>
                <Button type="button" size="icon" variant="ghost" onClick={close} aria-label="닫기">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative w-full min-h-[50vh] max-h-[80vh] bg-black/40 flex items-center justify-center touch-pan-y">
                <Image
                  src={sorted[lightboxIndex].url}
                  alt=""
                  width={1600}
                  height={1200}
                  className="max-h-[80vh] w-auto h-auto object-contain"
                  sizes="96vw"
                  priority
                  unoptimized={isSelfHostedContentImage(sorted[lightboxIndex].url)}
                />
                {sorted.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      disabled={lightboxIndex <= 0}
                      onClick={() => setLightboxIndex((i) => Math.max((i ?? 0) - 1, 0))}
                      aria-label="이전 이미지"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      disabled={lightboxIndex >= sorted.length - 1}
                      onClick={() => setLightboxIndex((i) => Math.min((i ?? 0) + 1, sorted.length - 1))}
                      aria-label="다음 이미지"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
