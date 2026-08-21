/** 관리자 목록 공통 반 필터 */

export const ADMIN_CLASS_ALL = '전체' as const;

export const ADMIN_CLASS_NAMES = ['수달반', '사자반', '여우반', '미배정'] as const;

export type AdminClassName = (typeof ADMIN_CLASS_NAMES)[number];

export type AdminClassFilterValue = typeof ADMIN_CLASS_ALL | AdminClassName;

/** 칩 표시 순서: 전체 + 반 */
export const ADMIN_CLASS_FILTERS: AdminClassFilterValue[] = [ADMIN_CLASS_ALL, ...ADMIN_CLASS_NAMES];

/** 섹션·정렬 순서 */
export const ADMIN_CLASS_ORDER: readonly string[] = [...ADMIN_CLASS_NAMES];

export const ADMIN_LIST_PAGE_SIZE = 30;

/** null / '-' / 빈 문자열 → 미배정 */
export function normalizeClassLabel(raw: string | null | undefined): string {
  const s = (raw ?? '').trim();
  if (!s || s === '-') return '미배정';
  return s;
}

export function parseClassParam(raw: string | null | undefined): AdminClassFilterValue {
  if (!raw || raw === ADMIN_CLASS_ALL) return ADMIN_CLASS_ALL;
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  if ((ADMIN_CLASS_NAMES as readonly string[]).includes(decoded)) {
    return decoded as AdminClassName;
  }
  return ADMIN_CLASS_ALL;
}

export function matchesClassFilter(
  className: string | null | undefined,
  filter: AdminClassFilterValue,
): boolean {
  if (filter === ADMIN_CLASS_ALL) return true;
  return normalizeClassLabel(className) === filter;
}

export function groupByClassName<T>(
  items: T[],
  getClassName: (item: T) => string | null | undefined,
): Array<{ className: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = normalizeClassLabel(getClassName(item));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([className, groupItems]) => ({ className, items: groupItems }))
    .sort((a, b) => {
      const ai = ADMIN_CLASS_ORDER.indexOf(a.className);
      const bi = ADMIN_CLASS_ORDER.indexOf(b.className);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}
