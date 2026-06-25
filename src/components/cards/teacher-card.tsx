import Link from 'next/link';
import { Users, Clock } from 'lucide-react';
import { PageCard, PageCardHeader, PageCardBody, PageCardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMainActivityTime, teacherRoleLabel } from '@/lib/teacher/display';
import { getRecruitmentStatus, recruitmentStatusLabel } from '@/lib/teacher/recruiting';

type TeacherCardData = {
  id: string;
  name: string;
  mbti?: string | null;
  intro?: string | null;
  maxStudents: number;
  isActive?: boolean;
  activityTimeSlot?: string | null;
  class: { name: string; gameKr: string };
  teacherClasses?: Array<{ class: { name: string; gameKr: string } }>;
};

type Props = {
  teacher: TeacherCardData;
  activeCount: number;
  isActive?: boolean;
};

export function TeacherCard({ teacher, activeCount, isActive }: Props) {
  const teacherActive = isActive ?? teacher.isActive ?? true;
  const status = getRecruitmentStatus(teacher.maxStudents, activeCount, teacherActive);
  const full = status !== 'open';

  return (
    <PageCard hover className="min-h-[280px]">
      <PageCardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">{teacher.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{teacherRoleLabel(teacher)}</p>
          </div>
          <Badge variant={full ? 'danger' : 'success'}>{recruitmentStatusLabel(status)}</Badge>
        </div>
      </PageCardHeader>

      <PageCardBody className="space-y-3">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-1">주 활동시간</p>
          <p className="text-sm text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            {formatMainActivityTime(teacher.activityTimeSlot)}
          </p>
        </div>
        {teacher.intro?.trim() && (
          <p className="text-sm text-muted-foreground line-clamp-2">{teacher.intro.trim()}</p>
        )}
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary shrink-0" />
          담당 학생 {activeCount}/{teacher.maxStudents}명
        </p>
      </PageCardBody>

      <PageCardFooter>
        <Button asChild className="w-full" variant={full ? 'outline' : 'default'}>
          <Link href={`/teachers/${teacher.id}`}>상세보기</Link>
        </Button>
      </PageCardFooter>
    </PageCard>
  );
}
