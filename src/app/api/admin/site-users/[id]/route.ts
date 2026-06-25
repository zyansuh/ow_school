import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { adminUserDisplayName, guildNicknameOnly, normalizeNickFields } from '@/lib/user-display';

const patchSchema = z.object({
  displayNickname: z.string().max(32).nullable(),
});

/** 표시 닉네임만 수정 — 다른 User 필드는 변경하지 않음 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        displayNickname: body.displayNickname?.trim() || null,
      },
    });

    const fields = normalizeNickFields(updated);
    return NextResponse.json({
      id: updated.id,
      displayNickname: updated.displayNickname,
      displayName: adminUserDisplayName(fields),
      guildNickname: guildNicknameOnly(fields) ?? '-',
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: '입력값 오류' }, { status: 400 });
    }
    return apiError(e);
  }
}
