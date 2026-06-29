-- Vercel Blob 미연결 시 컨텐츠 이미지 DB 저장 (기존 데이터 변경 없음)
CREATE TABLE "ContentUploadedFile" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentUploadedFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentUploadedFile_createdAt_idx" ON "ContentUploadedFile"("createdAt");
