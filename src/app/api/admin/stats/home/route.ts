import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { GAME_CLASSES } from '@/lib/constants';
import { getHomeClassStatsComputed, type HomeClassStats } from '@/lib/home/class-stats';
import { getHomeSiteStatsComputed } from '@/lib/home/stats';
import {
  mergeHomeClassStats,
  mergeHomeSiteStats,
  readHomeClassStatsOverride,
  readHomeSiteStatsOverride,
  writeHomeClassStatsOverride,
  writeHomeSiteStatsOverride,
  type HomeClassStatsOverride,
  type HomeSiteStatsOverride,
} from '@/lib/home/site-stats-override';

const nullableCount = z.union([z.number().int().min(0).max(9999), z.null()]).optional();

const putSchema = z.object({
  site: z
    .object({
      students: nullableCount,
      teachers: nullableCount,
      graduated: nullableCount,
    })
    .optional(),
  classes: z
    .record(
      z.string(),
      z.object({
        current: nullableCount,
        max: nullableCount,
      }),
    )
    .optional(),
});

function sanitizeSiteOverride(input: z.infer<typeof putSchema>['site']): HomeSiteStatsOverride {
  if (!input) return {};
  const next: HomeSiteStatsOverride = {};
  if (input.students !== undefined) next.students = input.students;
  if (input.teachers !== undefined) next.teachers = input.teachers;
  if (input.graduated !== undefined) next.graduated = input.graduated;
  return next;
}

function sanitizeClassOverride(input: z.infer<typeof putSchema>['classes']): HomeClassStatsOverride {
  if (!input) return {};
  const allowed = new Set(GAME_CLASSES.map((c) => c.slug));
  const next: HomeClassStatsOverride = {};
  for (const [slug, row] of Object.entries(input)) {
    if (!allowed.has(slug as (typeof GAME_CLASSES)[number]['slug'])) continue;
    const entry: HomeClassStatsOverride[string] = {};
    if (row.current !== undefined) entry.current = row.current;
    if (row.max !== undefined) entry.max = row.max;
    if (Object.keys(entry).length > 0) next[slug] = entry;
  }
  return next;
}

function pruneSiteOverride(override: HomeSiteStatsOverride): HomeSiteStatsOverride {
  const next: HomeSiteStatsOverride = {};
  if (override.students !== undefined && override.students !== null) next.students = override.students;
  if (override.teachers !== undefined && override.teachers !== null) next.teachers = override.teachers;
  if (override.graduated !== undefined && override.graduated !== null) next.graduated = override.graduated;
  return next;
}

function pruneClassOverride(override: HomeClassStatsOverride): HomeClassStatsOverride {
  const next: HomeClassStatsOverride = {};
  for (const [slug, row] of Object.entries(override)) {
    const entry: HomeClassStatsOverride[string] = {};
    if (row.current !== undefined && row.current !== null) entry.current = row.current;
    if (row.max !== undefined && row.max !== null) entry.max = row.max;
    if (Object.keys(entry).length > 0) next[slug] = entry;
  }
  return next;
}

export async function GET() {
  try {
    await requireAdminUser();
    const [computedSite, computedClasses, siteOverride, classOverride] = await Promise.all([
      getHomeSiteStatsComputed(),
      getHomeClassStatsComputed(),
      readHomeSiteStatsOverride(),
      readHomeClassStatsOverride(),
    ]);

    const displaySite = mergeHomeSiteStats(computedSite, siteOverride);
    const displayClasses = mergeHomeClassStats(computedClasses, classOverride);

    return NextResponse.json({
      site: {
        computed: computedSite,
        override: siteOverride,
        display: displaySite,
      },
      classes: {
        computed: computedClasses,
        override: classOverride,
        display: displayClasses,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = putSchema.parse(await req.json());

    const [existingSite, existingClasses] = await Promise.all([
      readHomeSiteStatsOverride(),
      readHomeClassStatsOverride(),
    ]);

    const mergedSite = pruneSiteOverride({ ...existingSite, ...sanitizeSiteOverride(body.site) });
    const mergedClasses = pruneClassOverride({ ...existingClasses, ...sanitizeClassOverride(body.classes) });

    await Promise.all([
      writeHomeSiteStatsOverride(mergedSite),
      writeHomeClassStatsOverride(mergedClasses),
    ]);

    revalidateTag('home-site-stats');
    revalidateTag('home-class-stats');

    const [computedSite, computedClasses] = await Promise.all([
      getHomeSiteStatsComputed(),
      getHomeClassStatsComputed(),
    ]);

    return NextResponse.json({
      ok: true,
      site: {
        computed: computedSite,
        override: mergedSite,
        display: mergeHomeSiteStats(computedSite, mergedSite),
      },
      classes: {
        computed: computedClasses as HomeClassStats,
        override: mergedClasses,
        display: mergeHomeClassStats(computedClasses, mergedClasses),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
