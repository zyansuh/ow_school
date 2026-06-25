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

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(300).optional().nullable(),
  body: z.string().max(50000).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  published: z.boolean().optional(),
  images: z.array(imageSchema).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const { images, summary, thumbnailUrl, ...rest } = body;

    const existing = await prisma.contentPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    await prisma.contentPost.update({
      where: { id },
      data: {
        ...rest,
        ...(summary !== undefined ? { summary: summary?.trim() || null } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
      },
    });

    if (images) {
      await syncContentImages(id, images);
      if (thumbnailUrl === undefined && images[0] && !existing.thumbnailUrl) {
        await prisma.contentPost.update({
          where: { id },
          data: { thumbnailUrl: images[0].url },
        });
      }
    }

    const refreshed = await prisma.contentPost.findUniqueOrThrow({
      where: { id },
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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const existing = await prisma.contentPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }
    await prisma.contentPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
