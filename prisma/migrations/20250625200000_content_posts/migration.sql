-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentPost_published_createdAt_idx" ON "ContentPost"("published", "createdAt");

CREATE INDEX IF NOT EXISTS "ContentImage_postId_sortOrder_idx" ON "ContentImage"("postId", "sortOrder");

DO $$ BEGIN
 ALTER TABLE "ContentImage" ADD CONSTRAINT "ContentImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
