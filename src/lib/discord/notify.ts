import { getGuildConfig } from '@/lib/discord/guild';

const DISCORD_API = 'https://discord.com/api/v10';

function botHeaders(token: string) {
  return { Authorization: `Bot ${token}` };
}

export async function sendDiscordWebhook(content: string, embeds?: object[]) {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) {
    console.warn('[discord-notify] DISCORD_WEBHOOK_URL not set');
    return false;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, embeds }),
  });

  if (!res.ok) {
    console.error('[discord-notify] webhook failed:', res.status, await res.text());
    return false;
  }
  return true;
}

/** Bot DM — 실패해도 호출자 트랜잭션에 영향 없음 */
export async function sendDiscordDirectMessage(discordUserId: string, content: string) {
  const config = getGuildConfig();
  if (!config?.botToken) {
    console.warn('[discord-notify] bot token not configured for DM');
    return false;
  }

  const dmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers: { ...botHeaders(config.botToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: discordUserId }),
  });

  if (!dmRes.ok) {
    console.error('[discord-notify] create DM channel failed:', dmRes.status);
    return false;
  }

  const channel = (await dmRes.json()) as { id: string };
  const msgRes = await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
    method: 'POST',
    headers: { ...botHeaders(config.botToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!msgRes.ok) {
    console.error('[discord-notify] send DM failed:', msgRes.status);
    return false;
  }
  return true;
}
