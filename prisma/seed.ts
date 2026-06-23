import { PrismaClient } from '@prisma/client';
import { GAME_CLASSES } from '../src/lib/constants';

const prisma = new PrismaClient();

const TEACHERS = [
  { name: '김수달', mbti: 'ENFP', intro: '오버워치 힐러 전문, 팀워크 중심 멘토링', discord: 'sudal_king', slug: 'overwatch', max: 5, current: 2 },
  { name: '박탱커', mbti: 'ISTJ', intro: '탱커 포지션 전문, 포지셔닝과 궁극기 타이밍', discord: 'reinhardt_ow', slug: 'overwatch', max: 4, current: 4, active: false },
  { name: '이사자', mbti: 'ESTP', intro: '배그 솔로/스쿼드 모두 가능, 에임 트레이닝', discord: 'chicken_hunter', slug: 'pubg', max: 6, current: 1 },
  { name: '최배그', mbti: 'INTJ', intro: '맵 로테이션과 서바이벌 전략 전문', discord: 'groza_pubg', slug: 'pubg', max: 3, current: 3, active: false },
  { name: '정여우', mbti: 'ENTP', intro: '듀얼리스트 전문, 에임과 무브먼트', discord: 'jet_master', slug: 'valorant', max: 5, current: 0 },
  { name: '한발로', mbti: 'INFJ', intro: '컨트롤러/이니시에이터, 팀 전략 설계', discord: 'omen_val', slug: 'valorant', max: 4, current: 2 },
];

async function main() {
  for (const cls of GAME_CLASSES) {
    await prisma.class.upsert({
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

  for (const t of TEACHERS) {
    const cls = await prisma.class.findUnique({ where: { slug: t.slug } });
    if (!cls) continue;

    const existing = await prisma.teacher.findFirst({ where: { name: t.name, classId: cls.id } });
    if (existing) continue;

    await prisma.teacher.create({
      data: {
        name: t.name,
        mbti: t.mbti,
        intro: t.intro,
        discord: t.discord,
        classId: cls.id,
        maxStudents: t.max,
        currentStudents: t.current,
        isActive: t.active !== false,
        profileImage: `/images/mascots/${t.slug === 'overwatch' ? 'otter' : t.slug === 'pubg' ? 'lion' : 'fox'}.png`,
      },
    });
  }

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
