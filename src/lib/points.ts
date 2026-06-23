export const GRADUATION_POINT = 15000;
export const CLUB_POINT = 5000;

export const POINT_TYPE_LABELS: Record<string, string> = {
  graduation: '졸업 포인트',
  club: '동호회 가입 포인트',
};

export function formatPoint(amount: number) {
  return `${amount.toLocaleString('ko-KR')}P`;
}
