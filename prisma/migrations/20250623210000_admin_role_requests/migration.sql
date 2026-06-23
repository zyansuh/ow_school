-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminRoleRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminRoleRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminRoleAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "requestId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminRoleAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminRoleRequest_userId_idx" ON "AdminRoleRequest"("userId");
CREATE INDEX IF NOT EXISTS "AdminRoleRequest_status_idx" ON "AdminRoleRequest"("status");
CREATE INDEX IF NOT EXISTS "AdminRoleAuditLog_targetUserId_idx" ON "AdminRoleAuditLog"("targetUserId");
CREATE INDEX IF NOT EXISTS "AdminRoleAuditLog_actorUserId_idx" ON "AdminRoleAuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "AdminRoleAuditLog_action_idx" ON "AdminRoleAuditLog"("action");

DO $$ BEGIN
  ALTER TABLE "AdminRoleRequest" ADD CONSTRAINT "AdminRoleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
