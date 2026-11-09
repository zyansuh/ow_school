/**
 * 역할 분류 검증 (DB 없이 순수 함수)
 * 실행: node scripts/verify-user-role.mjs
 */
import assert from 'node:assert/strict';

const DEFAULT_TEACHER_DISCORD_ROLES = [
  { name: '신입반 주임교사', priority: 1 },
  { name: '신입반 교사', priority: 2 },
  { name: '신입반 보조교사', priority: 3 },
  { name: '신입반교사', priority: 2 },
];
const STUDENT_GUILD_TENURE_MONTHS = 2;

function parseRoleNames(json) {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function isAdminUser(user) {
  return !!user.adminRole;
}

function hasAnyTeacherDiscordRole(roleNames, allowedNames) {
  const allowed = new Set(allowedNames);
  return roleNames.some((n) => allowed.has(n));
}

function isTeacherByDiscordUserId(discordId, ctx) {
  if (!discordId) return false;
  return ctx.teacherDiscordUserIds.has(discordId);
}

function resolveGuildJoinedAt(user) {
  if (user.guildJoinedAt) return user.guildJoinedAt;
  if (user.isInGuild && user.createdAt) return user.createdAt;
  return null;
}

function isStudentByGuildTenure(user, now = new Date()) {
  if (!user.isInGuild) return false;
  const joined = resolveGuildJoinedAt(user);
  if (!joined) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - STUDENT_GUILD_TENURE_MONTHS);
  return joined > cutoff;
}

function isActiveAssignedStudentCandidate(user) {
  return user.status === 'active' && !!user.teacherId;
}

function inferUserRole(user, ctx, now = new Date()) {
  if (isAdminUser(user)) return 'admin';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  const allowed = (ctx.teacherDiscordRoles ?? DEFAULT_TEACHER_DISCORD_ROLES).map((r) => r.name);
  if (hasAnyTeacherDiscordRole(parseRoleNames(user.discordRoleNames), allowed)) return 'teacher';
  if (isActiveAssignedStudentCandidate(user)) return 'student';
  if (isStudentByGuildTenure(user, now)) return 'student';
  return 'resident';
}

function getUserRole(user, ctx, now = new Date()) {
  const override = user.siteRole?.trim();
  if (override === 'resident' || override === 'student' || override === 'teacher' || override === 'admin') {
    return override;
  }
  return inferUserRole(user, ctx, now);
}

function isStudentUser(user, ctx, now = new Date()) {
  return getUserRole(user, ctx, now) === 'student';
}

const now = new Date();
const oneMonthAgo = new Date(now);
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
const threeMonthsAgo = new Date(now);
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

const emptyCtx = {
  teacherDiscordUserIds: new Set(),
  teacherDiscordNames: new Set(),
  teacherDiscordRoles: DEFAULT_TEACHER_DISCORD_ROLES,
};

const cases = [
  {
    name: '케이스 1: 신입반 주임교사 → teacher',
    user: { discordRoleNames: JSON.stringify(['신입반 주임교사']), isInGuild: true, guildJoinedAt: oneMonthAgo },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 1b: 신입반 보조교사 → teacher',
    user: { discordRoleNames: JSON.stringify(['신입반 보조교사']), isInGuild: true, guildJoinedAt: oneMonthAgo },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 1c: 레거시 신입반교사 → teacher',
    user: { discordRoleNames: JSON.stringify(['신입반교사']), isInGuild: true, guildJoinedAt: oneMonthAgo },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 2: adminRole → admin',
    user: { adminRole: { id: '1' }, isInGuild: true, guildJoinedAt: oneMonthAgo, status: 'active', teacherId: 't1' },
    expectedRole: 'admin',
    inStudentList: false,
  },
  {
    name: '케이스 3: 서버 가입 1달 → student',
    user: { isInGuild: true, guildJoinedAt: oneMonthAgo },
    expectedRole: 'student',
    inStudentList: true,
  },
  {
    name: '케이스 4: 서버 가입 3달 → resident',
    user: { isInGuild: true, guildJoinedAt: threeMonthsAgo },
    expectedRole: 'resident',
    inStudentList: false,
  },
  {
    name: '케이스 5: 서버 미가입 → resident',
    user: { isInGuild: false },
    expectedRole: 'resident',
    inStudentList: false,
  },
  {
    name: '케이스 6: siteRole 수동 지정 우선',
    user: { siteRole: 'student', isInGuild: true, guildJoinedAt: threeMonthsAgo },
    expectedRole: 'student',
    inStudentList: true,
  },
  {
    name: '케이스 7: Teacher 등록(discordUserId) 우선',
    user: { discordId: '111', isInGuild: true, guildJoinedAt: threeMonthsAgo, status: 'active', teacherId: 't1' },
    ctx: {
      teacherDiscordUserIds: new Set(['111']),
      teacherDiscordNames: new Set(),
      teacherDiscordRoles: DEFAULT_TEACHER_DISCORD_ROLES,
    },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 8: active+teacherId · 가입 3달 → student (배정 유지)',
    user: {
      isInGuild: true,
      guildJoinedAt: threeMonthsAgo,
      status: 'active',
      teacherId: 'teacher-1',
    },
    expectedRole: 'student',
    inStudentList: true,
  },
  {
    name: '케이스 9: 명시적 resident + teacherId → resident 유지',
    user: {
      siteRole: 'resident',
      status: 'active',
      teacherId: 'teacher-1',
      isInGuild: true,
      guildJoinedAt: threeMonthsAgo,
    },
    expectedRole: 'resident',
    inStudentList: false,
  },
  {
    name: '케이스 10: graduated + teacherId → resident(자동) · 재학생 아님',
    user: {
      status: 'graduated',
      teacherId: 'teacher-1',
      isInGuild: true,
      guildJoinedAt: threeMonthsAgo,
    },
    expectedRole: 'resident',
    inStudentList: false,
  },
  {
    name: '케이스 11: withdrawn + teacherId · 가입 3달 → teacherId만으로 student 안 됨',
    user: {
      status: 'withdrawn',
      teacherId: 'teacher-1',
      isInGuild: true,
      guildJoinedAt: threeMonthsAgo,
    },
    expectedRole: 'resident',
    inStudentList: false,
  },
  {
    name: '케이스 12: AdminRole + teacherId → admin (student 전환 방지)',
    user: {
      adminRole: { id: 'a1' },
      status: 'active',
      teacherId: 'teacher-1',
      isInGuild: true,
      guildJoinedAt: threeMonthsAgo,
    },
    expectedRole: 'admin',
    inStudentList: false,
  },
];

let passed = 0;
for (const c of cases) {
  const ctx = c.ctx ?? emptyCtx;
  const role = getUserRole(c.user, ctx, now);
  const inList = isStudentUser(c.user, ctx, now);
  assert.equal(role, c.expectedRole, `${c.name}: role`);
  assert.equal(inList, c.inStudentList, `${c.name}: student list`);
  console.log(`✓ ${c.name}`);
  passed++;
}

assert.equal(isStudentByGuildTenure({ isInGuild: true, guildJoinedAt: oneMonthAgo }, now), true);
assert.equal(isStudentByGuildTenure({ isInGuild: true, guildJoinedAt: threeMonthsAgo }, now), false);
console.log('✓ 서버 가입 2달 기준 검증');

console.log(`\n${passed}/${cases.length} 검증 케이스 통과`);
