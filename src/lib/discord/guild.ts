import { prisma } from '@/lib/prisma';
import { parseDiscordJoinedAt } from '@/lib/discord/guild-tenure';
import { resolveGuildMembershipFromDb } from '@/lib/discord/guild-membership';

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
  joined_at?: string;
  user: { id: string; username: string; global_name?: string | null; avatar?: string | null };
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

/** @deprecated resolveGuildMembershipFromDb 사용 — DB isInGuild 그대로 반환 */
export function resolveMembershipForSession(dbIsInGuild: boolean): boolean {
  return resolveGuildMembershipFromDb(dbIsInGuild);
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

function guildInfoFromDbUser(user: {
  isInGuild: boolean;
  discordServerNick: string | null;
  discordNickname: string | null;
  discordUsername: string;
  discordRoleNames: string | null;
}): GuildMemberInfo {
  return {
    isInGuild: resolveGuildMembershipFromDb(user.isInGuild),
    guildNickname: user.discordServerNick,
    globalDisplayName: user.discordNickname,
    username: user.discordUsername,
    roleNames: parseRoleNames(user.discordRoleNames),
  };
}

async function guildInfoFromDb(discordUserId: string): Promise<GuildMemberInfo> {
  const existing = await prisma.user.findUnique({ where: { discordId: discordUserId } });
  if (!existing) {
    return {
      isInGuild: false,
      guildNickname: null,
      globalDisplayName: null,
      username: '',
      roleNames: [],
    };
  }
  return guildInfoFromDbUser(existing);
}

async function guildInfoFromMember(member: DiscordMember): Promise<GuildMemberInfo> {
  const roles = await fetchGuildRoles();
  const roleNames = resolveRoleNames(member.roles, roles);
  return memberToGuildInfo(member, roleNames);
}

export async function getGuildMemberInfo(discordUserId: string): Promise<GuildMemberInfo> {
  const member = await fetchGuildMember(discordUserId);
  if (member === 'api_error') return guildInfoFromDb(discordUserId);
  if (!member) {
    return { isInGuild: false, guildNickname: null, globalDisplayName: null, username: '', roleNames: [] };
  }
  return guildInfoFromMember(member);
}

async function persistGuildInfo(
  discordUserId: string,
  info: GuildMemberInfo,
  member?: DiscordMember,
) {
  const existing = await prisma.user.findUnique({ where: { discordId: discordUserId } });
  const avatar =
    member?.user.avatar != null
      ? `https://cdn.discordapp.com/avatars/${discordUserId}/${member.user.avatar}.png`
      : existing?.discordAvatar ?? null;

  const parsedJoin = member ? parseDiscordJoinedAt(member.joined_at) : null;

  await prisma.user.update({
    where: { discordId: discordUserId },
    data: {
      isInGuild: info.isInGuild,
      discordServerNick: info.guildNickname,
      discordNickname: info.globalDisplayName ?? existing?.discordNickname ?? null,
      discordUsername: member?.user.username ?? existing?.discordUsername,
      discordAvatar: avatar,
      discordRoleNames: info.isInGuild
        ? info.roleNames.length
          ? JSON.stringify(info.roleNames)
          : (existing?.discordRoleNames ?? '[]')
        : '[]',
      guildJoinedAt: info.isInGuild
        ? parsedJoin ?? existing?.guildJoinedAt ?? null
        : null,
      guildSyncedAt: new Date(),
    },
  });
}

export async function syncUserGuildData(discordUserId: string) {
  const member = await fetchGuildMember(discordUserId);
  if (member === 'api_error') {
    // API 실패 시에도 백오프 타임스탬프를 남겨 매 요청마다 Discord 재호출을 막음
    await prisma.user
      .update({
        where: { discordId: discordUserId },
        data: { guildSyncedAt: new Date() },
      })
      .catch(() => {});
    return guildInfoFromDb(discordUserId);
  }

  if (!member) {
    const info: GuildMemberInfo = {
      isInGuild: false,
      guildNickname: null,
      globalDisplayName: null,
      username: '',
      roleNames: [],
    };
    await persistGuildInfo(discordUserId, info);
    return info;
  }

  const info = await guildInfoFromMember(member);
  await persistGuildInfo(discordUserId, info, member);
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
      await persistGuildInfo(discordUserId, info, member);
      return info;
    }
  }

  return syncUserGuildData(discordUserId);
}

const DEFAULT_GUILD_SYNC_TTL_MS = 5 * 60 * 1000;

function guildSyncTtlMs() {
  const sec = Number(process.env.GUILD_SYNC_TTL_SEC);
  if (Number.isFinite(sec) && sec > 0) return sec * 1000;
  return DEFAULT_GUILD_SYNC_TTL_MS;
}

export function isGuildSyncStale(guildSyncedAt: Date | null | undefined, force = false) {
  if (force || !guildSyncedAt) return true;
  return Date.now() - guildSyncedAt.getTime() >= guildSyncTtlMs();
}

export async function syncUserGuildDataIfStale(
  discordUserId: string,
  accessToken?: string | null,
  force = false,
) {
  if (!force) {
    const user = await prisma.user.findUnique({ where: { discordId: discordUserId } });
    if (user && !isGuildSyncStale(user.guildSyncedAt)) {
      return guildInfoFromDbUser(user);
    }
  }
  return syncUserGuildDataBestEffort(discordUserId, accessToken);
}

/** stale일 때만 Discord 동기화 (await용). */
export async function runGuildSyncIfStale(
  discordUserId: string,
  accessToken?: string | null,
  force = false,
) {
  if (!force) {
    const user = await prisma.user.findUnique({
      where: { discordId: discordUserId },
      select: { guildSyncedAt: true },
    });
    if (!isGuildSyncStale(user?.guildSyncedAt)) return;
  }
  await syncUserGuildDataBestEffort(discordUserId, accessToken);
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

  const roles = await fetchGuildRoles();
  const roleNames = resolveRoleNames(member.roles, roles);
  return {
    ...memberToGuildInfo({ ...member, nick: trimmed }, roleNames),
    guildNickname: trimmed,
  };
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
