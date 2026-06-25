/**
 * NEXTAUTH_URL이 Vercel Production에서 localhost로 잘못 설정된 경우 배포 URL로 보정.
 * Discord OAuth redirect_uri는 이 값에 따라 결정됩니다.
 */
export function resolveAuthUrl(): string {
  const configured = (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? '').trim();

  if (process.env.VERCEL) {
    const isLocalhost =
      !configured ||
      configured.includes('localhost') ||
      configured.includes('127.0.0.1');

    if (isLocalhost) {
      const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
      if (production) return `https://${production.replace(/^https?:\/\//, '')}`;

      const preview = process.env.VERCEL_URL?.trim();
      if (preview) return `https://${preview.replace(/^https?:\/\//, '')}`;
    }
  }

  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export function ensureAuthUrlEnv(): string {
  const url = resolveAuthUrl();
  process.env.NEXTAUTH_URL = url;
  process.env.AUTH_URL = url;
  return url;
}
