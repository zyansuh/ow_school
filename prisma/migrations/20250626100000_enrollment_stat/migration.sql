-- 공개 인원 집계 스냅샷 (User·Teacher 원본은 변경하지 않음)
CREATE TABLE "EnrollmentStat" (
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentStat_pkey" PRIMARY KEY ("entityType","entityId")
);

CREATE INDEX "EnrollmentStat_entityType_idx" ON "EnrollmentStat"("entityType");
