import { prisma } from '@/lib/prisma';

const DISCORD_API = 'https://discord.com/api/v10';

export type GuildMemberInfo = {
  isInGuild: boolean;
  /** Guild Member API nick 필드만 (없으면 null) */
  guildNickname: string | null;
  globalDisplayName: string | null;
  username: string;
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

/** 로그인 게이트를 통과한 사용자는 길드 가입으로 간주 */
export function resolveMembershipForSession(dbIsInGuild: boolean): boolean {
  return getGuildConfig() ? true : dbIsInGuild;
}

export async function isUserInGuildViaOAuth(
  accessToken: string,
  guildId: string,
): Promise<boolean | null> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn('[discord] users/@me/guilds failed:', res.status, await res.text());
    return null;
  }

  const guilds = (await res.json()) as { id: string }[];
  return guilds.some((g) => g.id === guildId);
}

export async function isBotInGuild(): Promise<boolean> {
  const config = getGuildConfig();
  if (!config) return false;

  const res = await fetch(`${DISCORD_API}/guilds/${config.guildId}`, {
    headers: botHeaders(config.botToken),
    cache: 'no-store',
  });
  return res.ok;
}

export async function checkUserGuildMembership(
  discordUserId: string,
  accessToken?: string | null,
): Promise<'in' | 'out' | 'unknown'> {
  const config = getGuildConfig();
  if (!config) return 'in';

  if (accessToken) {
    const viaOAuth = await isUserInGuildViaOAuth(accessToken, config.guildId);
    if (viaOAuth === true) return 'in';
    if (viaOAuth === false) return 'out';
  }

  const member = await fetchGuildMember(discordUserId);
  if (member === 'api_error') {
    const botInGuild = await isBotInGuild();
    if (!botInGuild) {
      console.warn(
        '[discord] bot is not in guild or DISCORD_GUILD_ID is wrong — invite bot to server',
      );
    }
    return 'unknown';
  }
  return member ? 'in' : 'out';
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

let guildRolesCache: { roles: DiscordRole[]; expiresAt: number } | null = null;

async function fetchGuildRoles(): Promise<DiscordRole[]> {
  const config = getGuildConfig();
  if (!config) return [];

  const now = Date.now();
  if (guildRolesCache && guildRolesCache.expiresAt > now) {
    return guildRolesCache.roles;
  }

  const res = await fetch(`${DISCORD_API}/guilds/${config.guildId}/roles`, {
    headers: botHeaders(config.botToken),
    cache: 'no-store',
  });

  if (!res.ok) return guildRolesCache?.roles ?? [];
  const roles = (await res.json()) as DiscordRole[];
  guildRolesCache = { roles, expiresAt: now + 5 * 60 * 1000 };
  return roles;
}

function resolveRoleNames(memberRoles: string[], guildRoles: DiscordRole[]) {
  const byId = Object.fromEntries(guildRoles.map((r) => [r.id, r]));
  return memberRoles
    .map((id) => byId[id])
    .filter((r): r is DiscordRole => !!r && r.name !== '@everyone')
    .sort((a, b) => b.position - a.position)
    .map((r) => r.name);
}

/** Guild Member API nick 필드만 반환 (서버 전용 닉네임) */
export function extractGuildNickname(member: { nick?: string | null }): string | null {
  const nick = member.nick?.trim();
  return nick || null;
}

export function extractGlobalDisplayName(member: {
  user: { global_name?: string | null };
}): string | null {
  const name = member.user.global_name?.trim();
  return name || null;
}

/** 화면 표시용: 서버 닉 → 글로벌 → 유저네임 */
export function resolveMemberDisplayName(member: {
  nick?: string | null;
  user: { username: string; global_name?: string | null };
}): string {
  return extractGuildNickname(member) ?? extractGlobalDisplayName(member) ?? member.user.username;
}

function memberToGuildInfo(member: DiscordMember, roleNames: string[]): GuildMemberInfo {
  return {
    isInGuild: true,
    guildNickname: extractGuildNickname(member),
    globalDisplayName: extractGlobalDisplayName(member),
    username: member.user.username,
    roleNames,
  };
}

export async function fetchSelfGuildMemberViaOAuth(
  accessToken: string,
  guildId: string,
): Promise<DiscordMember | null> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.warn('[discord] oauth self guild member:', res.status, await res.text());
    return null;
  }

  return res.json() as Promise<DiscordMember>;
}

