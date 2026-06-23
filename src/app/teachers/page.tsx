import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/loading';
import { prisma } from '@/lib/prisma';

export { dynamic } from '@/lib/segment';

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    where: { isActive: true },
    include: { class: true },
    orderBy: [{ class: { slug: 'asc' } }, { name: 'asc' }],
  });

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">선생님 목록</h1>
          <p className="text-gray-400 text-sm">반별 담당 선생님을 확인하세요</p>
        </div>

        {teachers.length === 0 ? (
          <EmptyState title="등록된 선생님이 없습니다" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teachers.map((t) => {
              const full = t.currentStudents >= t.maxStudents;
              return (
                <Link key={t.id} href={`/teachers/${t.id}`}>
                  <Card className="bg-gray-900/80 border-gray-800 hover:border-purple-500/50 transition-all h-full">
                    <CardContent className="p-5 pt-5 space-y-3">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{t.name}</h3>
                          <p className="text-sm text-gray-400">{t.class.name} · {t.class.gameKr}</p>
                        </div>
                        <Badge variant={full ? 'danger' : 'success'}>{full ? '마감' : '모집중'}</Badge>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{t.intro}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
