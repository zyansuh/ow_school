import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { fixTeacherLinkForUser } from '@/lib/discord-sync-admin';

const schema = z.object({
  userId: z.string().min(1),
  teacherId: z.string().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminUser();
    const { userId, teacherId } = schema.parse(await req.json());
    await fixTeacherLinkForUser(userId, teacherId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
