import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { getGuildConfig } from '@/lib/discord-guild';

async function columnExists(table: string, column: string) {
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `;
  return rows.length > 0;
}

export async function GET() {
  try {
    await requireAdminUser();

    const [teacherDiscordUserId, siteDisplayNameExists, teachersMissingDiscordUserId] = await Promise.all([
      columnExists('Teacher', 'discordUserId'),
      columnExists('User', 'siteDisplayName'),
      prisma.teacher.count({ where: { discordUserId: null } }),
    ]);

    let adminRoleRequestTable = false;
    try {
      await prisma.adminRoleRequest.findFirst({ select: { id: true } });
      adminRoleRequestTable = true;
    } catch {
      adminRoleRequestTable = false;
    }

    return NextResponse.json({
      schema: {
        teacherDiscordUserId,
        siteDisplayNameRemoved: !siteDisplayNameExists,
        adminRoleRequestTable,
      },
      discord: {
        guildConfigured: !!getGuildConfig(),
        webhookConfigured: !!process.env.DISCORD_WEBHOOK_URL?.trim(),
        cronConfigured: !!process.env.CRON_SECRET?.trim(),
      },
      teachersMissingDiscordUserId,
      readyForSync: teacherDiscordUserId,
    });
  } catch (e) {
    return apiError(e);
  }
}
