import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { normalizeNickFields, userDisplayName } from '@/lib/user-display';
import type { AssignedStudent } from '@/types/db';

export { dynamic } from '@/lib/segment';

function parseDays(json: string | null) {
  if (!json) return [] as string[];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      class: true,
      assignedUsers: {
        where: { status: 'active', adminRole: null },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!teacher) notFound();

  const activeCount = teacher.assignedUsers.length;
  const full = !teacher.isActive || activeCount >= teacher.maxStudents;
  const activityDays = parseDays(teacher.activityDays);

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
                    {full ? '모집 마감' : '모집중'} ({activeCount}/{teacher.maxStudents})
                  </Badge>
                </div>
              </div>
            </div>

            {(activityDays.length > 0 || teacher.activityTimeSlot) && (
              <div className="text-sm text-gray-400 space-y-1">
                {activityDays.length > 0 && <p>활동 요일: {activityDays.join(', ')}</p>}
                {teacher.activityTimeSlot && <p>활동 시간: {teacher.activityTimeSlot}</p>}
              </div>
            )}

            {teacher.intro && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">소개</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{teacher.intro}</p>
              </div>
            )}

            {teacher.discord && <p className="text-sm text-gray-500">Discord: {teacher.discord}</p>}

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">담당 학생 ({activeCount}명)</h3>
              {teacher.assignedUsers.length === 0 ? (
                <p className="text-sm text-gray-500">배정된 학생이 없습니다</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.assignedUsers.map((u: AssignedStudent) => (
                    <li key={u.id} className="text-sm text-gray-300 border border-gray-800 rounded-lg px-3 py-2">
                      {userDisplayName(normalizeNickFields(u))}
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
