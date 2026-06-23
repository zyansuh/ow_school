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
import type { TeacherRow } from '@/types/db';

export { dynamic } from '@/lib/segment';

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clsInfo = getClassBySlug(slug);
  if (!clsInfo) notFound();

  const dbClass = await prisma.class.findUnique({
    where: { slug },
    include: { teachers: { orderBy: { name: 'asc' } } },
  });
  if (!dbClass) notFound();

  const teachers = dbClass.teachers as TeacherRow[];
  const available = teachers
    .filter((t) => t.isActive && t.currentStudents < t.maxStudents)
    .reduce((sum, t) => sum + (t.maxStudents - t.currentStudents), 0);

  const totalStudents = teachers.reduce((sum, t) => sum + t.currentStudents, 0);

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap">
        <Button variant="ghost" asChild className="text-gray-400 hover:text-white -ml-2">
          <Link href="/"><ArrowLeft className="h-4 w-4" /> 홈으로</Link>
        </Button>

        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden">
          <Image src={clsInfo.bannerImage} alt={clsInfo.gameKr} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">{clsInfo.emoji} {clsInfo.name}</h1>
            <p className={`text-lg ${clsInfo.color}`}>{clsInfo.gameKr}</p>
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
              const full = !teacher.isActive || teacher.currentStudents >= teacher.maxStudents;
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
                      <p className="text-xs text-gray-500">인원 {teacher.currentStudents}/{teacher.maxStudents}</p>
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
