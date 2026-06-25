import type { PrismaClient } from '@prisma/client';
import { GAME_CLASSES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

/** 수달반·사자반·여우반 — DB에 없으면 생성 (seed 없이 db push만 한 경우 대비) */
export async function ensureGameClasses(client: PrismaClient = prisma) {
  for (const cls of GAME_CLASSES) {
    await client.class.upsert({
      where: { slug: cls.slug },
      create: {
        slug: cls.slug,
        name: cls.name,
        game: cls.game,
        gameKr: cls.gameKr,
        description: cls.description,
      },
      update: {
        name: cls.name,
        game: cls.game,
        gameKr: cls.gameKr,
        description: cls.description,
      },
    });
  }
}
