import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import {
  TEACHER_AVATAR_MAX_BYTES,
  TEACHER_AVATAR_MIME_TYPES,
} from '@/lib/teacher-avatar-constants';

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function detectImageMime(file: File): string | null {
  const type = file.type?.toLowerCase().split(';')[0]?.trim();
  if (type && TEACHER_AVATAR_MIME_TYPES.has(type)) return type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  const fromExt = EXT_TO_MIME[ext];
  return fromExt && TEACHER_AVATAR_MIME_TYPES.has(fromExt) ? fromExt : null;
}

export function validateTeacherAvatarFile(file: File) {
  if (!detectImageMime(file)) {
    throw new Error('INVALID_TYPE');
  }
  if (file.size > TEACHER_AVATAR_MAX_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  if (file.size === 0) {
    throw new Error('EMPTY_FILE');
  }
}

export async function saveTeacherAvatar(file: File): Promise<string> {
  validateTeacherAvatarFile(file);

  const input = Buffer.from(await file.arrayBuffer());
  let optimized: Buffer;
  try {
    optimized = await sharp(input)
      .rotate()
      .resize(512, 512, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new Error('IMAGE_PROCESS_FAILED');
  }

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
