export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const VERCEL_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const MIME_BY_EXT: Record<string, string> = {
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

export function isContentBlobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return !!token && token.startsWith('vercel_blob_rw_');
}

export function maxUploadBytes(options?: { productionHost?: boolean }): number {
  if (isVercelDeployment() || options?.productionHost) {
    return VERCEL_MAX_UPLOAD_BYTES;
  }
  return MAX_UPLOAD_BYTES;
}

export function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function resolveImageMime(file: Pick<File, 'type' | 'name'>): string | null {
  if (file.type && ALLOWED_IMAGE_TYPES.has(file.type)) return file.type;
  const ext = extensionFromName(file.name);
  return ext ? MIME_BY_EXT[ext] : null;
}

export function buildContentImagePathname(mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? 'jpg';
  return `contents/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

export function blobStorageStatus() {
  return {
    vercel: isVercelDeployment(),
    hasReadWriteToken: !!process.env.BLOB_READ_WRITE_TOKEN?.trim(),
    hasOidcToken: !!process.env.VERCEL_OIDC_TOKEN?.trim(),
    hasStoreId: !!process.env.BLOB_STORE_ID?.trim(),
    configured: isContentBlobConfigured(),
    uploadMode: 'server' as const,
    maxBytes: maxUploadBytes(),
  };
}
