-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "discordUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_discordUserId_key" ON "Teacher"("discordUserId");
