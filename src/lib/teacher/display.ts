/** 선생님 카드·선택 UI용 표시 헬퍼 */

type ClassRef = { name: string; gameKr: string };

type TeacherClassLine = {
  class: ClassRef;
  mbti?: string | null;
  teacherClasses?: Array<{ class: ClassRef }>;
};

/** 역할/포지션 — 담당 반 · 게임 (복수 반 지원) */
export function teacherRoleLabel(teacher: TeacherClassLine): string {
  const fromJoin = teacher.teacherClasses?.map((tc) => tc.class).filter(Boolean) ?? [];
  const classes = fromJoin.length > 0 ? fromJoin : [teacher.class];
  const base = classes.map((c) => `${c.name} · ${c.gameKr}`).join(' / ');
  return teacher.mbti?.trim() ? `${base} · ${teacher.mbti.trim()}` : base;
}

/** 관리자 입력 주 활동시간 */
export function formatMainActivityTime(activityTimeSlot?: string | null): string {
  const v = activityTimeSlot?.trim();
  return v || '미정';
}
