import { prisma } from '@/lib/prisma';

export const teacherPublicInclude = {
  class: true,
  teacherClasses: { include: { class: true } },
} as const;

/** 반(classId)에 소속된 반장 — 주 담당 반 또는 TeacherClass M:N */
export function teachersForClassIdWhere(classId: string) {
  return {
    OR: [
      { classId },
      { teacherClasses: { some: { classId } } },
    ],
  };
}

export async function findClassBySlug(slug: string) {
  return prisma.class.findUnique({ where: { slug } });
}

export async function findTeachersForClassSlug(
  slug: string,
  options?: { activeOnly?: boolean },
) {
  const dbClass = await findClassBySlug(slug);
  if (!dbClass) return null;

  const teachers = await prisma.teacher.findMany({
    where: {
      ...teachersForClassIdWhere(dbClass.id),
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    include: teacherPublicInclude,
    orderBy: { name: 'asc' },
  });

  return { dbClass, teachers };
}
