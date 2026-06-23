import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { EmptyState } from '@/components/ui/loading';
import { TeacherCard } from '@/components/cards/teacher-card';
import { prisma } from '@/lib/prisma';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher-counts';

type TeacherListItem = Awaited<ReturnType<typeof prisma.teacher.findMany<{ include: { class: true } }>>>[number];

export { dynamic } from '@/lib/segment';

export default async function TeachersPage() {
  let teachers: TeacherListItem[] = [];
  let liveCounts: Record<string, number> = {};
  try {
    [teachers, liveCounts] = await Promise.all([
      prisma.teacher.findMany({
        where: { isActive: true },
        include: { class: true },
        orderBy: [{ class: { slug: 'asc' } }, { name: 'asc' }],
      }),
      getActiveStudentCountsByTeacher(),
    ]);
  } catch (e) {
    console.error('[teachers] findMany failed:', e);
  }

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap page-enter">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">선생님 목록</h1>
          <p className="text-muted-foreground text-sm">반별 담당 선생님 프로필과 활동 정보를 확인하세요</p>
        </div>

        {teachers.length === 0 ? (
          <EmptyState title="등록된 선생님이 없습니다" description="곧 새로운 선생님이 등록될 예정입니다." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
            {teachers.map((t) => (
              <TeacherCard key={t.id} teacher={t} activeCount={liveCounts[t.id] ?? 0} />
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <Link href="/apply" className="text-sm text-primary hover:text-primary-hover transition-colors">
            수강 신청하러 가기 →
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
