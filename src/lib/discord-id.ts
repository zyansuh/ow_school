const DISCORD_SNOWFLAKE = /^\d{17,20}$/;

export function isDiscordSnowflake(value: string) {
  return DISCORD_SNOWFLAKE.test(value.trim());
}
