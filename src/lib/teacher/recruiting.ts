/** 모집 상태: closed=인원 0 설정, full=정원 마감, open=모집중 */
export type RecruitmentStatus = 'closed' | 'full' | 'open';

export function getRecruitmentStatus(
  maxStudents: number,
  activeCount: number,
  isActive = true,
): RecruitmentStatus {
  if (maxStudents <= 0) return 'closed';
  if (!isActive || activeCount >= maxStudents) return 'full';
  return 'open';
}

export function recruitmentStatusLabel(status: RecruitmentStatus): string {
  if (status === 'closed') return '모집 마감';
  if (status === 'full') return '마감';
  return '모집중';
}

/** DB isActive — maxStudents 0이면 항상 false */
export function computeTeacherIsActive(maxStudents: number, activeCount: number): boolean {
  return maxStudents > 0 && activeCount < maxStudents;
}

export function isRecruitmentOpen(
  maxStudents: number,
  activeCount: number,
  isActive = true,
): boolean {
  return getRecruitmentStatus(maxStudents, activeCount, isActive) === 'open';
}
