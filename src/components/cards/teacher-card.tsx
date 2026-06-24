import Link from 'next/link';
import Image from 'next/image';
import { Users, Clock, Calendar } from 'lucide-react';
import { PageCard, PageCardHeader, PageCardBody, PageCardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { parseActivityDays } from '@/lib/teacher-activity';
import { DEFAULT_TEACHER_PROFILE_IMAGE } from '@/lib/teacher-avatar-constants';
import { getRecruitmentStatus, recruitmentStatusLabel } from '@/lib/teacher-recruiting';

type TeacherCardData = {
  id: string;
  name: string;
  profileImage?: string | null;
  intro?: string | null;
  maxStudents: number;
  activityDays?: string | null;
  activityTimeSlot?: string | null;
  class: { name: string; gameKr: string };
  teacherClasses?: Array<{ class: { name: string; gameKr: string } }>;
};

type Props = {
  teacher: TeacherCardData;
  activeCount: number;
};

function classLine(teacher: TeacherCardData) {
  const fromJoin = teacher.teacherClasses?.map((tc) => tc.class).filter(Boolean) ?? [];
  if (fromJoin.length > 0) {
    return fromJoin.map((c) => `${c.name} · ${c.gameKr}`).join(' / ');
  }
  if (teacher.class) {
    return `${teacher.class.name} · ${teacher.class.gameKr}`;
  }
  return '반 미배정';
}

export function TeacherCard({ teacher, activeCount }: Props) {
  const status = getRecruitmentStatus(teacher.maxStudents, activeCount);
  const full = status !== 'open';
  const days = parseActivityDays(teacher.activityDays);
  const daysLabel = days.length ? days.join(', ') : '미정';
  const profileSrc = teacher.profileImage?.trim() || DEFAULT_TEACHER_PROFILE_IMAGE;

  return (
    <PageCard hover className="min-h-[320px]">
      <PageCardHeader>
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            <Image src={profileSrc} alt={teacher.name} fill className="object-cover" sizes="56px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground truncate">{teacher.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{classLine(teacher)}</p>
              </div>
              <Badge variant={full ? 'danger' : 'success'}>{recruitmentStatusLabel(status)}</Badge>
            </div>
          </div>
        </div>
      </PageCardHeader>

      <PageCardBody className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {teacher.intro || '소개가 등록되지 않았습니다.'}
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary shrink-0" />
            담당 학생 {activeCount}/{teacher.maxStudents}명
          </li>
          <li className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            {daysLabel}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            {teacher.activityTimeSlot || '시간 미정'}
          </li>
        </ul>
      </PageCardBody>

      <PageCardFooter>
        <Button asChild className="w-full" variant={full ? 'outline' : 'default'}>
          <Link href={`/teachers/${teacher.id}`}>상세보기</Link>
        </Button>
      </PageCardFooter>
    </PageCard>
  );
}
