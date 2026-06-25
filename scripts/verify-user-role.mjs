/**
 * 역할 분류 검증 (DB 없이 순수 함수)
 * 실행: node scripts/verify-user-role.mjs
 */
import assert from 'node:assert/strict';

const TEACHER_DISCORD_ROLE_NAME = '신입반교사';
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

function hasNewTeacherDiscordRole(roleNames) {
  return roleNames.includes(TEACHER_DISCORD_ROLE_NAME);
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

function inferUserRole(user, ctx) {
  if (isAdminUser(user)) return 'admin';
  if (hasNewTeacherDiscordRole(parseRoleNames(user.discordRoleNames))) return 'teacher';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
}

function getUserRole(user, ctx) {
  const override = user.siteRole?.trim();
  if (override === 'resident' || override === 'student' || override === 'teacher' || override === 'admin') {
    return override;
  }
  return inferUserRole(user, ctx);
}

function isStudentUser(user, ctx) {
  return getUserRole(user, ctx) === 'student';
}

const now = new Date('2026-06-25T12:00:00Z');
const oneMonthAgo = new Date('2026-05-25T12:00:00Z');
const threeMonthsAgo = new Date('2026-03-25T12:00:00Z');

const emptyCtx = { teacherDiscordUserIds: new Set(), teacherDiscordNames: new Set() };

const cases = [
  {
    name: '케이스 1: 신입반교사 → teacher',
    user: { discordRoleNames: JSON.stringify(['신입반교사']), isInGuild: true, guildJoinedAt: oneMonthAgo },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 2: adminRole → admin',
    user: { adminRole: { id: '1' }, isInGuild: true, guildJoinedAt: oneMonthAgo },
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
];

let passed = 0;
for (const c of cases) {
  const role = getUserRole(c.user, emptyCtx);
  const inList = isStudentUser(c.user, emptyCtx);
  assert.equal(role, c.expectedRole, `${c.name}: role`);
  assert.equal(inList, c.inStudentList, `${c.name}: student list`);
  console.log(`✓ ${c.name}`);
  passed++;
}

assert.equal(isStudentByGuildTenure({ isInGuild: true, guildJoinedAt: oneMonthAgo }, now), true);
assert.equal(isStudentByGuildTenure({ isInGuild: true, guildJoinedAt: threeMonthsAgo }, now), false);
console.log('✓ 서버 가입 2달 기준 검증');

console.log(`\n${passed}/${cases.length} 검증 케이스 통과`);
