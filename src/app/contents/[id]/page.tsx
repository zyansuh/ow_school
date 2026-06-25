import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { ContentImageGallery } from '@/components/contents/content-image-gallery';
import { prisma } from '@/lib/prisma';
import { contentPostInclude } from '@/lib/contents/images';
import { serializeContentDetail } from '@/lib/contents/serialize';
import { formatDate } from '@/lib/utils';
import { ds } from '@/styles/design-system';

export const dynamic = 'force-dynamic';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.contentPost.findFirst({
    where: { id, published: true },
    include: contentPostInclude,
  });

  if (!post) notFound();
  const data = serializeContentDetail(post);

  return (
    <MainLayout>
      <article className="page-container py-8 sm:py-12 max-w-4xl mx-auto section-gap">
        <Button variant="ghost" asChild className="text-muted-foreground -ml-2">
          <Link href="/contents">
            <ArrowLeft className="h-4 w-4" /> 컨텐츠 소개
          </Link>
        </Button>

        <header className="space-y-4 border-b border-border pb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight break-keep [overflow-wrap:anywhere]">
            {data.title}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <time dateTime={data.createdAt}>{formatDate(data.createdAt)}</time>
          </p>
        </header>

        {data.images.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">갤러리</h2>
            <ContentImageGallery images={data.images} title={data.title} />
          </section>
        )}

        {data.body.trim() && (
          <section className={`${ds.card} ${ds.cardPad} space-y-4`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">소개</h2>
            <div className="prose-content text-foreground text-base sm:text-[1.05rem] leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
              {data.body}
            </div>
          </section>
        )}
      </article>
    </MainLayout>
  );
}
