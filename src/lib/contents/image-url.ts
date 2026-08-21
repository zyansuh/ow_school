import { z } from 'zod';

/** Next/Image unoptimized — 로컬·DB API 경로 */
export function isSelfHostedContentImage(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('/api/content-images/');
}

/** Blob 절대 URL 또는 DB/로컬 상대 경로 */
export function isAllowedContentImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('https://') || url.startsWith('http://')) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  return isSelfHostedContentImage(url);
}

export const contentImageUrlSchema = z
  .string()
  .min(1)
  .refine(isAllowedContentImageUrl, { message: '유효한 이미지 URL이 아닙니다' });

/** null / 빈 문자열 / 허용 URL */
export const contentThumbnailUrlSchema = z
  .union([contentImageUrlSchema, z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v));
