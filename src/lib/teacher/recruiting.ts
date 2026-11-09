/** 모집 상태 — isActive(비활성)와 분리. closed=정원 0, full=정원 마감, open=모집중 */
export type RecruitmentStatus = 'closed' | 'full' | 'open';

/**
 * 모집 상태만 판별한다. 선생님 비활성(isActive=false)은 여기 넣지 않는다.
 * - 비활성: 신규 학생 목록에서 숨김
 * - 모집마감/정원마감: 목록에 보이되 선택 불가
 */
export function getRecruitmentStatus(
  maxStudents: number,
  activeCount: number,
  /** @deprecated 무시됨 — 비활성은 목록 필터로 처리 */
  _isActive?: boolean,
): RecruitmentStatus {
  void _isActive;
  if (maxStudents <= 0) return 'closed';
  if (activeCount >= maxStudents) return 'full';
  return 'open';
}

export function recruitmentStatusLabel(status: RecruitmentStatus): string {
  if (status === 'closed') return '모집 마감';
  if (status === 'full') return '마감';
  return '모집중';
}

/** 신규 학생에게 선생님 카드를 노출할지 (비활성은 숨김) */
export function isTeacherVisibleToApplicants(isActive: boolean): boolean {
  return isActive;
}

export function isRecruitmentOpen(maxStudents: number, activeCount: number): boolean {
  return getRecruitmentStatus(maxStudents, activeCount) === 'open';
}

/** 활성 + 모집중일 때만 신규 배정 가능 */
export function canAcceptNewStudent(
  maxStudents: number,
  activeCount: number,
  isActive: boolean,
): boolean {
  return isActive && isRecruitmentOpen(maxStudents, activeCount);
}
