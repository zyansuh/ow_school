import { prisma } from '@/lib/prisma';
import type { HomeClassStats } from '@/lib/home/class-stats';
import type { HomeSiteStats } from '@/lib/home/stats';

export const HOME_SITE_STATS_OVERRIDE_KEY = 'homeSiteStatsOverride';
export const HOME_CLASS_STATS_OVERRIDE_KEY = 'homeClassStatsOverride';

export type HomeSiteStatsOverride = {
  students?: number | null;
  teachers?: number | null;
  graduated?: number | null;
};

export type HomeClassStatOverride = {
  current?: number | null;
  max?: number | null;
};

export type HomeClassStatsOverride = Record<string, HomeClassStatOverride>;

async function readJsonSetting<T>(key: string): Promise<T | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

async function writeJsonSetting(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: serialized },
    update: { value: serialized },
  });
}

export async function readHomeSiteStatsOverride(): Promise<HomeSiteStatsOverride> {
  const parsed = await readJsonSetting<HomeSiteStatsOverride>(HOME_SITE_STATS_OVERRIDE_KEY);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export async function readHomeClassStatsOverride(): Promise<HomeClassStatsOverride> {
  const parsed = await readJsonSetting<HomeClassStatsOverride>(HOME_CLASS_STATS_OVERRIDE_KEY);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function pickStat(override: number | null | undefined, computed: number): number {
  if (override === null || override === undefined) return computed;
  return Math.max(0, Math.floor(override));
}

export function mergeHomeSiteStats(
  computed: HomeSiteStats,
  override: HomeSiteStatsOverride,
): HomeSiteStats {
  return {
    students: pickStat(override.students, computed.students),
    teachers: pickStat(override.teachers, computed.teachers),
    graduated: pickStat(override.graduated, computed.graduated),
  };
}

export function mergeHomeClassStats(
  computed: HomeClassStats,
  override: HomeClassStatsOverride,
): HomeClassStats {
  const merged: HomeClassStats = { ...computed };
  for (const [slug, row] of Object.entries(override)) {
    const base = computed[slug];
    if (!base) continue;
    const current = pickStat(row.current, base.current);
    const max = pickStat(row.max, base.max);
    merged[slug] = {
      current,
      max,
      recruiting: max > 0 && current < max,
    };
  }
  return merged;
}

export async function writeHomeSiteStatsOverride(override: HomeSiteStatsOverride) {
  await writeJsonSetting(HOME_SITE_STATS_OVERRIDE_KEY, override);
}

export async function writeHomeClassStatsOverride(override: HomeClassStatsOverride) {
  await writeJsonSetting(HOME_CLASS_STATS_OVERRIDE_KEY, override);
}
