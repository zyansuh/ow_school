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
          'flex h-full min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card',
          'shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out',
          'group-hover:-translate-y-1 group-hover:border-primary/20 group-hover:shadow-card-hover',
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
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-black/50 to-black/20" />
          <div className={`absolute inset-0 ${cls.overlayTint}`} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/15" />

          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex items-center gap-2">
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

          <div className="absolute bottom-0 inset-x-0 px-5 pb-4 pt-10 sm:px-6 sm:pb-5">
            <p className="text-xs font-medium text-white/70 mb-1 tracking-wide">{cls.name}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
              {cls.gameKr}
            </h3>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-1 flex-col gap-3 min-h-[5.25rem]">
            <p className="text-[15px] sm:text-base text-foreground/90 leading-[1.65] font-medium tracking-tight">
              {cls.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 mt-5 border-t border-border/50">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Badge variant={s?.recruiting ? 'success' : 'danger'}>
                {s?.recruiting ? '모집중' : '마감'}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {s?.current ?? 0}/{s?.max ?? 0}명
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-sm font-medium shrink-0 transition-colors ${cls.linkColor}`}
            >
              자세히 보기
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
