import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { defaultClassStats } from '@/lib/db-fallbacks';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher-counts';

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

export const getHomeClassStats = unstable_cache(
  async (): Promise<HomeClassStats> => {
    try {
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

      const liveCounts = await getActiveStudentCountsByTeacher();

      return Object.fromEntries(
        classes.map((c) => {
          const roster = mergeTeachersForClass(c);
          return [
            c.slug,
            {
              recruiting: roster.some((t) => (liveCounts[t.id] ?? 0) < t.maxStudents),
              current: roster.reduce((sum, t) => sum + (liveCounts[t.id] ?? 0), 0),
              max: roster.reduce((sum, t) => sum + t.maxStudents, 0),
            },
          ];
        }),
      );
    } catch (e) {
      console.error('[home] getClassStats failed:', e);
      return defaultClassStats();
    }
  },
  ['home-class-stats'],
  { revalidate: 60 },
);
