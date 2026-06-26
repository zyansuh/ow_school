import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
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

/** 브라우저·OS에 따라 file.type이 비어 있을 수 있어 확장자로 보조 판별 */
export function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = extensionFromName(file.name);
  return ext ? MIME_BY_EXT[ext] : null;
}

async function uploadContentImageLocal(file: File, mime: string): Promise<string> {
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
  const blob = await put(`contents/${Date.now()}-${crypto.randomUUID()}.${ext}`, file, {
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
  if (file.size > MAX_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return uploadContentImageBlob(file, mime);
  }

  return uploadContentImageLocal(file, mime);
}
