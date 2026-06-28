'use client';

import {
  isLocalDevHost,
  maxUploadBytes,
  resolveImageMime,
} from '@/lib/contents/upload-shared';

const UPLOAD_URL = '/api/admin/contents/upload';

/** 같은 출처 API → 서버에서 Vercel Blob put (CORS 없음) */
export async function uploadContentImageFile(file: File): Promise<string> {
  const mime = resolveImageMime(file);
  if (!mime) {
    throw new Error('JPEG·PNG·WebP·GIF만 업로드할 수 있습니다');
  }

  const limit = maxUploadBytes({ productionHost: !isLocalDevHost() });
  if (file.size > limit) {
    throw new Error(
      limit <= 4 * 1024 * 1024
        ? 'Vercel 배포 환경에서는 이미지가 4MB 이하여야 합니다'
        : '이미지는 8MB 이하여야 합니다',
    );
  }

  const form = new FormData();
  form.append('file', file);
  const res = await fetch(UPLOAD_URL, { method: 'POST', body: form, credentials: 'same-origin' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '업로드 실패');
  return data.url as string;
}
