import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeContentListItem } from '@/lib/contents/serialize';
import { CONTENT_FEED_PAGE_SIZE } from '@/lib/contents/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get('cursor');
  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? CONTENT_FEED_PAGE_SIZE);
  const limit = Math.min(Math.max(limitRaw, 1), 24);

  const posts = await prisma.contentPost.findMany({
    where: { published: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({
    items: items.map(serializeContentListItem),
    nextCursor,
    hasMore,
  });
}
