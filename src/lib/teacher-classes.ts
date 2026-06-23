import { prisma } from '@/lib/prisma';

/** 선생님 담당 반 목록 동기화 (classId = 첫 번째 반, 기존 FK 호환) */
export async function syncTeacherClasses(teacherId: string, classIds: string[]) {
  const unique = [...new Set(classIds.filter(Boolean))];
  if (unique.length === 0) {
    throw new Error('CLASS_IDS_REQUIRED');
  }

  await prisma.$transaction([
    prisma.teacherClass.deleteMany({ where: { teacherId } }),
    prisma.teacherClass.createMany({
      data: unique.map((classId) => ({ teacherId, classId })),
      skipDuplicates: true,
    }),
    prisma.teacher.update({
      where: { id: teacherId },
      data: { classId: unique[0] },
    }),
  ]);

  return unique;
}

export function mapTeacherWithClasses<
  T extends {
    id: string;
    classId: string;
    class: { id: string; name: string; slug: string };
    teacherClasses?: Array<{ class: { id: string; name: string; slug: string } }>;
  },
>(teacher: T) {
  const fromJoin =
    teacher.teacherClasses?.map((tc) => tc.class) ?? [];
  const classes =
    fromJoin.length > 0
      ? fromJoin
      : [teacher.class];
  const classIds = classes.map((c) => c.id);
  return { ...teacher, classes, classIds };
}
