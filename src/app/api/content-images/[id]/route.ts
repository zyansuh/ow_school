import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.contentUploadedFile.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 });
  }

  return new NextResponse(row.data, {
    headers: {
      'Content-Type': row.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(row.size),
    },
  });
}
