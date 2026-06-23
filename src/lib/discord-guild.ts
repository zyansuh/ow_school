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

/** OAuth access token으로 사용자가 서버에 가입했는지 확인 (봇 미초대 시에도 동작) */
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

/** 봇이 서버에 들어가 있는지 확인 */
export async function isBotInGuild(): Promise<boolean> {
  const config = getGuildConfig();
  if (!config) return false;

  const res = await fetch(`${DISCORD_API}/guilds/${config.guildId}`, {
    headers: botHeaders(config.botToken),
    cache: 'no-store',
  });
  return res.ok;
}

/**
 * 사용자 서버 가입 여부 (OAuth guilds 목록 우선, 실패 시 봇 API)
 * - in: 가입됨
 * - out: 미가입
 * - unknown: 확인 불가 (로그인 허용)
 */
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

/** 서버 닉 → 전역 표시 이름 → 유저네임 순 */
export function resolveMemberDisplayName(member: {
  nick?: string | null;
  user: { username: string; global_name?: string | null };
}): string {
  return member.nick ?? member.user.global_name ?? member.user.username;
}

/**
 * 로그인한 사용자 본인의 서버 멤버 정보 (봇 없이 OAuth access token으로 조회)
 * scope: guilds.members.read 필요
 */
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
    if (existing?.isInGuild) {
      return {
        isInGuild: true,
        serverNick: existing.discordServerNick,
        roleNames: parseRoleNames(existing.discordRoleNames),
      };
    }
    return { isInGuild: false, serverNick: null, roleNames: [] };
  }
  if (!member) {
    return { isInGuild: false, serverNick: null, roleNames: [] };
  }

  const roles = await fetchGuildRoles();
  const roleNames = resolveRoleNames(member.roles, roles);
  const serverNick = resolveMemberDisplayName(member);

  return { isInGuild: true, serverNick, roleNames };
}

async function persistGuildInfo(discordUserId: string, info: GuildMemberInfo) {
  await prisma.user.update({
    where: { discordId: discordUserId },
    data: {
      isInGuild: info.isInGuild,
      discordServerNick: info.serverNick,
      discordRoleNames: JSON.stringify(info.roleNames),
      guildSyncedAt: new Date(),
    },
  });
}

/** OAuth 토큰으로 서버 닉·역할 동기화 (실패 시 봇 API로 폴백) */
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
      const serverNick = resolveMemberDisplayName(member);
      const info: GuildMemberInfo = { isInGuild: true, serverNick, roleNames };

      await prisma.user.update({
        where: { discordId: discordUserId },
        data: {
          isInGuild: true,
          discordServerNick: serverNick,
          discordRoleNames: JSON.stringify(roleNames),
          discordNickname: member.user.global_name ?? member.user.username,
          guildSyncedAt: new Date(),
        },
      });
      return info;
    }
  }

  return syncUserGuildData(discordUserId);
}

export async function syncUserGuildData(discordUserId: string) {
  const info = await getGuildMemberInfo(discordUserId);
  await persistGuildInfo(discordUserId, info);
  return info;
}

const GUILD_SYNC_TTL_MS = 5 * 60 * 1000;

/** 최근 동기화된 경우 스킵 (로딩 속도 개선) */
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
          serverNick: user.discordServerNick,
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
