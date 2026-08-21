import { prisma } from '@/lib/prisma';

export const SAVED_VIEWS_KEY = 'admin_saved_views';

export type SavedView = {
  id: string;
  name: string;
  href: string;
  builtin?: boolean;
};

/** 기본 프리셋 — DB에 없어도 항상 노출 */
export const BUILTIN_SAVED_VIEWS: SavedView[] = [
  {
    id: 'builtin-sudal',
    name: '수달반 학생',
    href: '/admin/students?class=%EC%88%98%EB%8B%AC%EB%B0%98',
    builtin: true,
  },
  {
    id: 'builtin-lion',
    name: '사자반 학생',
    href: '/admin/students?class=%EC%82%AC%EC%9E%90%EB%B0%98',
    builtin: true,
  },
  {
    id: 'builtin-fox',
    name: '여우반 학생',
    href: '/admin/students?class=%EC%97%AC%EC%9A%B0%EB%B0%98',
    builtin: true,
  },
  {
    id: 'builtin-no-interview',
    name: '면담 미제출',
    href: '/admin/students?quick=noInterview',
    builtin: true,
  },
  {
    id: 'builtin-joined-month',
    name: '이번 달 가입',
    href: '/admin/students?quick=joinedThisMonth',
    builtin: true,
  },
  {
    id: 'builtin-lion-no-iv',
    name: '사자반 · 면담 미제출',
    href: '/admin/students?class=%EC%82%AC%EC%9E%90%EB%B0%98&quick=noInterview',
    builtin: true,
  },
  {
    id: 'builtin-active-users',
    name: '활동 사용자',
    href: '/admin/users',
    builtin: true,
  },
  {
    id: 'builtin-near-full',
    name: '정원 임박 선생님',
    href: '/admin/teachers?nearFull=1',
    builtin: true,
  },
  {
    id: 'builtin-inactive-teachers',
    name: '비활성 선생님',
    href: '/admin/teachers?inactive=1',
    builtin: true,
  },
];

export async function listSavedViews(): Promise<SavedView[]> {
  const custom = await loadCustomSavedViews();
  return [...BUILTIN_SAVED_VIEWS, ...custom];
}

export async function loadCustomSavedViews(): Promise<SavedView[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SAVED_VIEWS_KEY } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value) as SavedView[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.href === 'string')
      .map((v) => ({ ...v, builtin: false }));
  } catch {
    return [];
  }
}

export async function saveCustomSavedViews(views: SavedView[]) {
  const cleaned = views
    .filter((v) => !v.builtin)
    .map((v) => ({
      id: v.id,
      name: v.name.trim().slice(0, 40),
      href: v.href.trim().slice(0, 500),
    }));
  await prisma.siteSetting.upsert({
    where: { key: SAVED_VIEWS_KEY },
    create: { key: SAVED_VIEWS_KEY, value: JSON.stringify(cleaned) },
    update: { value: JSON.stringify(cleaned) },
  });
  return cleaned;
}
