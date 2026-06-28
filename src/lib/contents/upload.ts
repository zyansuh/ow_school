import { list, put, BlobError } from '@vercel/blob';
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

function getBlobReadWriteToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error('BLOB_NOT_CONFIGURED');
  }
  if (!token.startsWith('vercel_blob_rw_')) {
    throw new Error('BLOB_TOKEN_INVALID');
  }
  return token;
}

/** 관리자 진단 — list 1건으로 토큰·Store 연결 확인 */
export async function probeBlobConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getBlobReadWriteToken();
    await list({ limit: 1, token });
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === 'BLOB_NOT_CONFIGURED') {
      return {
        ok: false,
        error:
          'BLOB_READ_WRITE_TOKEN 환경 변수가 없습니다. Vercel → Storage → Blob → Connect Project 후 재배포하세요.',
      };
    }
    if (e instanceof Error && e.message === 'BLOB_TOKEN_INVALID') {
      return {
        ok: false,
        error: 'BLOB_READ_WRITE_TOKEN 형식이 올바르지 않습니다. Storage에서 Store를 다시 연결하세요.',
      };
    }
    const detail = e instanceof BlobError ? e.message : e instanceof Error ? e.message : 'unknown';
    return { ok: false, error: detail };
  }
}

export async function getBlobStorageStatusWithProbe() {
  const base = {
    vercel: isVercelDeployment(),
    hasReadWriteToken: !!process.env.BLOB_READ_WRITE_TOKEN?.trim(),
    hasOidcToken: !!process.env.VERCEL_OIDC_TOKEN?.trim(),
    hasStoreId: !!process.env.BLOB_STORE_ID?.trim(),
    configured: isContentBlobConfigured(),
    uploadMode: 'server' as const,
    maxBytes: maxUploadBytes(),
  };
  const probe = await probeBlobConnection();
  return {
    ...base,
    probe,
    ready: probe.ok,
  };
}

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
  const token = getBlobReadWriteToken();
  const pathname = buildContentImagePathname(mime);
  const body = Buffer.from(await file.arrayBuffer());

  const blob = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mime,
    token,
  });

  return blob.url;
}

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
          'BLOB_READ_WRITE_TOKEN이 없습니다. Vercel 대시보드 → ow-school → Storage → Blob Store → Connect Project → Redeploy 후 다시 시도하세요.',
      };
    case 'BLOB_TOKEN_INVALID':
      return {
        status: 503,
        message:
          'BLOB_READ_WRITE_TOKEN이 유효하지 않습니다. Storage에서 Blob Store 연결을 해제 후 다시 Connect하고 재배포하세요.',
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
        : 'Vercel Blob 업로드에 실패했습니다. GET /api/admin/contents/upload 에서 probe.ok 확인 후 Storage 연결을 점검하세요.',
    };
  }

  return null;
}
