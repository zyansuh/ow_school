import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { z } from 'zod';

const NOTICES_KEY = 'notices';

export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: NOTICES_KEY } });
    const items = setting?.value ? JSON.parse(setting.value) : DEFAULT_NOTICES;
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: DEFAULT_NOTICES });
  }
}

const DEFAULT_NOTICES = [
  '신입 배정은 선착순입니다',
  '정원 마감 시 선택 불가',
  '신청 후 확인 1~2일 소요',
];

const updateSchema = z.object({ items: z.array(z.string().min(1)).min(1) });

export async function PUT(req: NextRequest) {
  try {
    await requireAdminUser();
    const { items } = updateSchema.parse(await req.json());
    await prisma.siteSetting.upsert({
      where: { key: NOTICES_KEY },
      create: { key: NOTICES_KEY, value: JSON.stringify(items) },
      update: { value: JSON.stringify(items) },
    });
    return NextResponse.json({ items });
  } catch (e) {
    return apiError(e);
  }
}
