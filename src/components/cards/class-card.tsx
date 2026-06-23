import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { GameClassCard } from '@/lib/constants';

type ClassStats = { recruiting: boolean; current: number; max: number } | undefined;

type Props = {
  cls: GameClassCard;
  stats: ClassStats;
  priority?: boolean;
};

export function ClassCard({ cls, stats, priority = false }: Props) {
  const s = stats;

  return (
    <Link href={`/classes/${cls.slug}`} className="block h-full group">
      <article
        className={[
          'flex h-full min-h-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card',
          'shadow-card transition-all duration-300 ease-out',
          'group-hover:-translate-y-1.5 group-hover:border-primary/25 group-hover:shadow-card-hover',
          cls.accentRing,
        ].join(' ')}
      >
        {/* Promo banner */}
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
          <Image
            src={cls.bannerImage}
            alt={`${cls.gameKr} 클래스`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* 다크 + 게임별 컬러 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-black/45 to-black/25" />
          <div className={`absolute inset-0 ${cls.overlayTint}`} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/20" />

          {/* 상단 게임 태그 */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-md border ${cls.tagClass}`}
            >
              {cls.game}
            </span>
            <Image
              src={cls.mascotImage}
              alt=""
              width={28}
              height={28}
              className="rounded-full border border-white/20 shadow-md opacity-90"
              aria-hidden
            />
          </div>

          {/* 배너 타이틀 */}
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-medium text-white/75 mb-0.5">{cls.name}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {cls.gameKr}
            </h3>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2 sm:line-clamp-3">
            {cls.description}
          </p>

          <div className="flex items-center justify-between gap-3 pt-1 mt-auto border-t border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={s?.recruiting ? 'success' : 'danger'}>
                {s?.recruiting ? '모집중' : '마감'}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {s?.current ?? 0}/{s?.max ?? 0}명
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-sm font-medium shrink-0 transition-colors ${cls.linkColor}`}
            >
              자세히 보기
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
