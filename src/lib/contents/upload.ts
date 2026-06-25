import { put } from '@vercel/blob';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadContentImage(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_NOT_CONFIGURED');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('INVALID_IMAGE_TYPE');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const blob = await put(`contents/${Date.now()}-${crypto.randomUUID()}.${ext}`, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  return blob.url;
}
