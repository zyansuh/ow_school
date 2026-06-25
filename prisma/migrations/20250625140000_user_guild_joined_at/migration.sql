-- AlterTable: nullable column only — 기존 행·데이터 유지
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "guildJoinedAt" TIMESTAMP(3);
