import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import {
  listSavedViews,
  loadCustomSavedViews,
  saveCustomSavedViews,
  type SavedView,
} from '@/lib/admin/saved-views';

export async function GET() {
  try {
    await requireAdminUser();
    const views = await listSavedViews();
    return NextResponse.json({ views });
  } catch (e) {
    return apiError(e);
  }
}

const postSchema = z.object({
  name: z.string().min(1).max(40),
  href: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = postSchema.parse(await req.json());
    const href = body.href.startsWith('/admin') ? body.href : `/admin${body.href.startsWith('/') ? '' : '/'}${body.href}`;
    const custom = await loadCustomSavedViews();
    const next: SavedView = {
      id: `custom-${Date.now()}`,
      name: body.name.trim(),
      href,
      builtin: false,
    };
    const saved = await saveCustomSavedViews([...custom, next]);
    return NextResponse.json({ views: await listSavedViews(), created: next, custom: saved });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = deleteSchema.parse(await req.json());
    if (body.id.startsWith('builtin-')) {
      return NextResponse.json({ error: '기본 프리셋은 삭제할 수 없습니다' }, { status: 400 });
    }
    const custom = await loadCustomSavedViews();
    const saved = await saveCustomSavedViews(custom.filter((v) => v.id !== body.id));
    return NextResponse.json({ views: await listSavedViews(), custom: saved });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
