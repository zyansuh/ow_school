import { prisma } from '@/lib/prisma';

const DISCORD_API = 'https://discord.com/api/v10';

export type GuildMemberInfo = {
  isInGuild: boolean;
  serverNick: string | null;
  roleNames: string[];
};

type DiscordMember = {
  nick?: string | null;
  roles: string[];
  user: { id: string; username: string; global_name?: string | null };
};

type DiscordRole = {
  id: string;
  name: string;
  position: number;
};

export function getGuildConfig() {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!guildId || !botToken) return null;
  return { guildId, botToken };
}

function botHeaders(botToken: string) {
  return { Authorization: `Bot ${botToken}` };
}

export async function fetchGuildMember(
  discordUserId: string,
): Promise<DiscordMember | null | 'api_error'> {
  const config = getGuildConfig();
  if (!config) return null;

  const res = await fetch(
    `${DISCORD_API}/guilds/${config.guildId}/members/${discordUserId}`,
    { headers: botHeaders(config.botToken), cache: 'no-store' },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    console.error('[discord] fetchGuildMember failed:', res.status, text);
    return 'api_error';
  }

  return res.json() as Promise<DiscordMember>;
}

async function fetchGuildRoles(): Promise<DiscordRole[]> {
  const config = getGuildConfig();
  if (!config) return [];

  const res = await fetch(`${DISCORD_API}/guilds/${config.guildId}/roles`, {
    headers: botHeaders(config.botToken),
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];
  return res.json() as Promise<DiscordRole[]>;
}

function resolveRoleNames(memberRoles: string[], guildRoles: DiscordRole[]) {
  const byId = Object.fromEntries(guildRoles.map((r) => [r.id, r]));
  return memberRoles
    .map((id) => byId[id])
    .filter((r): r is DiscordRole => !!r && r.name !== '@everyone')
    .sort((a, b) => b.position - a.position)
    .map((r) => r.name);
}

export async function getGuildMemberInfo(discordUserId: string): Promise<GuildMemberInfo> {
  const member = await fetchGuildMember(discordUserId);
  if (!member || member === 'api_error') {
    return { isInGuild: false, serverNick: null, roleNames: [] };
  }

  const roles = await fetchGuildRoles();
  const roleNames = resolveRoleNames(member.roles, roles);
  const serverNick = member.nick ?? member.user.global_name ?? member.user.username;

  return { isInGuild: true, serverNick, roleNames };
}

export async function syncUserGuildData(discordUserId: string) {
  const info = await getGuildMemberInfo(discordUserId);
  await prisma.user.update({
    where: { discordId: discordUserId },
    data: {
      isInGuild: info.isInGuild,
      discordServerNick: info.serverNick,
      discordRoleNames: JSON.stringify(info.roleNames),
    },
  });
  return info;
}

export async function updateGuildNickname(discordUserId: string, nick: string | null) {
  const config = getGuildConfig();
  if (!config) throw new Error('DISCORD_NOT_CONFIGURED');

  const member = await fetchGuildMember(discordUserId);
  if (!member || member === 'api_error') throw new Error('NOT_IN_GUILD');

  const res = await fetch(
    `${DISCORD_API}/guilds/${config.guildId}/members/${discordUserId}`,
    {
      method: 'PATCH',
      headers: {
        ...botHeaders(config.botToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nick }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('[discord] updateGuildNickname failed:', res.status, text);
    if (res.status === 403) throw new Error('BOT_PERMISSION_DENIED');
    throw new Error('NICK_UPDATE_FAILED');
  }

  return syncUserGuildData(discordUserId);
}

export function parseRoleNames(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
