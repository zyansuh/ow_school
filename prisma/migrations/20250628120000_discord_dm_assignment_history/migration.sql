-- Discord DM 발송 기록 + 배정 이력 (기존 User/Teacher 데이터 변경 없음)
CREATE TABLE "DiscordDmLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientDiscordId" TEXT NOT NULL,
    "userId" TEXT,
    "teacherId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "skipReason" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordDmLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscordDmLog_status_createdAt_idx" ON "DiscordDmLog"("status", "createdAt");
CREATE INDEX "DiscordDmLog_type_createdAt_idx" ON "DiscordDmLog"("type", "createdAt");
CREATE INDEX "DiscordDmLog_recipientDiscordId_idx" ON "DiscordDmLog"("recipientDiscordId");
CREATE INDEX "DiscordDmLog_userId_idx" ON "DiscordDmLog"("userId");

CREATE TABLE "AssignmentHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teacherId" TEXT,
    "classId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssignmentHistory_userId_createdAt_idx" ON "AssignmentHistory"("userId", "createdAt");
CREATE INDEX "AssignmentHistory_teacherId_createdAt_idx" ON "AssignmentHistory"("teacherId", "createdAt");
CREATE INDEX "AssignmentHistory_action_createdAt_idx" ON "AssignmentHistory"("action", "createdAt");
