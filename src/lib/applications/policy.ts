/** 수강 신청 승인 정책 — 현재: 선생님 선택 시 즉시 승인 */
export const APPLICATION_POLICY = {
  initialStatus: 'approved' as const,
  requiresAdminApproval: false,
};

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export function initialApplicationStatus(): ApplicationStatus {
  return APPLICATION_POLICY.initialStatus;
}
