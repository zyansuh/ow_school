import { isDiscordSnowflake } from '@/lib/discord-id';

/** Teacher.discord 저장 전 검증 — snowflake(User ID) 금지 */
export function assertValidTeacherDiscordField(discord: string | undefined | null) {
  const v = discord?.trim();
  if (!v) return;
  if (isDiscordSnowflake(v)) {
    throw new Error('TEACHER_DISCORD_IS_USER_ID');
  }
}
