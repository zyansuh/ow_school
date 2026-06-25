import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { defaultClassStats } from '@/lib/db-fallbacks';
import { countByClassId, findActiveStudentsByClass } from '@/lib/enrollment/queries';
import { syncEnrollmentStats } from '@/lib/enrollment/persist';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher/counts';

export type HomeClassStats = Record<string, { recruiting: boolean; current: number; max: number }>;

function mergeTeachersForClass(c: {
  teachers: { id: string; maxStudents: number }[];
  teacherClasses: { teacher: { id: string; maxStudents: number } }[];
}) {
  const seen = new Set<string>();
  const roster: { id: string; maxStudents: number }[] = [];

  for (const t of c.teachers) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      roster.push(t);
    }
  }
  for (const tc of c.teacherClasses) {
    if (!seen.has(tc.teacher.id)) {
      seen.add(tc.teacher.id);
      roster.push(tc.teacher);
    }
  }

  return roster;
}

async function computeHomeClassStats(): Promise<HomeClassStats> {
  const classes = await prisma.class.findMany({
    include: {
      teachers: {
        where: { isActive: true },
        select: { id: true, maxStudents: true },
      },
      teacherClasses: {
        where: { teacher: { isActive: true } },
        select: { teacher: { select: { id: true, maxStudents: true } } },
      },
    },
  });

  const [liveTeacherCounts, classStudents] = await Promise.all([
    getActiveStudentCountsByTeacher(),
    findActiveStudentsByClass(),
  ]);
  const liveClassCounts = countByClassId(classStudents);

  try {
    await syncEnrollmentStats();
  } catch (e) {
    console.error('[home] syncEnrollmentStats failed:', e);
  }

  return Object.fromEntries(
    classes.map((c) => {
      const roster = mergeTeachersForClass(c);
      const currentByClass = liveClassCounts[c.id] ?? 0;
      const currentByTeachers = roster.reduce((sum, t) => sum + (liveTeacherCounts[t.id] ?? 0), 0);
      const current = currentByClass > 0 ? currentByClass : currentByTeachers;
      return [
        c.slug,
        {
          recruiting: roster.some((t) => t.maxStudents > 0 && (liveTeacherCounts[t.id] ?? 0) < t.maxStudents),
          current,
          max: roster.reduce((sum, t) => sum + t.maxStudents, 0),
        },
      ];
    }),
  );
}

export async function getHomeClassStatsComputed(): Promise<HomeClassStats> {
  try {
    return await computeHomeClassStats();
  } catch (e) {
    console.error('[home] getClassStats failed:', e);
    return defaultClassStats();
  }
}

/** DB 실시간 집계 — SiteSetting 오버라이드 없이 자동 표시 */
export const getHomeClassStats = unstable_cache(
  async (): Promise<HomeClassStats> => {
    try {
      return await computeHomeClassStats();
    } catch (e) {
      console.error('[home] getClassStats failed:', e);
      return defaultClassStats();
    }
  },
  ['home-class-stats'],
  { revalidate: 60, tags: ['home-class-stats'] },
);
