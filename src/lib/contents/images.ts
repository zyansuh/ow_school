import { prisma } from '@/lib/prisma';
import type { ContentImageInput } from '@/lib/contents/types';

export async function syncContentImages(postId: string, images: ContentImageInput[]) {
  await prisma.contentImage.deleteMany({ where: { postId } });
  if (images.length === 0) return;

  await prisma.contentImage.createMany({
    data: images.map((img, index) => ({
      postId,
      url: img.url,
      sortOrder: img.sortOrder ?? index,
    })),
  });
}

export const contentPostInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
} as const;
