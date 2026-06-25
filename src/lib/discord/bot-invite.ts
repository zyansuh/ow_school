/** Discord 봇 권한 — 닉네임 변경·멤버 조회에 필요 */
export const DISCORD_BOT_INVITE_PERMISSIONS = 268_435_456; // Manage Nicknames

export function buildDiscordBotInviteUrl(options: {
  clientId: string;
  guildId?: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId.trim(),
    scope: 'bot',
    permissions: String(DISCORD_BOT_INVITE_PERMISSIONS),
  });

  const guildId = options.guildId?.trim();
  if (guildId) {
    params.set('guild_id', guildId);
    params.set('disable_guild_select', 'true');
  }

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
