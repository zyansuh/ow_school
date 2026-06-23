-- AlterTable Application: remove unused form fields
ALTER TABLE "Application" DROP COLUMN IF EXISTS "customNote";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "selfIntro";

-- AlterTable Interview: migrate to new question fields
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "className" TEXT;
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "clubNames" TEXT;
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "contentExperience" TEXT;
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "joinedClub" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "memorablePerson" TEXT;

UPDATE "Interview"
SET
  "contentExperience" = COALESCE("contentExperience", "review", "memorable", ''),
  "memorablePerson" = COALESCE("memorablePerson", "memorable", '')
WHERE "contentExperience" IS NULL OR "memorablePerson" IS NULL;

ALTER TABLE "Interview" ALTER COLUMN "contentExperience" SET NOT NULL;
ALTER TABLE "Interview" ALTER COLUMN "memorablePerson" SET NOT NULL;

ALTER TABLE "Interview" DROP COLUMN IF EXISTS "improvements";
ALTER TABLE "Interview" DROP COLUMN IF EXISTS "memorable";
ALTER TABLE "Interview" DROP COLUMN IF EXISTS "review";
ALTER TABLE "Interview" DROP COLUMN IF EXISTS "satisfaction";

-- CreateTable PointHistory
CREATE TABLE IF NOT EXISTS "PointHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointType" TEXT NOT NULL,
    "pointAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PointHistory_userId_idx" ON "PointHistory"("userId");
CREATE INDEX IF NOT EXISTS "PointHistory_pointType_idx" ON "PointHistory"("pointType");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PointHistory_userId_fkey'
  ) THEN
    ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