export async function getGuildMemberInfo(discordUserId: string): Promise<GuildMemberInfo> {
  const member = await fetchGuildMember(discordUserId);
  if (member === 'api_error') {
    const existing = await prisma.user.findUnique({ where: { discordId: discordUserId } });
    if (existing) {
      return {
        isInGuild: resolveMembershipForSession(existing.isInGuild),
        guildNickname: existing.discordServerNick,
        globalDisplayName: existing.discordNickname,
        username: existing.discordUsername,
        roleNames: parseRoleNames(existing.discordRoleNames),
      };
    }
    return {
      isInGuild: resolveMembershipForSession(false),
      guildNickname: null,
      globalDisplayName: null,
      username: '',
      roleNames: [],
    };
  }
  if (!member) {
    return { isInGuild: false, guildNickname: null, globalDisplayName: null, username: '', roleNames: [] };
  }

  const roles = await fetchGuildRoles();
  const roleNames = resolveRoleNames(member.roles, roles);
  return memberToGuildInfo(member, roleNames);
}

async function persistGuildInfo(discordUserId: string, info: GuildMemberInfo) {
  const existing = await prisma.user.findUnique({ where: { discordId: discordUserId } });
  await prisma.user.update({
    where: { discordId: discordUserId },
    data: {
      isInGuild: info.isInGuild,
      discordServerNick: info.guildNickname,
      discordNickname: info.globalDisplayName ?? existing?.discordNickname ?? null,
      discordRoleNames: info.roleNames.length
        ? JSON.stringify(info.roleNames)
        : existing?.discordRoleNames ?? '[]',
      guildSyncedAt: new Date(),
    },
  });
}

export async function syncUserGuildData(discordUserId: string) {
  const member = await fetchGuildMember(discordUserId);
  if (member === 'api_error') {
    return getGuildMemberInfo(discordUserId);
  }
  const info = await getGuildMemberInfo(discordUserId);
  await persistGuildInfo(discordUserId, info);
  return info;
}

export async function syncUserGuildDataBestEffort(
  discordUserId: string,
  accessToken?: string | null,
) {
  const config = getGuildConfig();
  if (!config) return getGuildMemberInfo(discordUserId);

  if (accessToken) {
    const member = await fetchSelfGuildMemberViaOAuth(accessToken, config.guildId);
    if (member) {
      const roles = await fetchGuildRoles();
      const roleNames = roles.length > 0 ? resolveRoleNames(member.roles, roles) : [];
      const info = memberToGuildInfo(member, roleNames);
      const existing = await prisma.user.findUnique({ where: { discordId: discordUserId } });

      await prisma.user.update({
        where: { discordId: discordUserId },
        data: {
          isInGuild: true,
          discordServerNick: info.guildNickname,
          discordNickname: info.globalDisplayName ?? existing?.discordNickname ?? null,
          discordUsername: member.user.username,
          discordRoleNames: roleNames.length
            ? JSON.stringify(roleNames)
            : existing?.discordRoleNames ?? '[]',
          guildSyncedAt: new Date(),
        },
      });
      return info;
    }
  }

  return syncUserGuildData(discordUserId);
}

const GUILD_SYNC_TTL_MS = 2 * 60 * 1000;

export async function syncUserGuildDataIfStale(
  discordUserId: string,
  accessToken?: string | null,
  force = false,
) {
  if (!force) {
    const user = await prisma.user.findUnique({ where: { discordId: discordUserId } });
    if (user?.guildSyncedAt) {
      const age = Date.now() - user.guildSyncedAt.getTime();
      if (age < GUILD_SYNC_TTL_MS) {
        return {
          isInGuild: user.isInGuild,
          guildNickname: user.discordServerNick,
          globalDisplayName: user.discordNickname,
          username: user.discordUsername,
          roleNames: parseRoleNames(user.discordRoleNames),
        };
      }
    }
  }
  return syncUserGuildDataBestEffort(discordUserId, accessToken);
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

  const trimmed = nick?.trim() || null;
  const existing = await prisma.user.findUnique({ where: { discordId: discordUserId } });

  await prisma.user.update({
    where: { discordId: discordUserId },
    data: {
      discordServerNick: trimmed,
      isInGuild: true,
      guildSyncedAt: new Date(),
      discordNickname: existing?.discordNickname ?? null,
    },
  });

  try {
    return await syncUserGuildData(discordUserId);
  } catch {
    return getGuildMemberInfo(discordUserId);
  }
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
