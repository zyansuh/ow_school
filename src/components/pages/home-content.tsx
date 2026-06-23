import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Megaphone, Gamepad2, Users } from 'lucide-react';
import { GAME_CLASSES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

async function getClassStats() {
  const classes = await prisma.class.findMany({
    include: { teachers: { where: { isActive: true } } },
  });
  return Object.fromEntries(
    classes.map((c) => [
      c.slug,
      {
        recruiting: c.teachers.some((t) => t.currentStudents < t.maxStudents),
        current: c.teachers.reduce((s, t) => s + t.currentStudents, 0),
        max: c.teachers.reduce((s, t) => s + t.maxStudents, 0),
      },
    ]),
  );
}

async function getNotices() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'notices' } });
  if (!setting?.value) {
    return ['신입 배정은 선착순입니다', '정원 마감 시 선택 불가', '신청 후 확인 1~2일 소요'];
  }
  try {
    return JSON.parse(setting.value) as string[];
  } catch {
    return ['신입 배정은 선착순입니다', '정원 마감 시 선택 불가', '신청 후 확인 1~2일 소요'];
  }
}

export async function HomeContent() {
  const [stats, notices] = await Promise.all([getClassStats(), getNotices()]);

  return (
    <div className="section-gap pb-16">
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-28">
        <div className="page-container relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/images/logo/logo-peaceful-gaming-village.png" alt="OW School" width={80} height={80} className="rounded-2xl" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            OW School
          </h1>
          <p className="text-base sm:text-xl text-gray-300 mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="h-5 w-5 text-purple-400" />
            평화로운 게임마을 · 담당선생님 배정
          </p>
          <p className="text-sm text-gray-400 max-w-xl mx-auto mb-8">
            수달반 · 사자반 · 여우반과 함께 게임 실력을 키워보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg"><Link href="/apply">수강 신청</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/teachers">선생님 둘러보기</Link></Button>
          </div>
        </div>
      </section>

      <section id="classes" className="page-container section-gap">
        <h2 className="heading-section text-center text-gray-100 mb-8">클래스 소개</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {GAME_CLASSES.map((cls) => {
            const s = stats[cls.slug];
            return (
              <Link key={cls.slug} href={`/classes/${cls.slug}`} className="block group h-full">
                <Card className={`h-full flex flex-col overflow-hidden border ${cls.borderColor} ${cls.hoverBorder} transition-all duration-300 hover:shadow-xl ${cls.bgGlow} hover:-translate-y-1 bg-gray-900/80 ${cls.laserClass}`}>
                  <div className="relative h-44 sm:h-52 shrink-0 overflow-hidden">
                    <Image src={cls.bannerImage} alt={cls.gameKr} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-gray-900/90 to-transparent" />
                  </div>
                  <div className="card-pad flex flex-col flex-1 gap-3">
                    <div className="flex items-center gap-3">
                      <Image src={cls.mascotImage} alt={cls.name} width={40} height={40} className="rounded-full border-2 border-gray-700 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-100">{cls.name}</h3>
                        <p className={`text-sm ${cls.color}`}>{cls.game}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed flex-1 min-h-[2.5rem]">{cls.description}</p>
                    <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
                      <Badge variant={s?.recruiting ? 'success' : 'danger'}>
                        {s?.recruiting ? '모집중' : '마감'}
                      </Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s?.current ?? 0}/{s?.max ?? 0}명
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page-container">
        <Link href="/interview" className="block max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/90 hover:to-blue-500/90 border border-purple-400/30 rounded-xl card-pad text-center transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ClipboardList className="h-6 w-6 text-white" />
              <h3 className="text-xl sm:text-2xl font-bold text-white">졸업면담지 작성</h3>
            </div>
            <p className="text-purple-200 text-sm">졸업 면담을 작성해주세요</p>
          </div>
        </Link>
      </section>

      <section className="page-container">
        <Card className="bg-gray-900/50 border-gray-800 max-w-2xl mx-auto">
          <div className="card-pad">
            <h3 className="heading-section text-gray-200 mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-400" /> 공지사항
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              {notices.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
