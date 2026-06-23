import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export { dynamic } from '@/lib/segment';

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id }, include: { class: true } });
  if (!teacher) notFound();

  const full = !teacher.isActive || teacher.currentStudents >= teacher.maxStudents;

  return (
    <MainLayout>
      <div className="page-container py-8 sm:py-12 section-gap max-w-2xl">
        <Button variant="ghost" asChild className="text-gray-400 -ml-2">
          <Link href={`/classes/${teacher.class.slug}`}><ArrowLeft className="h-4 w-4" /> {teacher.class.name}으로</Link>
        </Button>

        <Card className="bg-gray-900/80 border-gray-800">
          <div className="card-pad space-y-6">
            <div className="flex items-start gap-5">
              {teacher.profileImage && (
                <Image src={teacher.profileImage} alt={teacher.name} width={80} height={80} className="rounded-full border-2 border-gray-700" />
              )}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{teacher.name}</h1>
                <p className="text-gray-400">{teacher.class.name} · {teacher.class.gameKr}</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.mbti && <Badge variant="outline">MBTI: {teacher.mbti}</Badge>}
                  <Badge variant={full ? 'danger' : 'success'}>
                    {full ? '모집 마감' : '모집중'} ({teacher.currentStudents}/{teacher.maxStudents})
                  </Badge>
                </div>
              </div>
            </div>

            {teacher.intro && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">소개</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{teacher.intro}</p>
              </div>
            )}

            {teacher.discord && <p className="text-sm text-gray-500">Discord: {teacher.discord}</p>}

            {full ? (
              <Button disabled className="w-full sm:w-auto">모집이 마감되었습니다</Button>
            ) : (
              <Button asChild className="w-full sm:w-auto"><Link href={`/apply?teacher=${teacher.id}`}>수강 신청하기</Link></Button>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
