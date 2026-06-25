import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft } from 'lucide-react';
import { getClassBySlug } from '@/lib/constants';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher/counts';
import { isRecruitmentOpen } from '@/lib/teacher/recruiting';
import { findTeachersForClassSlug } from '@/lib/teacher/query';
import { TeacherCard } from '@/components/cards';
import { EmptyState } from '@/components/ui/loading';

export { dynamic } from '@/lib/utils/segment';

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clsInfo = getClassBySlug(slug);
  if (!clsInfo) notFound();

  const result = await findTeachersForClassSlug(slug);
  if (!result) notFound();

  const { dbClass, teachers: classTeachers } = result;
  const liveCounts = await getActiveStudentCountsByTeacher();

  const teachers = classTeachers.map((t) => ({
    ...t,
    activeStudents: liveCounts[t.id] ?? 0,
  }));

  const available = teachers
    .filter((t) => isRecruitmentOpen(t.maxStudents, t.activeStudents, t.isActive))
    .reduce((sum, t) => sum + (t.maxStudents - t.activeStudents), 0);

  const totalStudents = teachers.reduce((sum, t) => sum + t.activeStudents, 0);

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/#classes"><ArrowLeft className="h-4 w-4" /> 클래스 소개</Link>
        </Button>

        <div className="relative aspect-[21/9] sm:aspect-[2.5/1] rounded-2xl overflow-hidden border border-border shadow-card">
          <Image src={clsInfo.bannerImage} alt={clsInfo.gameKr} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/50 to-black/20" />
          <div className={`absolute inset-0 ${clsInfo.overlayTint}`} />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <p className="text-sm text-white/75 mb-1">{clsInfo.game}</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">{clsInfo.gameKr}</h1>
            <p className={`text-lg font-medium ${clsInfo.color}`}>{clsInfo.emoji} {clsInfo.name}</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <div className="card-pad space-y-4">
            <p className="text-muted-foreground leading-relaxed text-body-ko">{dbClass.description}</p>
            <div className="flex flex-wrap gap-3">
              <Badge variant={available > 0 ? 'success' : 'danger'}>{available > 0 ? '모집중' : '마감'}</Badge>
              <Badge variant="outline"><Users className="h-3 w-3 mr-1 inline" />현재 {totalStudents}명</Badge>
              <Badge variant="outline">잔여 {available}명</Badge>
            </div>
          </div>
        </Card>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="heading-section text-foreground">{clsInfo.name} 담당 선생님</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {clsInfo.gameKr} 반 담당 선생님만 표시됩니다. 선생님을 확인한 뒤 수강 신청을 진행하세요.
              </p>
            </div>
            <Button asChild className="shrink-0 w-full sm:w-auto">
              <Link href={`/apply?class=${slug}`}>수강 신청</Link>
            </Button>
          </div>

          {teachers.length === 0 ? (
            <EmptyState title="등록된 선생님이 없습니다" description="곧 담당 선생님이 등록될 예정입니다." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  activeCount={teacher.activeStudents}
                  isActive={teacher.isActive}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
