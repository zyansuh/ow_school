import { put, BlobError } from '@vercel/blob';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
/** Vercel Serverless 요청 본문 한도(약 4.5MB) — 프로덕션에서는 이보다 작게 제한 */
const VERCEL_MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function extensionFromName(name: string): string | null {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext && MIME_BY_EXT[ext] ? ext : null;
}

export function isVercelDeployment(): boolean {
  return process.env.VERCEL === '1';
}

/** Vercel Blob 토큰 또는 OIDC + Store ID */
export function isContentBlobConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  if (process.env.VERCEL_OIDC_TOKEN?.trim() && process.env.BLOB_STORE_ID?.trim()) return true;
  return false;
}

export function maxUploadBytes(): number {
  return isVercelDeployment() ? VERCEL_MAX_BYTES : MAX_BYTES;
}

/** 브라우저·OS에 따라 file.type이 비어 있을 수 있어 확장자로 보조 판별 */
export function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = extensionFromName(file.name);
  return ext ? MIME_BY_EXT[ext] : null;
}

async function uploadContentImageLocal(file: File, mime: string): Promise<string> {
  const { mkdir, writeFile } = await import('fs/promises');
  const path = await import('path');
  const ext = EXT_BY_MIME[mime] ?? 'jpg';
  const dir = path.join(process.cwd(), 'public', 'uploads', 'contents');
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/contents/${name}`;
}

async function uploadContentImageBlob(file: File, mime: string): Promise<string> {
  const ext = EXT_BY_MIME[mime] ?? 'jpg';
  const pathname = `contents/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  const blob = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mime,
  });

  return blob.url;
}

export async function uploadContentImage(file: File): Promise<string> {
  const mime = resolveImageMime(file);
  if (!mime) {
    throw new Error('INVALID_IMAGE_TYPE');
  }

  const limit = maxUploadBytes();
  if (file.size > limit) {
    throw new Error(isVercelDeployment() ? 'IMAGE_TOO_LARGE_VERCEL' : 'IMAGE_TOO_LARGE');
  }

  // Vercel Serverless는 파일시스템 쓰기 불가 — Blob SDK(OIDC/토큰 자동) 사용
  if (isVercelDeployment()) {
    return uploadContentImageBlob(file, mime);
  }

  if (isContentBlobConfigured()) {
    return uploadContentImageBlob(file, mime);
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
    case 'BLOB_NOT_CONFIGURED':
      return {
        status: 503,
        message:
          'Vercel Blob이 연결되지 않았습니다. Vercel 대시보드 → Storage → Blob → 프로젝트 연결 후 재배포하세요.',
      };
    default:
      break;
  }

  if (error instanceof BlobError) {
    return {
      status: 503,
      message:
        'Vercel Blob 업로드에 실패했습니다. Storage에서 Blob Store가 이 프로젝트에 연결되어 있는지 확인하세요.',
    };
  }

  return null;
}
