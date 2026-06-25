'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Pencil, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { GAME_CLASSES } from '@/lib/constants';
import type { HomeClassStats } from '@/lib/home/class-stats';
import type { HomeSiteStats } from '@/lib/home/stats';
import type { HomeClassStatsOverride, HomeSiteStatsOverride } from '@/lib/home/site-stats-override';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClassCard } from '@/components/cards';
import { cn } from '@/lib/utils';

type SiteBundle = {
  computed: HomeSiteStats;
  override: HomeSiteStatsOverride;
  display: HomeSiteStats;
};

type ClassesBundle = {
  computed: HomeClassStats;
  override: HomeClassStatsOverride;
  display: HomeClassStats;
};

type HomeStatsPayload = {
  site: SiteBundle;
  classes: ClassesBundle;
};

type SiteDraft = {
  students: string;
  teachers: string;
  graduated: string;
  studentsAuto: boolean;
  teachersAuto: boolean;
  graduatedAuto: boolean;
};

type ClassDraftRow = {
  current: string;
  max: string;
  currentAuto: boolean;
  maxAuto: boolean;
};

const SITE_FIELDS = [
  { key: 'students' as const, label: '학생 수', icon: Users },
  { key: 'teachers' as const, label: '반장 수', icon: UserCheck },
  { key: 'graduated' as const, label: '졸업생 수', icon: GraduationCap },
];

function toDraftValue(override: number | null | undefined, computed: number, auto: boolean): string {
  if (auto || override === null || override === undefined) return String(computed);
  return String(override);
}

function buildSiteDraft(site: SiteBundle): SiteDraft {
  const studentsAuto = site.override.students === undefined || site.override.students === null;
  const teachersAuto = site.override.teachers === undefined || site.override.teachers === null;
  const graduatedAuto = site.override.graduated === undefined || site.override.graduated === null;
  return {
    studentsAuto,
    teachersAuto,
    graduatedAuto,
    students: toDraftValue(site.override.students, site.computed.students, studentsAuto),
    teachers: toDraftValue(site.override.teachers, site.computed.teachers, teachersAuto),
    graduated: toDraftValue(site.override.graduated, site.computed.graduated, graduatedAuto),
  };
}

function buildClassDraft(classes: ClassesBundle): Record<string, ClassDraftRow> {
  return Object.fromEntries(
    GAME_CLASSES.map((cls) => {
      const computed = classes.computed[cls.slug] ?? { current: 0, max: 0 };
      const override = classes.override[cls.slug] ?? {};
      const currentAuto = override.current === undefined || override.current === null;
      const maxAuto = override.max === undefined || override.max === null;
      return [
        cls.slug,
        {
          currentAuto,
          maxAuto,
          current: toDraftValue(override.current, computed.current, currentAuto),
          max: toDraftValue(override.max, computed.max, maxAuto),
        },
      ];
    }),
  );
}

function parseCount(raw: string, auto: boolean): number | null {
  if (auto) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error('0 이상의 숫자를 입력하세요');
  return Math.floor(n);
}

type Props = {
  siteStats: HomeSiteStats;
  classStats: HomeClassStats;
  isAdmin: boolean;
};

