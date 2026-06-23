import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { put } from '@vercel/blob';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

export function validateTeacherAvatarFile(file: File) {
  if (!file.type || !ALLOWED_TYPES.has(file.type)) {
    throw new Error('INVALID_TYPE');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
}

export async function saveTeacherAvatar(file: File): Promise<string> {
  validateTeacherAvatarFile(file);

  const input = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(input)
    .rotate()
    .resize(512, 512, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const filename = `${randomUUID()}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`teachers/${filename}`, optimized, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error('BLOB_NOT_CONFIGURED');
  }

  const dir = path.join(process.cwd(), 'public/uploads/teachers');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), optimized);
  return `/uploads/teachers/${filename}`;
}
