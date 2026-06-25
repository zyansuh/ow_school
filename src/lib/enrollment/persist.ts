import { prisma } from '@/lib/prisma';
import {
  countByClassId,
  countByTeacherId,
  findActiveAssignedStudents,
  findActiveStudentsByClass,
} from '@/lib/enrollment/queries';

export type EnrollmentStatEntityType = 'class' | 'teacher';

/** User·Teacher 기존 행은 건드리지 않고 EnrollmentStat 테이블만 갱신 */
export async function syncEnrollmentStats() {
  const [assigned, byClass] = await Promise.all([
    findActiveAssignedStudents(),
    findActiveStudentsByClass(),
  ]);

  const teacherCounts = countByTeacherId(assigned);
  const classCounts = countByClassId(byClass);

  const ops = [
    ...Object.entries(teacherCounts).map(([entityId, activeCount]) =>
      prisma.enrollmentStat.upsert({
        where: { entityType_entityId: { entityType: 'teacher', entityId } },
        create: { entityType: 'teacher', entityId, activeCount },
        update: { activeCount },
      }),
    ),
    ...Object.entries(classCounts).map(([entityId, activeCount]) =>
      prisma.enrollmentStat.upsert({
        where: { entityType_entityId: { entityType: 'class', entityId } },
        create: { entityType: 'class', entityId, activeCount },
        update: { activeCount },
      }),
    ),
  ];

  if (ops.length) await prisma.$transaction(ops);
  return { teacherCounts, classCounts };
}
