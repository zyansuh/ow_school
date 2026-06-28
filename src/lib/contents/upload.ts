import { put, BlobError } from '@vercel/blob';
import {
  buildContentImagePathname,
  isContentBlobConfigured,
  isVercelDeployment,
  maxUploadBytes,
  resolveImageMime,
} from '@/lib/contents/upload-shared';

export {
  blobStorageStatus,
  buildContentImagePathname,
  isContentBlobConfigured,
  isVercelDeployment,
  maxUploadBytes,
  resolveImageMime,
} from '@/lib/contents/upload-shared';

async function uploadContentImageLocal(file: File, mime: string): Promise<string> {
  const { mkdir, writeFile } = await import('fs/promises');
  const path = await import('path');
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const dir = path.join(process.cwd(), 'public', 'uploads', 'contents');
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/contents/${name}`;
}

async function uploadContentImageBlob(file: File, mime: string): Promise<string> {
  const pathname = buildContentImagePathname(mime);
  const body = Buffer.from(await file.arrayBuffer());
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  const blob = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mime,
    ...(token ? { token } : {}),
  });

  return blob.url;
}

/** 로컬 개발용 — FormData 서버 업로드 */
export async function uploadContentImageServer(file: File): Promise<string> {
  const mime = resolveImageMime(file);
  if (!mime) {
    throw new Error('INVALID_IMAGE_TYPE');
  }

  const limit = maxUploadBytes();
  if (file.size > limit) {
    throw new Error(isVercelDeployment() ? 'IMAGE_TOO_LARGE_VERCEL' : 'IMAGE_TOO_LARGE');
  }

  if (isVercelDeployment() || isContentBlobConfigured()) {
    return uploadContentImageBlob(file, mime);
  }

  return uploadContentImageLocal(file, mime);
}

export function mapUploadErrorMessage(error: unknown): { status: number; message: string } | null {
  if (!(error instanceof Error)) return null;

  switch (error.message) {
    case 'INVALID_IMAGE_TYPE':
      return { status: 400, message: 'JPEG·PNG·WebP·GIF만 업로드할 수 있습니다' };
    case 'INVALID_PATH':
      return { status: 400, message: '허용되지 않은 업로드 경로입니다' };
    case 'UNAUTHORIZED':
      return { status: 401, message: '로그인이 필요합니다' };
    case 'FORBIDDEN':
      return { status: 403, message: '관리자만 업로드할 수 있습니다' };
    case 'IMAGE_TOO_LARGE':
      return { status: 400, message: '이미지는 8MB 이하여야 합니다' };
    case 'IMAGE_TOO_LARGE_VERCEL':
      return {
        status: 400,
        message: 'Vercel 배포 환경에서는 이미지가 4MB 이하여야 합니다',
      };
    case 'BLOB_NOT_CONFIGURED':
      return {
        status: 503,
        message:
          'Vercel Blob이 연결되지 않았습니다. Vercel 대시보드 → Storage → Blob Store → Connect Project 후 재배포하세요.',
      };
    default:
      break;
  }

  if (error instanceof BlobError) {
    const detail = error.message?.trim();
    return {
      status: 503,
      message: detail
        ? `Vercel Blob 업로드 실패: ${detail}`
        : 'Vercel Blob 업로드에 실패했습니다. Storage에서 Blob Store가 이 프로젝트에 연결되어 있는지 확인하세요.',
    };
  }

  return null;
}
