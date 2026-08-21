import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { loadOpsNotes, saveOpsNotes } from '@/lib/admin/ops-notes';

export async function GET() {
  try {
    await requireAdminUser();
    const notes = await loadOpsNotes();
    return NextResponse.json(notes);
  } catch (e) {
    return apiError(e);
  }
}

const putSchema = z.object({
  classes: z.record(z.string()).optional(),
  teachers: z.record(z.string()).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = putSchema.parse(await req.json());
    const current = await loadOpsNotes();
    const notes = await saveOpsNotes({
      classes: { ...current.classes, ...(body.classes ?? {}) },
      teachers: { ...current.teachers, ...(body.teachers ?? {}) },
    });
    return NextResponse.json(notes);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
