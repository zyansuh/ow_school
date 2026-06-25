import type { ContentImage, ContentPost } from '@prisma/client';

type PostWithImages = ContentPost & { images: ContentImage[] };

export function contentSummaryFromBody(body: string, maxLen = 120): string {
  const plain = body.replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

export function serializeContentListItem(post: ContentPost): {
  id: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  createdAt: string;
} {
  return {
    id: post.id,
    title: post.title,
    summary: post.summary?.trim() || contentSummaryFromBody(post.body),
    thumbnailUrl: post.thumbnailUrl,
    createdAt: post.createdAt.toISOString(),
  };
}

export function serializeContentDetail(post: PostWithImages) {
  return {
    ...serializeContentListItem(post),
    body: post.body,
    updatedAt: post.updatedAt.toISOString(),
    published: post.published,
    images: post.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ url: img.url, sortOrder: img.sortOrder })),
  };
}
