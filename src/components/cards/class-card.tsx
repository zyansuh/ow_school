import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { PageCard, PageCardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GameClassCard } from '@/lib/constants';

type ClassStats = { recruiting: boolean; current: number; max: number } | undefined;

type Props = {
  cls: GameClassCard;
  stats: ClassStats;
};

export function ClassCard({ cls, stats }: Props) {
  const s = stats;
  return (
    <Link href={`/classes/${cls.slug}`} className="block group h-full">
      <PageCard hover className={`min-h-[380px] overflow-hidden ${cls.laserClass}`}>
        <div className="relative h-44 sm:h-48 shrink-0 overflow-hidden">
          <Image
            src={cls.bannerImage}
            alt={cls.gameKr}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>
        <PageCardBody className="flex flex-col flex-1 gap-3 pt-4">
          <div className="flex items-center gap-3">
            <Image
              src={cls.mascotImage}
              alt={cls.name}
              width={40}
              height={40}
              sizes="40px"
              loading="lazy"
              className="rounded-full border-2 border-border shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">{cls.name}</h3>
              <p className={`text-sm ${cls.color}`}>{cls.game}</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-3">{cls.description}</p>
          <div className="flex items-center justify-between gap-2 pt-2 mt-auto">
            <Badge variant={s?.recruiting ? 'success' : 'danger'}>
              {s?.recruiting ? '모집중' : '마감'}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {s?.current ?? 0}/{s?.max ?? 0}명
            </span>
          </div>
        </PageCardBody>
      </PageCard>
    </Link>
  );
}
