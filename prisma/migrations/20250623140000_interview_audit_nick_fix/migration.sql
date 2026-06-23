-- PointHistory: link to interview for deletion tracking
ALTER TABLE "PointHistory" ADD COLUMN IF NOT EXISTS "interviewId" TEXT;
CREATE INDEX IF NOT EXISTS "PointHistory_interviewId_idx" ON "PointHistory"("interviewId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PointHistory_interviewId_fkey'
  ) THEN
    ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_interviewId_fkey"
      FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Interview deletion audit log
CREATE TABLE IF NOT EXISTS "InterviewDeletionLog" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorDisplayName" TEXT NOT NULL,
    "deletedByUserId" TEXT NOT NULL,
    "deletedByDisplayName" TEXT NOT NULL,
    "reason" TEXT,
    "graduationPointsRemoved" INTEGER NOT NULL DEFAULT 0,
    "clubPointsRemoved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewDeletionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InterviewDeletionLog_authorUserId_idx" ON "InterviewDeletionLog"("authorUserId");
CREATE INDEX IF NOT EXISTS "InterviewDeletionLog_deletedByUserId_idx" ON "InterviewDeletionLog"("deletedByUserId");
