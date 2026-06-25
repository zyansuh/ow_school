import Image from 'next/image';
import { unstable_cache } from 'next/cache';
import { Megaphone } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DEFAULT_NOTICES } from '@/lib/db-fallbacks';
import { getHomeClassStats } from '@/lib/home/class-stats';
import { getHomeSiteStats } from '@/lib/home/stats';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site-brand';
import { auth } from '@/lib/auth';
import { Card, PageCardBody } from '@/components/ui/card';
import { HomeStatsSection } from '@/components/home/home-site-stats';
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
  const [stats, notices, siteStats, session] = await Promise.all([
    getHomeClassStats(),
    getNotices(),
    getHomeSiteStats(),
    auth(),
  ]);
  const isAdmin = !!session?.user?.isAdmin;

  return (
    <div className="section-gap pb-24 sm:pb-28 page-enter">
      {/* Hero — 정착지원국 소개 */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-15%,rgba(88,101,242,0.14),transparent)] pointer-events-none" />
        <div className="page-container relative z-10 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto w-full min-w-0 max-w-2xl text-center px-0.5">
            <div className="flex justify-center mb-6 sm:mb-8">
              <Image
                src="/images/logo/logo-peaceful-gaming-village.webp"
                alt={SITE_NAME}
                width={72}
                height={72}
                priority
                sizes="72px"
                className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-2xl border border-border/70 shadow-card"
              />
            </div>

            <h1 className="text-[1.875rem] sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-foreground leading-[1.2] break-keep text-balance">
              {SITE_NAME}
            </h1>
            <p className="mt-2.5 sm:mt-3 text-base sm:text-xl font-medium text-primary/90 tracking-tight break-keep">
              {SITE_TAGLINE}
            </p>

            <div className="mt-7 sm:mt-10 mx-auto w-full min-w-0 max-w-lg space-y-3.5 sm:space-y-4 text-center px-1">
              <p className="text-body-ko text-muted-foreground">
                평겜마에서 적응 할 수 있도록 도와주는 분들이 담당 반장입니다.
              </p>
              <p className="text-body-ko text-foreground/90 font-medium">
                각 반마다 담당 반장들이 여러분을 기다리고 있습니다
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeStatsSection siteStats={siteStats} classStats={stats} isAdmin={isAdmin} />

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
