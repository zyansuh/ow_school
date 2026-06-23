import { findAssignedStudentsForTeacher } from '@/lib/student-users';
import { normalizeNickFields, userDisplayName } from '@/lib/user-display';
import { parseClubNames } from '@/lib/interview-utils';

export type TeacherAssignedStudentRow = {
  id: string;
  serverNickname: string;
  className: string;
  applicationDate: string | null;
  isGraduated: boolean;
  hasInterview: boolean;
};

export async function fetchAssignedStudentsForTeacher(teacherId: string) {
  return findAssignedStudentsForTeacher(teacherId);
}

export async function getTeacherAssignedStudentRows(teacherId: string): Promise<TeacherAssignedStudentRow[]> {
  const users = await fetchAssignedStudentsForTeacher(teacherId);
  return users.map((u) => {
    const app = u.applications[0];
    const interview = u.interviews[0];
    return {
      id: u.id,
      serverNickname: userDisplayName(normalizeNickFields(u)),
      className: u.class?.name ?? app?.class?.name ?? interview?.className ?? '미배정',
      applicationDate: app?.createdAt.toISOString() ?? u.createdAt.toISOString(),
      isGraduated: u.status === 'graduated',
      hasInterview: !!interview,
    };
  });
}

export function mapAssignedStudentDetail(
  user: Awaited<ReturnType<typeof fetchAssignedStudentsForTeacher>>[number],
  teacherId: string,
) {
  const app = user.applications[0];
  const interview = user.interviews[0];
  return {
    id: user.id,
    serverNickname: userDisplayName(normalizeNickFields(user)),
    className: user.class?.name ?? app?.class?.name ?? interview?.className ?? '미배정',
    applicationDate: app?.createdAt.toISOString() ?? null,
    isGraduated: user.status === 'graduated',
    hasInterview: !!interview,
    playTimeSlot: app?.playTimeSlot ?? null,
    clubNames: interview ? parseClubNames(interview.clubNames) : [],
  };
}
