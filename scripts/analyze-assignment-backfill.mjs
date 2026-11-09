/**
 * 읽기 전용: 역할 정책(현행 vs 제안) 비교 + AssignmentHistory 백필 대상 산출
 * 실행: node scripts/analyze-assignment-backfill.mjs
 * DB 쓰기 없음.
 */
import { PrismaClient } from '@prisma/client';

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

function isStudentByGuildTenure(user, now = new Date()) {
  if (!user.isInGuild) return false;
  const joined = resolveGuildJoinedAt(user);
  if (!joined) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - STUDENT_GUILD_TENURE_MONTHS);
  return joined > cutoff;
}

function normalizeTeacherNameKey(value) {
  const v = value?.trim().toLowerCase();
  if (!v) return null;
  if (/^\d{17,20}$/.test(v)) return null;
  return v;
}

function hasTeacherDiscordRole(user, allowedNames) {
  const names = parseRoleNames(user.discordRoleNames);
  const allowed = new Set(allowedNames);
  return names.some((n) => allowed.has(n));
}

function isTeacherByDiscordUserId(discordId, ctx) {
  return !!discordId && ctx.teacherDiscordUserIds.has(discordId);
}

function isTeacherByTeacherRecordName(user, ctx) {
  if (!ctx.teacherDiscordNames.size) return false;
  for (const c of [user.discordServerNick, user.discordNickname, user.discordUsername]) {
    const key = normalizeTeacherNameKey(c);
    if (key && ctx.teacherDiscordNames.has(key)) return true;
  }
  return false;
}

/** 현행 inferUserRole (role.ts와 동일) */
function inferCurrent(user, ctx) {
  if (user.adminRole) return 'admin';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  if (isTeacherByTeacherRecordName(user, ctx)) return 'teacher';
  if (hasTeacherDiscordRole(user, ctx.allowedRoleNames)) return 'teacher';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
}

function getCurrentRole(user, ctx) {
  const override = user.siteRole?.trim();
  if (isSiteUserRole(override)) return override;
  return inferCurrent(user, ctx);
}

/**
 * 제안 정책 infer:
 * - AdminRole / Teacher 등록 / Discord 선생님 역할 우선
 * - status=active && teacherId → student (가입기간 무시)
 * - 그 외 가입기간 student / resident
 * getRole: siteRole 명시값(admin/teacher/student/resident) 존중
 */
function inferProposed(user, ctx) {
  if (user.adminRole) return 'admin';
  if (isTeacherByDiscordUserId(user.discordId, ctx)) return 'teacher';
  if (isTeacherByTeacherRecordName(user, ctx)) return 'teacher';
  if (hasTeacherDiscordRole(user, ctx.allowedRoleNames)) return 'teacher';
  if (user.status === 'active' && user.teacherId) return 'student';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
}

function getProposedRole(user, ctx) {
  const override = user.siteRole?.trim();
  if (isSiteUserRole(override)) return override;
  return inferProposed(user, ctx);
}

