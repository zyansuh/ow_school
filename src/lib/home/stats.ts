import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { countActiveStudentsWithTeacher, countGraduatedStudents } from '@/lib/students/users';

export type HomeSiteStats = {
  students: number;
  teachers: number;
  graduated: number;
};

async function computeHomeSiteStats(): Promise<HomeSiteStats> {
  const [students, teachers, graduated] = await Promise.all([
    countActiveStudentsWithTeacher(),
    prisma.teacher.count({ where: { isActive: true } }),
    countGraduatedStudents(),
  ]);
  return { students, teachers, graduated };
}

export async function getHomeSiteStatsComputed(): Promise<HomeSiteStats> {
  try {
    return await computeHomeSiteStats();
  } catch (e) {
    console.error('[home] site stats failed:', e);
    return { students: 0, teachers: 0, graduated: 0 };
  }
}

/** DB 실시간 집계 — SiteSetting 오버라이드 없이 자동 표시 */
export const getHomeSiteStats = unstable_cache(
  async (): Promise<HomeSiteStats> => {
    try {
      return await computeHomeSiteStats();
    } catch (e) {
      console.error('[home] site stats failed:', e);
      return { students: 0, teachers: 0, graduated: 0 };
    }
  },
  ['home-site-stats'],
  { revalidate: 120, tags: ['home-site-stats'] },
);
