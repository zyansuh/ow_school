import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { contentPostInclude, syncContentImages } from '@/lib/contents/images';
import { serializeContentDetail } from '@/lib/contents/serialize';

const imageSchema = z.object({
  url: z.string().url(),
  sortOrder: z.number().int().min(0),
});

const postSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(200),
  summary: z.string().max(300).optional().nullable(),
  body: z.string().max(50000).optional().default(''),
  thumbnailUrl: z.string().url().optional().nullable(),
  published: z.boolean().optional().default(true),
  images: z.array(imageSchema).optional().default([]),
});

export async function GET() {
  try {
    await requireAdminUser();
    const posts = await prisma.contentPost.findMany({
      include: contentPostInclude,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(posts.map(serializeContentDetail));
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = postSchema.parse(await req.json());
    const { images, summary, thumbnailUrl, ...rest } = body;

    const post = await prisma.contentPost.create({
      data: {
        ...rest,
        summary: summary?.trim() || null,
        thumbnailUrl: thumbnailUrl ?? images[0]?.url ?? null,
      },
    });

    await syncContentImages(post.id, images);
    const refreshed = await prisma.contentPost.findUniqueOrThrow({
      where: { id: post.id },
      include: contentPostInclude,
    });

    return NextResponse.json(serializeContentDetail(refreshed));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
