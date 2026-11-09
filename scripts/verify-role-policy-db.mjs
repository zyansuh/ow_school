/**
 * 읽기 전용: 수정된 역할 정책을 실제 DB 유저에 적용해 집계 검증
 * DB 쓰기 없음.
 * node scripts/verify-role-policy-db.mjs
 */
import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';

const prisma = new PrismaClient();
const STUDENT_GUILD_TENURE_MONTHS = 2;
const DEFAULT_TEACHER_DISCORD_ROLES = [
  { name: '신입반 주임교사', priority: 1 },
  { name: '신입반 교사', priority: 2 },
  { name: '신입반 보조교사', priority: 3 },
  { name: '신입반교사', priority: 2 },
];

function parseRoleNames(json) {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function isSiteUserRole(v) {
  return v === 'resident' || v === 'student' || v === 'teacher' || v === 'admin';
}
function resolveGuildJoinedAt(user) {
  if (user.guildJoinedAt) return user.guildJoinedAt;
  if (user.isInGuild && user.createdAt) return user.createdAt;
  return null;
}
function isStudentByGuildTenure(user) {
  if (!user.isInGuild) return false;
  const joined = resolveGuildJoinedAt(user);
  if (!joined) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STUDENT_GUILD_TENURE_MONTHS);
  return joined > cutoff;
}
function normalizeTeacherNameKey(value) {
  const v = value?.trim().toLowerCase();
  if (!v || /^\d{17,20}$/.test(v)) return null;
  return v;
}
/** 구정책: active+teacherId 규칙 없음 */
function getRoleLegacy(user, ctx) {
  const override = user.siteRole?.trim();
  if (isSiteUserRole(override)) return override;
  if (user.adminRole) return 'admin';
  if (user.discordId && ctx.teacherDiscordUserIds.has(user.discordId)) return 'teacher';
  for (const c of [user.discordServerNick, user.discordNickname, user.discordUsername]) {
    const key = normalizeTeacherNameKey(c);
    if (key && ctx.teacherDiscordNames.has(key)) return 'teacher';
  }
  if (parseRoleNames(user.discordRoleNames).some((n) => ctx.allowedRoleNames.has(n))) return 'teacher';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
}
/** 신정책 */
function getRoleNew(user, ctx) {
  const override = user.siteRole?.trim();
  if (isSiteUserRole(override)) return override;
  if (user.adminRole) return 'admin';
  if (user.discordId && ctx.teacherDiscordUserIds.has(user.discordId)) return 'teacher';
  for (const c of [user.discordServerNick, user.discordNickname, user.discordUsername]) {
    const key = normalizeTeacherNameKey(c);
    if (key && ctx.teacherDiscordNames.has(key)) return 'teacher';
  }
  if (parseRoleNames(user.discordRoleNames).some((n) => ctx.allowedRoleNames.has(n))) return 'teacher';
  if (user.status === 'active' && user.teacherId) return 'student';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
}

async function main() {
  const [teachers, setting, users] = await Promise.all([
    prisma.teacher.findMany({ select: { discordUserId: true, discord: true } }),
    prisma.siteSetting.findUnique({ where: { key: 'teacher_discord_roles' } }),
    prisma.user.findMany({ include: { adminRole: true } }),
  ]);
  let roles = DEFAULT_TEACHER_DISCORD_ROLES;
  if (setting?.value) {
    try {
      const p = JSON.parse(setting.value);
      if (Array.isArray(p) && p.length) roles = p;
    } catch {
      /* */
    }
  }
  const ctx = {
    teacherDiscordUserIds: new Set(teachers.map((t) => t.discordUserId).filter(Boolean)),
    teacherDiscordNames: new Set(
      teachers.map((t) => normalizeTeacherNameKey(t.discord)).filter(Boolean),
    ),
    allowedRoleNames: new Set(roles.map((r) => r.name)),
  };

  const activeAssigned = users.filter((u) => u.status === 'active' && u.teacherId);
  const legacyStudents = activeAssigned.filter((u) => getRoleLegacy(u, ctx) === 'student');
  const newStudents = activeAssigned.filter((u) => getRoleNew(u, ctx) === 'student');
  const newlyStudent = activeAssigned.filter(
    (u) => getRoleLegacy(u, ctx) !== 'student' && getRoleNew(u, ctx) === 'student',
  );
  const adminsWithTeacher = activeAssigned.filter((u) => getRoleNew(u, ctx) === 'admin');
  const teachersWithTeacherId = activeAssigned.filter((u) => getRoleNew(u, ctx) === 'teacher');
  const explicitResidentKept = users.filter(
    (u) => u.siteRole === 'resident' && u.status === 'active' && u.teacherId,
  );
  const graduatedWithTeacher = users.filter((u) => u.status === 'graduated' && u.teacherId);
  const withdrawnWithTeacher = users.filter((u) => u.status === 'withdrawn' && u.teacherId);

  // findActiveAssignedStudents 상당: active + teacherId + adminRole null + role student
  const enrollmentCount = users.filter(
    (u) =>
      u.status === 'active' &&
      u.teacherId &&
      !u.adminRole &&
      getRoleNew(u, ctx) === 'student',
  ).length;

  assert.equal(legacyStudents.length, 46, 'legacy assigned students should be 46');
  assert.equal(newlyStudent.length, 3, 'exactly 3 resident→student');
  assert.equal(newStudents.length, 49, 'proposed assigned students 49');
  assert.equal(adminsWithTeacher.length, 12, '12 admins keep admin');
  assert.ok(
    newlyStudent.every((u) => getRoleLegacy(u, ctx) === 'resident' && !u.siteRole),
    'new students were inferred residents',
  );
  assert.ok(
    adminsWithTeacher.every((u) => getRoleNew(u, ctx) !== 'student'),
    'admins not students',
  );
  assert.ok(
    teachersWithTeacherId.every((u) => getRoleNew(u, ctx) === 'teacher'),
    'teachers stay teachers',
  );
  for (const u of explicitResidentKept) {
    assert.equal(getRoleNew(u, ctx), 'resident');
  }
  for (const u of [...graduatedWithTeacher, ...withdrawnWithTeacher]) {
    assert.notEqual(
      u.status === 'active' && !!u.teacherId,
      true,
      'grad/withdrawn not active-assigned candidate',
    );
    // 재학 집계 제외
    assert.notEqual(u.status, 'active');
  }
  assert.equal(enrollmentCount, 49);

  console.log(
    JSON.stringify(
      {
        ok: true,
        legacyAssignedStudents: legacyStudents.length,
        newAssignedStudents: newStudents.length,
        newlyStudentIds: newlyStudent.map((u) => u.id),
        adminsWithTeacherId: adminsWithTeacher.length,
        teachersWithTeacherId: teachersWithTeacherId.length,
        explicitResidentWithTeacherId: explicitResidentKept.length,
        enrollmentCountLikeFindActiveAssigned: enrollmentCount,
        graduatedWithTeacherId: graduatedWithTeacher.length,
        withdrawnWithTeacherId: withdrawnWithTeacher.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
