/** Vercel·.env 붙여넣기 시 따옴표·공백 제거 */
export function normalizeEnvValue(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^["']|["']$/g, '');
}

export function getDiscordClientId(): string {
  return normalizeEnvValue(process.env.DISCORD_CLIENT_ID);
}

export function getDiscordClientSecret(): string {
  return normalizeEnvValue(process.env.DISCORD_CLIENT_SECRET);
}

/** Bot 토큰 첫 세그먼트 = Application (Client) ID */
export function discordApplicationIdFromBotToken(botToken: string): string | null {
  const segment = normalizeEnvValue(botToken).split('.')[0];
  if (!segment) return null;
  try {
    const id = Buffer.from(segment, 'base64').toString('utf8');
    return /^\d{17,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export type DiscordOAuthCredentialCheck =
  | { status: 'missing' }
  | { status: 'invalid_client' }
  | { status: 'likely_valid'; hint: string };

/**
 * Client ID·Secret 조합 검증.
 * invalid_grant → 자격 증명은 맞고 code만 틀림, invalid_client → ID/Secret 불일치.
 */
export async function checkDiscordOAuthCredentials(
  redirectUri: string,
): Promise<DiscordOAuthCredentialCheck> {
  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  if (!clientId || !clientSecret) return { status: 'missing' };

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: 'ow_school_credential_probe',
    redirect_uri: redirectUri,
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body,
  });

  let payload: { error?: string } = {};
  try {
    payload = (await res.json()) as { error?: string };
  } catch {
    return { status: 'invalid_client' };
  }

  if (payload.error === 'invalid_client') return { status: 'invalid_client' };
  if (payload.error === 'invalid_grant' || payload.error === 'invalid_request') {
    return {
      status: 'likely_valid',
      hint: 'Client ID·Secret 조합은 Discord가 수락합니다. Redirect URI 등록을 확인하세요.',
    };
  }

  return {
    status: 'likely_valid',
    hint: `Discord 응답: ${payload.error ?? res.status}`,
  };
}
