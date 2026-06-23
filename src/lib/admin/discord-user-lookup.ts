import { prisma } from '@/lib/prisma';
import { getGuildConfig, getGuildMemberInfo, syncUserGuildData } from '@/lib/discord-guild';
import {
  globalDisplayNameOnly,
  guildNicknameOnly,
  normalizeNickFields,
  teacherDiscordLabel,
} from '@/lib/user-display';
import { isDiscordSnowflake } from '@/lib/discord-id';

export type AdminDiscordUserLookup = {
  found: boolean;
  discordId: string;
  discordUsername: string | null;
  serverNickname: string | null;
  globalDisplayName: string | null;
  /** Teacher.discord 저장용 — guild → global → username */
  discordLabel: string | null;
  isInGuild: boolean;
  message?: string;
};

function labelFromGuildInfo(info: {
  guildNickname: string | null;
  globalDisplayName: string | null;
  username: string;
}): string | null {
  for (const candidate of [info.guildNickname, info.globalDisplayName, info.username]) {
    const v = candidate?.trim();
    if (!v || isDiscordSnowflake(v)) continue;
    return v;
  }
  return null;
}

/** 관리자용 — Discord User ID로 대상 유저 닉네임 조회 (현재 로그인 사용자와 무관) */
export async function lookupDiscordUserById(discordId: string): Promise<AdminDiscordUserLookup> {
  const id = discordId.trim();
  if (!isDiscordSnowflake(id)) {
    return {
      found: false,
      discordId: id,
      discordUsername: null,
      serverNickname: null,
      globalDisplayName: null,
      discordLabel: null,
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
    const fields = normalizeNickFields(user);
    const serverNickname = guildNicknameOnly(fields);
    const globalDisplayName = globalDisplayNameOnly(fields);
    const discordLabel = teacherDiscordLabel(fields);
    return {
      found: true,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      serverNickname,
      globalDisplayName,
      discordLabel,
      isInGuild: user.isInGuild,
      message: discordLabel ? undefined : 'NO_LABEL',
    };
  }

  if (getGuildConfig()) {
    const info = await getGuildMemberInfo(id);
    const discordLabel = labelFromGuildInfo(info);
    return {
      found: info.isInGuild,
      discordId: id,
      discordUsername: info.username || null,
      serverNickname: info.guildNickname,
      globalDisplayName: info.globalDisplayName,
      discordLabel,
      isInGuild: info.isInGuild,
      message: discordLabel ? undefined : info.isInGuild ? 'NO_LABEL' : 'NOT_IN_GUILD',
    };
  }

  return {
    found: false,
    discordId: id,
    discordUsername: null,
    serverNickname: null,
    globalDisplayName: null,
    discordLabel: null,
    isInGuild: false,
    message: 'NOT_FOUND',
  };
}
