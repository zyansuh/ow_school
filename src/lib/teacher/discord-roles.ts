import { prisma } from '@/lib/prisma';

/** SiteSetting 키 — Discord 선생님 역할명·우선순위 */
export const TEACHER_DISCORD_ROLES_SETTING_KEY = 'teacher_discord_roles';

export type TeacherDiscordRoleEntry = {
  /** Discord 서버 역할명 (정확 일치) */
  name: string;
  /** 1=주임, 2=교사, 3=보조 (작을수록 높음) */
  priority: number;
};

/** 기본값 — 관리자가 아직 저장하지 않았을 때 */
export const DEFAULT_TEACHER_DISCORD_ROLES: TeacherDiscordRoleEntry[] = [
  { name: '신입반 주임교사', priority: 1 },
  { name: '신입반 교사', priority: 2 },
  { name: '신입반 보조교사', priority: 3 },
  /** 레거시 역할명 (공백 없음) — 기존 서버 호환 */
  { name: '신입반교사', priority: 2 },
];

export function normalizeTeacherDiscordRoles(
  input: unknown,
): TeacherDiscordRoleEntry[] {
  if (!Array.isArray(input)) return [...DEFAULT_TEACHER_DISCORD_ROLES];

  const cleaned: TeacherDiscordRoleEntry[] = [];
  const seen = new Set<string>();

  for (const row of input) {
    if (!row || typeof row !== 'object') continue;
    const name = String((row as { name?: unknown }).name ?? '').trim();
    const priorityRaw = Number((row as { priority?: unknown }).priority);
    if (!name) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    const priority =
      Number.isFinite(priorityRaw) && priorityRaw >= 1 ? Math.floor(priorityRaw) : 99;
    cleaned.push({ name, priority });
  }

  if (cleaned.length === 0) return [...DEFAULT_TEACHER_DISCORD_ROLES];
  return cleaned.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, 'ko'));
}

export function teacherDiscordRoleNames(roles: TeacherDiscordRoleEntry[]): string[] {
  return roles.map((r) => r.name);
}

export function hasAnyTeacherDiscordRole(
  userRoleNames: string[],
  allowedNames: string[],
): boolean {
  if (!userRoleNames.length || !allowedNames.length) return false;
  const allowed = new Set(allowedNames);
  return userRoleNames.some((n) => allowed.has(n));
}

/** 보유 역할 중 가장 높은 우선순위(숫자 작음) 항목 */
export function resolveHighestTeacherDiscordRole(
  userRoleNames: string[],
  roles: TeacherDiscordRoleEntry[],
): TeacherDiscordRoleEntry | null {
  let best: TeacherDiscordRoleEntry | null = null;
  const owned = new Set(userRoleNames);
  for (const role of roles) {
    if (!owned.has(role.name)) continue;
    if (!best || role.priority < best.priority) best = role;
  }
  return best;
}

export async function getTeacherDiscordRoles(): Promise<TeacherDiscordRoleEntry[]> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: TEACHER_DISCORD_ROLES_SETTING_KEY },
  });
  if (!row?.value) return [...DEFAULT_TEACHER_DISCORD_ROLES];
  try {
    return normalizeTeacherDiscordRoles(JSON.parse(row.value));
  } catch {
    return [...DEFAULT_TEACHER_DISCORD_ROLES];
  }
}

export async function saveTeacherDiscordRoles(
  roles: TeacherDiscordRoleEntry[],
): Promise<TeacherDiscordRoleEntry[]> {
  const normalized = normalizeTeacherDiscordRoles(roles);
  await prisma.siteSetting.upsert({
    where: { key: TEACHER_DISCORD_ROLES_SETTING_KEY },
    create: {
      key: TEACHER_DISCORD_ROLES_SETTING_KEY,
      value: JSON.stringify(normalized),
    },
    update: { value: JSON.stringify(normalized) },
  });
  return normalized;
}
