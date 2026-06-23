-- CreateTable
CREATE TABLE "TeacherClass" (
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("teacherId","classId")
);

-- Migrate existing primary class assignments
INSERT INTO "TeacherClass" ("teacherId", "classId", "createdAt")
SELECT "id", "classId", NOW() FROM "Teacher"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE INDEX "TeacherClass_classId_idx" ON "TeacherClass"("classId");

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
