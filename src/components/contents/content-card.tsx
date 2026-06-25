import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { PageCard, PageCardBody, PageCardHeader } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { ContentPostListItem } from '@/lib/contents/types';

type Props = {
  post: ContentPostListItem;
  priority?: boolean;
};

export function ContentCard({ post, priority = false }: Props) {
  return (
    <Link href={`/contents/${post.id}`} className="block h-full min-w-0 group">
      <PageCard
        hover
        className="h-full flex flex-col overflow-hidden border-border/80 shadow-card group-hover:-translate-y-1 group-hover:shadow-card-hover transition-all duration-300"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted/40">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              이미지 없음
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </div>
        <PageCardHeader className="pb-2">
          <h2 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 break-keep [overflow-wrap:anywhere] leading-snug">
            {post.title}
          </h2>
        </PageCardHeader>
        <PageCardBody className="flex flex-col flex-1 gap-3 pt-0">
          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3 break-words [overflow-wrap:anywhere] leading-relaxed flex-1">
              {post.summary}
            </p>
          )}
          <p className="text-xs text-subtle flex items-center gap-1.5 mt-auto pt-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </p>
        </PageCardBody>
      </PageCard>
    </Link>
  );
}
