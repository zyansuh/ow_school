/**
 * 역할 분류 5가지 검증 케이스 (DB 없이 순수 함수)
 * 실행: node scripts/verify-user-role.mjs
 */
import assert from 'node:assert/strict';

const TEACHER_DISCORD_ROLE_NAME = '신입반교사';

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

function getUserRole(user, ctx) {
  if (isAdminUser(user)) return 'admin';
  if (hasNewTeacherDiscordRole(parseRoleNames(user.discordRoleNames))) return 'teacher';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  return 'student';
}

function isStudentUser(user, ctx) {
  return getUserRole(user, ctx) === 'student';
}

const emptyCtx = { teacherDiscordUserIds: new Set(), teacherDiscordNames: new Set() };

const cases = [
  {
    name: '케이스 1: 신입반교사 → teacher, 학생 목록 제외',
    user: { discordRoleNames: JSON.stringify(['신입반교사']) },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 2: adminRole → admin, 학생 목록 제외',
    user: { adminRole: { id: '1' } },
    expectedRole: 'admin',
    inStudentList: false,
  },
  {
    name: '케이스 3: student만 → student, 학생 목록 포함',
    user: { discordRoleNames: JSON.stringify(['학생']) },
    expectedRole: 'student',
    inStudentList: true,
  },
  {
    name: '케이스 4: 신입반교사 + 학생 속성 → teacher 우선',
    user: {
      discordRoleNames: JSON.stringify(['신입반교사', '학생']),
      teacherId: 't1',
    },
    expectedRole: 'teacher',
    inStudentList: false,
  },
  {
    name: '케이스 5: admin + 신입반교사 → admin 우선',
    user: {
      adminRole: { id: '1' },
      discordRoleNames: JSON.stringify(['신입반교사']),
    },
    expectedRole: 'admin',
    inStudentList: false,
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

console.log(`\n${passed}/${cases.length} 검증 케이스 통과`);