async function main() {
  const [teachers, setting, users, histories] = await Promise.all([
    prisma.teacher.findMany({
      select: { id: true, discordUserId: true, discord: true, classId: true },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'teacher_discord_roles' } }),
    prisma.user.findMany({
      include: { adminRole: true },
    }),
    prisma.assignmentHistory.findMany({
      select: { id: true, userId: true, action: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  let roleEntries = DEFAULT_TEACHER_DISCORD_ROLES;
  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length) roleEntries = parsed;
    } catch {
      /* keep default */
    }
  }

  const ctx = {
    teacherDiscordUserIds: new Set(
      teachers.map((t) => t.discordUserId).filter(Boolean),
    ),
    teacherDiscordNames: new Set(
      teachers.map((t) => normalizeTeacherNameKey(t.discord)).filter(Boolean),
    ),
    allowedRoleNames: roleEntries.map((r) => r.name),
  };

  const teacherById = new Map(teachers.map((t) => [t.id, t]));
  const historyByUser = new Map();
  for (const h of histories) {
    if (!historyByUser.has(h.userId)) historyByUser.set(h.userId, []);
    historyByUser.get(h.userId).push(h);
  }

  const hasAssignableHistory = (userId) => {
    const list = historyByUser.get(userId) ?? [];
    return list.some((h) =>
      h.action === 'assigned' || h.action === 'reassigned' || h.action === 'restored',
    );
  };

  const roleCountsCurrent = { admin: 0, teacher: 0, student: 0, resident: 0 };
  const roleCountsProposed = { admin: 0, teacher: 0, student: 0, resident: 0 };
  const transitions = [];

  for (const u of users) {
    const cur = getCurrentRole(u, ctx);
    const prop = getProposedRole(u, ctx);
    roleCountsCurrent[cur] += 1;
    roleCountsProposed[prop] += 1;
    if (cur !== prop) {
      transitions.push({
        userId: u.id,
        from: cur,
        to: prop,
        status: u.status,
        siteRole: u.siteRole,
        teacherId: u.teacherId,
      });
    }
  }

  const activeAssigned = users.filter((u) => u.status === 'active' && u.teacherId);
  const activeAssignedRows = activeAssigned.map((u) => {
    const teacher = teacherById.get(u.teacherId);
    const classMatch =
      u.classId == null
        ? 'null'
        : teacher && u.classId === teacher.classId
          ? 'match'
          : 'mismatch';
    return {
      userId: u.id,
      siteRole: u.siteRole,
      currentRole: getCurrentRole(u, ctx),
      proposedRole: getProposedRole(u, ctx),
      status: u.status,
      teacherId: u.teacherId,
      classId: u.classId,
      classMatch,
      hasAssignableHistory: hasAssignableHistory(u.id),
      historyCount: (historyByUser.get(u.id) ?? []).length,
    };
  });

  const currentStudentsAmongAssigned = activeAssignedRows.filter(
    (r) => r.currentRole === 'student',
  );
  const proposedStudentsAmongAssigned = activeAssignedRows.filter(
    (r) => r.proposedRole === 'student',
  );
  const newlyCountedAsStudent = activeAssignedRows.filter(
    (r) => r.currentRole !== 'student' && r.proposedRole === 'student',
  );

  /** 백필: active+teacherId + assigned/reassigned/restored 이력 없음 (역할과 무관 — 배정 사실 보존) */
  const backfillCandidates = activeAssignedRows.filter((r) => !r.hasAssignableHistory);

  /** 제안 정책 기준 학생만 백필할 경우 */
  const backfillIfStudentOnly = backfillCandidates.filter((r) => r.proposedRole === 'student');

  const excludedFromBackfillStudentOnly = backfillCandidates.filter(
    (r) => r.proposedRole !== 'student',
  );

  console.log(JSON.stringify({
    summary: {
      totalUsers: users.length,
      assignmentHistoryRows: histories.length,
      activeWithTeacherId: activeAssigned.length,
      roleCountsCurrent,
      roleCountsProposed,
      transitionCount: transitions.length,
      transitionsSample: transitions.slice(0, 20),
      activeAssigned_currentStudent: currentStudentsAmongAssigned.length,
      activeAssigned_proposedStudent: proposedStudentsAmongAssigned.length,
      newlyCountedAsStudent: newlyCountedAsStudent.length,
      newlyCountedAsStudentByPreviousRole: newlyCountedAsStudent.reduce((acc, r) => {
        acc[r.currentRole] = (acc[r.currentRole] ?? 0) + 1;
        return acc;
      }, {}),
      classMatchAmongActiveAssigned: activeAssignedRows.reduce((acc, r) => {
        acc[r.classMatch] = (acc[r.classMatch] ?? 0) + 1;
        return acc;
      }, {}),
      backfillCandidates_allActiveAssignedWithoutHistory: backfillCandidates.length,
      backfillCandidates_proposedStudentOnly: backfillIfStudentOnly.length,
      backfillExcluded_notProposedStudent: excludedFromBackfillStudentOnly.length,
      excludedBreakdown: excludedFromBackfillStudentOnly.reduce((acc, r) => {
        const key = `${r.proposedRole}|siteRole=${r.siteRole ?? 'null'}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    },
    backfillCandidates_proposedStudentOnly: backfillIfStudentOnly.map((r) => ({
      userId: r.userId,
      currentRole: r.currentRole,
      proposedRole: r.proposedRole,
      status: r.status,
      teacherId: r.teacherId,
      classId: r.classId,
      classMatch: r.classMatch,
      hasAssignableHistory: r.hasAssignableHistory,
    })),
    backfillExcluded_sample: excludedFromBackfillStudentOnly.slice(0, 30),
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
