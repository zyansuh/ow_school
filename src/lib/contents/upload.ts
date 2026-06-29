import { list, put, BlobError } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
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

function getBlobReadWriteToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || !token.startsWith('vercel_blob_rw_')) return null;
  return token;
}

/** 관리자 진단 — list 1건으로 토큰·Store 연결 확인 */
export async function probeBlobConnection(): Promise<{ ok: boolean; error?: string }> {
  const token = getBlobReadWriteToken();
  if (!token) {
    return {
      ok: false,
      error:
        'BLOB_READ_WRITE_TOKEN 없음 — DB 저장소로 자동 전환됩니다. Blob 사용 시 Storage → Connect Project 후 Redeploy.',
    };
  }
  try {
    await list({ limit: 1, token });
    return { ok: true };
  } catch (e) {
    const detail = e instanceof BlobError ? e.message : e instanceof Error ? e.message : 'unknown';
    return { ok: false, error: detail };
  }
}

export async function getBlobStorageStatusWithProbe() {
  const token = getBlobReadWriteToken();
  const probe = await probeBlobConnection();
  return {
    vercel: isVercelDeployment(),
    hasReadWriteToken: !!token,
    hasOidcToken: !!process.env.VERCEL_OIDC_TOKEN?.trim(),
    hasStoreId: !!process.env.BLOB_STORE_ID?.trim(),
    configured: isContentBlobConfigured(),
    uploadMode: 'server' as const,
    storageFallback: isVercelDeployment() && !probe.ok ? 'database' : probe.ok ? 'blob' : 'local-or-database',
    maxBytes: maxUploadBytes(),
    probe,
    ready: probe.ok || isVercelDeployment(),
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

async function uploadContentImageDatabase(file: File, mime: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const row = await prisma.contentUploadedFile.create({
    data: {
      mimeType: mime,
      data: buffer,
      size: buffer.length,
    },
  });
  return `/api/content-images/${row.id}`;
}

async function uploadContentImageBlob(file: File, mime: string): Promise<string> {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_NOT_CONFIGURED');

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

  if (isContentBlobConfigured()) {
    try {
      return await uploadContentImageBlob(file, mime);
    } catch (e) {
      console.warn('[contents/upload] Vercel Blob failed, using database storage:', e);
    }
  }

  if (isVercelDeployment()) {
    return uploadContentImageDatabase(file, mime);
  }

  return uploadContentImageLocal(file, mime);
}

export function mapUploadErrorMessage(error: unknown): { status: number; message: string } | null {
  if (!(error instanceof Error)) return null;

  switch (error.message) {
    case 'INVALID_IMAGE_TYPE':
      return { status: 400, message: 'JPEG·PNG·WebP·GIF만 업로드할 수 있습니다' };
    case 'IMAGE_TOO_LARGE':
      return { status: 400, message: '이미지는 8MB 이하여야 합니다' };
    case 'IMAGE_TOO_LARGE_VERCEL':
      return {
        status: 400,
        message: 'Vercel 배포 환경에서는 이미지가 4MB 이하여야 합니다',
      };
    default:
      break;
  }

  if (error instanceof BlobError) {
    const detail = error.message?.trim();
    return {
      status: 503,
      message: detail ? `Vercel Blob 업로드 실패: ${detail}` : 'Vercel Blob 업로드에 실패했습니다.',
    };
  }

  return null;
}
