-- Additive only: student / application / DM lookup indexes.
-- No column drops, no data rewrites. Existing rows unchanged.
-- DISCORD_BOT_TOKEN remains env-only (no table); DiscordDmLog already exists.

-- User: 담당 선생님별 · 재학 배정 조회
CREATE INDEX "User_teacherId_idx" ON "User"("teacherId");
CREATE INDEX "User_status_teacherId_idx" ON "User"("status", "teacherId");

-- Application: 내 신청 · 선생님별 신청 · 상태 목록
CREATE INDEX "Application_userId_idx" ON "Application"("userId");
CREATE INDEX "Application_teacherId_idx" ON "Application"("teacherId");
CREATE INDEX "Application_status_createdAt_idx" ON "Application"("status", "createdAt");

-- DiscordDmLog: 선생님 기준 DM 내역 필터
CREATE INDEX "DiscordDmLog_teacherId_idx" ON "DiscordDmLog"("teacherId");
