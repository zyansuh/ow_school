'use client';

import { GraduationCap, UserCheck, Users } from 'lucide-react';
import { GAME_CLASSES } from '@/lib/constants';
import type { HomeClassStats } from '@/lib/home/class-stats';
import type { HomeSiteStats } from '@/lib/home/stats';
import { StatCard } from '@/components/ui/stat-card';
import { ClassCard } from '@/components/cards';

const SITE_STAT_FIELDS = [
  { key: 'students' as const, label: '학생 수', icon: Users },
  { key: 'teachers' as const, label: '선생님 인원', icon: UserCheck },
  { key: 'graduated' as const, label: '졸업생 수', icon: GraduationCap },
];

type Props = {
  siteStats: HomeSiteStats;
  classStats: HomeClassStats;
};

export function HomeStatsSection({ siteStats, classStats }: Props) {
  return (
    <>
      <section id="classes" className="page-container section-gap pt-6 sm:pt-8">
        <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-1 min-w-0">
          <h2 className="heading-section text-foreground tracking-tight break-keep">클래스 소개</h2>
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

      <section className="page-container pt-2 sm:pt-4 pb-2" aria-label="커뮤니티 인원 통계">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {SITE_STAT_FIELDS.map(({ key, label, icon: Icon }) => (
            <StatCard key={key} label={label} value={siteStats[key]} suffix="명" icon={Icon} />
          ))}
        </div>
      </section>
    </>
  );
}
