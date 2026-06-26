import { prisma } from '@/lib/prisma';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher/counts';
import { mapTeacherWithClasses, teacherInclude } from '@/lib/teacher/classes';

export type TeacherForStudentAssign = {
  id: string;
  name: string;
  class: { name: string };
  isActive: boolean;
  currentStudents: number;
  maxStudents: number;
  remainingSlots: number;
};

/** 학생관리 담당 선생님 Select — 잔여 정원 많은 순, 동일 시 이름순 */
export async function listTeachersForStudentAssign(): Promise<TeacherForStudentAssign[]> {
  const [teachers, liveCounts] = await Promise.all([
    prisma.teacher.findMany({ include: teacherInclude }),
    getActiveStudentCountsByTeacher(),
  ]);

  const rows = teachers.map((t) => {
    const mapped = mapTeacherWithClasses(t);
    const currentStudents = liveCounts[t.id] ?? 0;
    return {
      id: t.id,
      name: t.name,
      class: { name: mapped.classes[0]?.name ?? t.class.name },
      isActive: t.isActive,
      currentStudents,
      maxStudents: t.maxStudents,
      remainingSlots: t.maxStudents - currentStudents,
    };
  });

  return rows.sort((a, b) => {
    if (b.remainingSlots !== a.remainingSlots) return b.remainingSlots - a.remainingSlots;
    return a.name.localeCompare(b.name, 'ko');
  });
}
