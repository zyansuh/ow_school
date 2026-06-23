import { NextRequest, NextResponse } from 'next/server';
import { grantAdmin, revokeAdmin } from '@/lib/rbac';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { userDisplayName } from '@/lib/user-display';
import { z } from 'zod';

export async function GET() {
  try {
    await requireAdminUser();
    const roles = await prisma.adminRole.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(
      roles.map((r) => ({
        ...r,
        user: {
          ...r.user,
          displayName: userDisplayName(r.user),
        },
      })),
    );
  } catch (e) {
    return apiError(e);
  }
}

const actionSchema = z.object({
  action: z.enum(['grant', 'revoke']),
  userId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const { action, userId } = actionSchema.parse(await req.json());

    if (action === 'grant') {
      await grantAdmin(userId, admin.id);
    } else {
      await revokeAdmin(userId, admin.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
