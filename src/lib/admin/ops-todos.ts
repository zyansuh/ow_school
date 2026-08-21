import { prisma } from '@/lib/prisma';
import { ADMIN_CLASS_ORDER, normalizeClassLabel } from '@/lib/admin/class-filter';
import { countActiveStudentsForTeacher } from '@/lib/teacher/counts';
import { filterStudentUsers, loadUserRoleContext } from '@/lib/users/role';

export type OpsTodoClassBlock = {
  className: string;
  pendingApplications: number;
  activeNoInterview: number;
  nearFullTeachers: Array<{
    teacherId: string;
    teacherName: string;
    current: number;
    max: number;
    remaining: number;
  }>;
  inactiveTeacherStudents: number;
  inactiveTeachers: Array<{ teacherId: string; teacherName: string; studentCount: number }>;
};

export type OpsTodosPayload = {
  generatedAt: string;
  totals: {
    pendingApplications: number;
    activeNoInterview: number;
    nearFullTeacherCount: number;
    inactiveTeacherStudentCount: number;
  };
  byClass: OpsTodoClassBlock[];
};

const NEAR_FULL_REMAINING = 1; // remainingSlots <= 1 이고 max > 0

export async function getAdminOpsTodos(): Promise<OpsTodosPayload> {
  const roleCtx = await loadUserRoleContext();

  const [pendingApps, activeUsers, teachers] = await Promise.all([
    prisma.application.findMany({
      where: { status: 'pending' },
      include: { class: true },
    }),
    prisma.user.findMany({
      where: { status: 'active', adminRole: null },
      include: {
        class: true,
        teacher: true,
        adminRole: true,
        _count: { select: { interviews: true } },
      },
    }),
    prisma.teacher.findMany({
      include: { class: true, teacherClasses: { include: { class: true } } },
    }),
  ]);

  const students = filterStudentUsers(activeUsers, roleCtx);

  const classNames = new Set<string>([...ADMIN_CLASS_ORDER]);
  for (const a of pendingApps) classNames.add(normalizeClassLabel(a.class.name));
  for (const s of students) classNames.add(normalizeClassLabel(s.class?.name));
  for (const t of teachers) {
    classNames.add(normalizeClassLabel(t.class.name));
    for (const tc of t.teacherClasses) {
      classNames.add(normalizeClassLabel(tc.class.name));
    }
  }

  const teacherLiveCounts = new Map<string, number>();
  await Promise.all(
    teachers.map(async (t) => {
      const n = await countActiveStudentsForTeacher(t.id);
      teacherLiveCounts.set(t.id, n);
    }),
  );

  const blocks: OpsTodoClassBlock[] = Array.from(classNames)
    .map((className) => {
      const pendingApplications = pendingApps.filter(
        (a) => normalizeClassLabel(a.class.name) === className,
      ).length;

      const classStudents = students.filter(
        (s) => normalizeClassLabel(s.class?.name) === className,
      );
      const activeNoInterview = classStudents.filter((s) => s._count.interviews === 0).length;

      const classTeachers = teachers.filter((t) => {
        const names = [
          normalizeClassLabel(t.class.name),
          ...t.teacherClasses.map((tc) => normalizeClassLabel(tc.class.name)),
        ];
        return names.includes(className);
      });

      const nearFullTeachers = classTeachers
        .filter((t) => t.isActive && t.maxStudents > 0)
        .map((t) => {
          const current = teacherLiveCounts.get(t.id) ?? t.currentStudents;
          const remaining = t.maxStudents - current;
          return {
            teacherId: t.id,
            teacherName: t.name,
            current,
            max: t.maxStudents,
            remaining,
          };
        })
        .filter((t) => t.remaining <= NEAR_FULL_REMAINING && t.remaining >= 0);

      const inactiveTeachers = classTeachers
        .filter((t) => !t.isActive)
        .map((t) => ({
          teacherId: t.id,
          teacherName: t.name,
          studentCount: teacherLiveCounts.get(t.id) ?? 0,
        }))
        .filter((t) => t.studentCount > 0);

      const inactiveTeacherStudents = inactiveTeachers.reduce((s, t) => s + t.studentCount, 0);

      return {
        className,
        pendingApplications,
        activeNoInterview,
        nearFullTeachers,
        inactiveTeacherStudents,
        inactiveTeachers,
      };
    })
    .filter(
      (b) =>
        b.pendingApplications > 0 ||
        b.activeNoInterview > 0 ||
        b.nearFullTeachers.length > 0 ||
        b.inactiveTeacherStudents > 0,
    )
    .sort((a, b) => {
      const ai = ADMIN_CLASS_ORDER.indexOf(a.className);
      const bi = ADMIN_CLASS_ORDER.indexOf(b.className);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const totals = {
    pendingApplications: blocks.reduce((s, b) => s + b.pendingApplications, 0),
    activeNoInterview: blocks.reduce((s, b) => s + b.activeNoInterview, 0),
    nearFullTeacherCount: blocks.reduce((s, b) => s + b.nearFullTeachers.length, 0),
    inactiveTeacherStudentCount: blocks.reduce((s, b) => s + b.inactiveTeacherStudents, 0),
  };

  return {
    generatedAt: new Date().toISOString(),
    totals,
    byClass: blocks,
  };
}
