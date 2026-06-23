import { prisma } from '@/lib/prisma';
import { getGuildConfig, getGuildMemberInfo, syncUserGuildData } from '@/lib/discord-guild';
import { guildNicknameOnly, normalizeNickFields } from '@/lib/user-display';
import { isDiscordSnowflake } from '@/lib/discord-id';

export type AdminDiscordUserLookup = {
  found: boolean;
  discordId: string;
  discordUsername: string | null;
  serverNickname: string | null;
  isInGuild: boolean;
  message?: string;
};

/** 관리자용 — Discord User ID로 서버 닉네임(guild nick) 조회 */
export async function lookupDiscordUserById(discordId: string): Promise<AdminDiscordUserLookup> {
  const id = discordId.trim();
  if (!isDiscordSnowflake(id)) {
    return {
      found: false,
      discordId: id,
      discordUsername: null,
      serverNickname: null,
      isInGuild: false,
      message: 'INVALID_ID',
    };
  }

  let user = await prisma.user.findUnique({ where: { discordId: id } });

  if (user && getGuildConfig()) {
    const stale = !user.guildSyncedAt || !user.discordServerNick?.trim();
    if (stale) {
      try {
        await syncUserGuildData(id);
        user = await prisma.user.findUnique({ where: { discordId: id } });
      } catch {
        // DB·캐시 값으로 폴백
      }
    }
  }

  if (user) {
    const serverNickname = guildNicknameOnly(normalizeNickFields(user));
    return {
      found: true,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      serverNickname,
      isInGuild: user.isInGuild,
      message: serverNickname ? undefined : 'NO_SERVER_NICK',
    };
  }

  if (getGuildConfig()) {
    const info = await getGuildMemberInfo(id);
    return {
      found: info.isInGuild,
      discordId: id,
      discordUsername: info.username || null,
      serverNickname: info.guildNickname,
      isInGuild: info.isInGuild,
      message: info.guildNickname ? undefined : info.isInGuild ? 'NO_SERVER_NICK' : 'NOT_IN_GUILD',
    };
  }

  return {
    found: false,
    discordId: id,
    discordUsername: null,
    serverNickname: null,
    isInGuild: false,
    message: 'NOT_FOUND',
  };
}
