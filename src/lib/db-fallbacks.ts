import { GAME_CLASSES } from '@/lib/constants';

export const DEFAULT_NOTICES = [
  '신입 배정은 선착순입니다',
  '정원 마감 시 선택 불가',
  '신청 후 확인 1~2일 소요',
];

export function defaultClassStats() {
  return Object.fromEntries(
    GAME_CLASSES.map((c) => [
      c.slug,
      { recruiting: true, current: 0, max: 0 },
    ]),
  );
}
