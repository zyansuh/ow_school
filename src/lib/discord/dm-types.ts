export const DISCORD_DM_TYPES = [
  'admission_student',
  'graduation_student',
  'graduation_teacher',
  'application_teacher',
  'interview_teacher',
  'manual',
] as const;

export type DiscordDmType = (typeof DISCORD_DM_TYPES)[number];

export type DiscordDmStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type DiscordDmSkipReason =
  | 'no_bot_token'
  | 'no_recipient'
  | 'disabled'
  | 'not_in_guild'
  | 'unknown';
