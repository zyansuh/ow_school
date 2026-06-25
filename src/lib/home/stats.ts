import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { countActiveStudentsWithTeacher, countGraduatedStudents } from '@/lib/students/users';

export type HomeSiteStats = {
  students: number;
  teachers: number;
  graduated: number;
};

export const getHomeSiteStats = unstable_cache(
  async (): Promise<HomeSiteStats> => {
    try {
      const [students, teachers, graduated] = await Promise.all([
        countActiveStudentsWithTeacher(),
        prisma.teacher.count({ where: { isActive: true } }),
        countGraduatedStudents(),
      ]);
      return { students, teachers, graduated };
    } catch (e) {
      console.error('[home] site stats failed:', e);
      return { students: 0, teachers: 0, graduated: 0 };
    }
  },
  ['home-site-stats'],
  { revalidate: 120 },
);
