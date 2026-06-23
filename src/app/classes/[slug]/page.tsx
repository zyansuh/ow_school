import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft } from 'lucide-react';
import { getClassBySlug } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getActiveStudentCountsByTeacher } from '@/lib/teacher-counts';

export { dynamic } from '@/lib/segment';

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clsInfo = getClassBySlug(slug);
  if (!clsInfo) notFound();

  const dbClass = await prisma.class.findUnique({ where: { slug } });
  if (!dbClass) notFound();

  const classTeachers = await prisma.teacher.findMany({
    where: {
      OR: [
        { classId: dbClass.id },
        { teacherClasses: { some: { classId: dbClass.id } } },
      ],
    },
    orderBy: { name: 'asc' },
  });

  const liveCounts = await getActiveStudentCountsByTeacher();
  const teachers = classTeachers.map((t) => ({
    ...t,
    activeStudents: liveCounts[t.id] ?? 0,
  }));

  const available = teachers
    .filter((t) => t.isActive && t.activeStudents < t.maxStudents)
    .reduce((sum, t) => sum + (t.maxStudents - t.activeStudents), 0);

  const totalStudents = teachers.reduce((sum, t) => sum + t.activeStudents, 0);

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap">
        <Button variant="ghost" asChild className="text-gray-400 hover:text-white -ml-2">
          <Link href="/"><ArrowLeft className="h-4 w-4" /> 홈으로</Link>
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

        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad space-y-4">
            <p className="text-gray-300 leading-relaxed">{dbClass.description}</p>
            <div className="flex flex-wrap gap-3">
              <Badge variant={available > 0 ? 'success' : 'danger'}>{available > 0 ? '모집중' : '마감'}</Badge>
              <Badge variant="outline"><Users className="h-3 w-3 mr-1 inline" />현재 {totalStudents}명</Badge>
              <Badge variant="outline">잔여 {available}명</Badge>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="heading-section text-gray-100 mb-6">담당 선생님</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teachers.map((teacher) => {
              const full = !teacher.isActive || teacher.activeStudents >= teacher.maxStudents;
              return (
                <Link key={teacher.id} href={`/teachers/${teacher.id}`}>
                  <Card className={`bg-gray-900/80 border-gray-800 hover:border-purple-500/50 transition-all h-full ${full ? 'opacity-60' : ''}`}>
                    <CardContent className="p-5 pt-5 space-y-3">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-bold text-lg">{teacher.name}</h3>
                        <Badge variant={full ? 'danger' : 'success'}>{full ? '마감' : '모집중'}</Badge>
                      </div>
                      {teacher.mbti && <p className="text-xs text-purple-400">MBTI: {teacher.mbti}</p>}
                      <p className="text-sm text-gray-400 line-clamp-2">{teacher.intro}</p>
                      <p className="text-xs text-gray-500">인원 {teacher.activeStudents}/{teacher.maxStudents}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