export function HomeStatsSection({ siteStats, classStats, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payload, setPayload] = useState<HomeStatsPayload | null>(null);
  const [siteDraft, setSiteDraft] = useState<SiteDraft | null>(null);
  const [classDraft, setClassDraft] = useState<Record<string, ClassDraftRow> | null>(null);
  const [activeField, setActiveField] = useState<keyof HomeSiteStats | null>(null);

  const openEditor = useCallback(async (field?: keyof HomeSiteStats) => {
    setLoading(true);
    setActiveField(field ?? null);
    try {
      const res = await fetch('/api/admin/stats/home');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '통계를 불러오지 못했습니다');
      setPayload(data);
      setSiteDraft(buildSiteDraft(data.site));
      setClassDraft(buildClassDraft(data.classes));
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '통계를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async () => {
    if (!siteDraft || !classDraft) return;
    setSaving(true);
    try {
      const site = {
        students: parseCount(siteDraft.students, siteDraft.studentsAuto),
        teachers: parseCount(siteDraft.teachers, siteDraft.teachersAuto),
        graduated: parseCount(siteDraft.graduated, siteDraft.graduatedAuto),
      };
      const classes = Object.fromEntries(
        GAME_CLASSES.map((cls) => {
          const row = classDraft[cls.slug];
          return [
            cls.slug,
            {
              current: parseCount(row.current, row.currentAuto),
              max: parseCount(row.max, row.maxAuto),
            },
          ];
        }),
      );

      const res = await fetch('/api/admin/stats/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, classes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');

      toast.success('메인 통계가 저장되었습니다');
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="page-container -mt-5 sm:-mt-8 relative z-20">
        {isAdmin && (
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={loading}
              onClick={() => void openEditor()}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {loading ? '불러오는 중…' : '통계 수정'}
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {SITE_FIELDS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="relative min-w-0">
              {isAdmin ? (
                <button
                  type="button"
                  className="block w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => void openEditor(key)}
                  aria-label={`${label} 수정`}
                >
                  <StatCard label={label} value={siteStats[key]} suffix="명" icon={Icon} className="cursor-pointer" />
                  <span className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/80 border border-border text-muted-foreground pointer-events-none">
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                </button>
              ) : (
                <StatCard label={label} value={siteStats[key]} suffix="명" icon={Icon} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="classes" className="page-container section-gap pt-6 sm:pt-8">
        <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-1 min-w-0">
          <div className="flex flex-col items-center gap-3">
            <h2 className="heading-section text-foreground tracking-tight break-keep">클래스 소개</h2>
            {isAdmin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={loading}
                onClick={() => void openEditor()}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                클래스 인원 수정
              </Button>
            )}
          </div>
          <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed text-balance break-keep mt-3">
            오버워치 · PUBG · 발로란트 — 게임별 반을 선택하고 담당 반장을 만나보세요
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 items-stretch">
          {GAME_CLASSES.map((cls, i) => (
            <ClassCard key={cls.slug} cls={cls} stats={classStats[cls.slug]} priority={i === 0} />
          ))}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>메인 홈 통계 수정</DialogTitle>
            <DialogDescription>
              표시용 숫자만 변경됩니다. 학생·반장·신청 등 DB 데이터는 수정되지 않습니다.
              빈 칸 또는 「DB 자동」은 실제 집계 값을 표시합니다.
            </DialogDescription>
          </DialogHeader>

          {payload && siteDraft && classDraft && (
            <div className="space-y-6 mt-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">상단 통계</h3>
                {SITE_FIELDS.map(({ key, label }) => {
                  const autoKey = `${key}Auto` as keyof SiteDraft;
                  const valueKey = key;
                  const isAuto = siteDraft[autoKey] as boolean;
                  const computed = payload.site.computed[key];
                  const focused = !activeField || activeField === key;
                  return (
                    <div
                      key={key}
                      className={cn('space-y-2 rounded-lg border border-border p-3', !focused && 'opacity-70')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">{label}</Label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAuto}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSiteDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      [autoKey]: checked,
                                      [valueKey]: checked
                                        ? String(computed)
                                        : prev[valueKey],
                                    }
                                  : prev,
                              );
                            }}
                          />
                          DB 자동 ({computed}명)
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        disabled={isAuto}
                        value={siteDraft[valueKey]}
                        onChange={(e) =>
                          setSiteDraft((prev) => (prev ? { ...prev, [valueKey]: e.target.value } : prev))
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">클래스 카드 인원</h3>
                {GAME_CLASSES.map((cls) => {
                  const row = classDraft[cls.slug];
                  const computed = payload.classes.computed[cls.slug] ?? { current: 0, max: 0 };
                  return (
                    <div key={cls.slug} className="rounded-lg border border-border p-3 space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        {cls.emoji} {cls.name} ({cls.gameKr})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">현재 인원</Label>
                            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.currentAuto}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setClassDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          [cls.slug]: {
                                            ...prev[cls.slug],
                                            currentAuto: checked,
                                            current: checked ? String(computed.current) : prev[cls.slug].current,
                                          },
                                        }
                                      : prev,
                                  );
                                }}
                              />
                              DB ({computed.current})
                            </label>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            disabled={row.currentAuto}
                            value={row.current}
                            onChange={(e) =>
                              setClassDraft((prev) =>
                                prev
                                  ? { ...prev, [cls.slug]: { ...prev[cls.slug], current: e.target.value } }
                                  : prev,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">정원</Label>
                            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.maxAuto}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setClassDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          [cls.slug]: {
                                            ...prev[cls.slug],
                                            maxAuto: checked,
                                            max: checked ? String(computed.max) : prev[cls.slug].max,
                                          },
                                        }
                                      : prev,
                                  );
                                }}
                              />
                              DB ({computed.max})
                            </label>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            disabled={row.maxAuto}
                            value={row.max}
                            onChange={(e) =>
                              setClassDraft((prev) =>
                                prev
                                  ? { ...prev, [cls.slug]: { ...prev[cls.slug], max: e.target.value } }
                                  : prev,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button className="w-full" onClick={() => void save()} disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
