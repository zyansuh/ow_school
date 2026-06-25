import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contentPostInclude } from '@/lib/contents/images';
import { serializeContentDetail } from '@/lib/contents/serialize';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.contentPost.findFirst({
    where: { id, published: true },
    include: contentPostInclude,
  });

  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(serializeContentDetail(post));
}
