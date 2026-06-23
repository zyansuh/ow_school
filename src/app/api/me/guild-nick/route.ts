import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, requireUser } from '@/lib/api-helpers';
import { getGuildConfig, syncUserGuildData, updateGuildNickname } from '@/lib/discord-guild';

const schema = z.object({
  nick: z
    .string()
    .min(1, '닉네임을 입력하세요')
    .max(32, '닉네임은 32자 이하입니다')
    .nullable()
    .optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireUser();
    if (!getGuildConfig()) {
      return NextResponse.json({ error: 'Discord 서버 연동이 설정되지 않았습니다' }, { status: 503 });
    }

    const body = schema.parse(await req.json());
    const nick = body.nick === undefined ? null : body.nick;

    const info = await updateGuildNickname(sessionUser.discordId, nick);

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    return NextResponse.json({
      serverNick: info.serverNick,
      roleNames: info.roleNames,
      isInGuild: info.isInGuild,
      user,
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'NOT_IN_GUILD') {
        return NextResponse.json({ error: '디스코드 서버에 가입되어 있지 않습니다' }, { status: 403 });
      }
      if (e.message === 'BOT_PERMISSION_DENIED') {
        return NextResponse.json({ error: '봇에 닉네임 변경 권한이 없습니다' }, { status: 403 });
      }
      if (e.message === 'NICK_UPDATE_FAILED') {
        return NextResponse.json({ error: '닉네임 변경에 실패했습니다' }, { status: 502 });
      }
    }
    return apiError(e);
  }
}

export async function POST() {
  try {
    const sessionUser = await requireUser();
    if (!getGuildConfig()) {
      return NextResponse.json({ error: 'Discord 서버 연동이 설정되지 않았습니다' }, { status: 503 });
    }

    const info = await syncUserGuildData(sessionUser.discordId);
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    return NextResponse.json({ ...info, user });
  } catch (e) {
    return apiError(e);
  }
}
