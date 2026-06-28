'use client';

import { upload } from '@vercel/blob/client';
import {
  buildContentImagePathname,
  isLocalDevHost,
  maxUploadBytes,
  resolveImageMime,
} from '@/lib/contents/upload-shared';

const UPLOAD_URL = '/api/admin/contents/upload';

async function uploadViaServerForm(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(UPLOAD_URL, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '업로드 실패');
  return data.url as string;
}

/** 브라우저 → Vercel Blob 직접 업로드 (권장). 로컬 Blob 미설정 시 FormData 폴백 */
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

  const pathname = buildContentImagePathname(mime);

  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: UPLOAD_URL,
      contentType: mime,
    });
    return blob.url;
  } catch (clientError) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      try {
        return await uploadViaServerForm(file);
      } catch (formError) {
        const msg =
          formError instanceof Error
            ? formError.message
            : clientError instanceof Error
              ? clientError.message
              : '업로드 실패';
        throw new Error(msg);
      }
    }
    throw clientError instanceof Error ? clientError : new Error('업로드 실패');
  }
}
