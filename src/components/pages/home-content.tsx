import Link from 'next/link';
import Image from 'next/image';
import { unstable_cache } from 'next/cache';
import { Megaphone, Users, GraduationCap, UserCheck } from 'lucide-react';
import { GAME_CLASSES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { DEFAULT_NOTICES } from '@/lib/db-fallbacks';
import { getHomeClassStats } from '@/lib/home-class-stats';
import { getHomeSiteStats } from '@/lib/home-stats';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site-brand';
import { Button } from '@/components/ui/button';
import { Card, PageCardBody } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { ClassCard } from '@/components/cards';
import { ds } from '@/styles/design-system';

const getNotices = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'notices' } });
      if (!setting?.value) return DEFAULT_NOTICES;
      return JSON.parse(setting.value) as string[];
    } catch (e) {
      console.error('[home] getNotices failed:', e);
      return DEFAULT_NOTICES;
    }
  },
  ['home-notices'],
  { revalidate: 120 },
);

export async function HomeContent() {
  const [stats, notices, siteStats] = await Promise.all([
    getHomeClassStats(),
    getNotices(),
    getHomeSiteStats(),
  ]);

  return (
    <div className="section-gap pb-24 sm:pb-28 page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="page-container relative z-10 py-16 sm:py-24 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo/logo-peaceful-gaming-village.webp"
              alt={SITE_NAME}
              width={72}
              height={72}
              priority
              sizes="72px"
              className="rounded-2xl border border-border shadow-card"
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            {SITE_NAME}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-primary/90 mb-3">
            {SITE_TAGLINE}
          </p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-2">
            오버워치 · 배틀그라운드 · 발로란트를 함께 배우고
            <br className="sm:hidden" /> 함께 성장하는 게임 클래스
          </p>
          <p className="text-sm text-subtle max-w-lg mx-auto mb-8">
            수달반 · 사자반 · 여우반 — 평겜마 Discord 멘토링 커뮤니티
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto min-w-[160px]">
              <Link href="/apply">수강 신청</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto min-w-[160px]">
              <Link href="/teachers">선생님 보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Site stats */}
      <section className="page-container -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="학생 수" value={siteStats.students} suffix="명" icon={Users} />
          <StatCard label="선생님 수" value={siteStats.teachers} suffix="명" icon={UserCheck} />
          <StatCard label="졸업생 수" value={siteStats.graduated} suffix="명" icon={GraduationCap} />
        </div>
      </section>

      {/* Classes */}
      <section id="classes" className="page-container section-gap pt-4">
        <div className="text-center mb-8">
          <h2 className="heading-section text-foreground mb-2">클래스 소개</h2>
          <p className="text-sm text-muted-foreground">
            오버워치 · PUBG · 발로란트 — 게임별 반을 선택하고 담당 선생님을 만나보세요
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {GAME_CLASSES.map((cls, i) => (
            <ClassCard key={cls.slug} cls={cls} stats={stats[cls.slug]} priority={i === 0} />
          ))}
        </div>
      </section>

      {/* Notices */}
      <section className="page-container">
        <Card className={`${ds.card} mx-auto w-full max-w-[900px]`}>
          <PageCardBody>
            <h3 className="heading-section text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-warning" aria-hidden />
              공지사항
            </h3>
            <ul className="text-muted-foreground text-sm space-y-2.5">
              {notices.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-primary shrink-0">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </PageCardBody>
        </Card>
      </section>
    </div>
  );
}
