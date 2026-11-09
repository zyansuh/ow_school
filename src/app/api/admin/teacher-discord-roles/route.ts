import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import {
  DEFAULT_TEACHER_DISCORD_ROLES,
  getTeacherDiscordRoles,
  normalizeTeacherDiscordRoles,
  saveTeacherDiscordRoles,
} from '@/lib/teacher/discord-roles';

const bodySchema = z.object({
  roles: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        priority: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(20),
});

export async function GET() {
  try {
    await requireAdminUser();
    const roles = await getTeacherDiscordRoles();
    return NextResponse.json({ roles, defaults: DEFAULT_TEACHER_DISCORD_ROLES });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = bodySchema.parse(await req.json());
    const roles = await saveTeacherDiscordRoles(normalizeTeacherDiscordRoles(body.roles));
    return NextResponse.json({ roles });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
