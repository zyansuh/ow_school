/**
 * AssignmentHistory 레거시 배필
 *
 * 기본: --dry-run (읽기만, INSERT 없음)
 * 실행: node scripts/backfill-assignment-history.mjs --dry-run
 *       node scripts/backfill-assignment-history.mjs --execute
 *       node scripts/backfill-assignment-history.mjs --verify --batch=<batchId>
 *       node scripts/backfill-assignment-history.mjs --rollback --batch=<batchId>
 *
 * User / Teacher 행은 수정하지 않습니다.
 */
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOTE_PREFIX = 'backfill: legacy assignment (original assignment date unknown)';
const ASSIGNABLE_ACTIONS = ['assigned', 'reassigned', 'restored'];

const DEFAULT_TEACHER_DISCORD_ROLES = [
  { name: '신입반 주임교사', priority: 1 },
  { name: '신입반 교사', priority: 2 },
  { name: '신입반 보조교사', priority: 3 },
  { name: '신입반교사', priority: 2 },
];
const STUDENT_GUILD_TENURE_MONTHS = 2;

function parseArgs(argv) {
  const flags = new Set();
  const opts = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith('--batch=')) opts.batch = a.slice('--batch='.length);
    else if (a.startsWith('--')) flags.add(a.slice(2));
  }
  return { flags, opts };
}

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

function getUserRole(user, ctx) {
  const override = user.siteRole?.trim();
  if (isSiteUserRole(override)) return override;

  if (user.adminRole) return 'admin';
  if (user.discordId && ctx.teacherDiscordUserIds.has(user.discordId)) return 'teacher';
  for (const c of [user.discordServerNick, user.discordNickname, user.discordUsername]) {
    const key = normalizeTeacherNameKey(c);
    if (key && ctx.teacherDiscordNames.has(key)) return 'teacher';
  }
  const roleNames = parseRoleNames(user.discordRoleNames);
  if (roleNames.some((n) => ctx.allowedRoleNames.has(n))) return 'teacher';
  if (user.status === 'active' && user.teacherId) return 'student';
  if (isStudentByGuildTenure(user)) return 'student';
  return 'resident';
}

function makeBatchId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = randomBytes(4).toString('hex');
  return `bf_${stamp}_${rand}`;
}

function noteForBatch(batchId) {
  return `${NOTE_PREFIX} | batch=${batchId}`;
}

function parseBatchFromNote(note) {
  const m = String(note ?? '').match(/\|\s*batch=([^\s|]+)/);
  return m?.[1] ?? null;
}

/** Postgres advisory lock key from batch namespace (transaction-scoped) */
function advisoryLockKey() {
  const hex = createHash('sha256').update('ow-school:assignment-history-backfill').digest();
  // signed 64-bit from first 8 bytes
  return hex.readBigInt64BE(0);
}

async function loadRoleContext() {
  const [teachers, setting] = await Promise.all([
    prisma.teacher.findMany({
      select: { discordUserId: true, discord: true },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'teacher_discord_roles' } }),
  ]);

  let roles = DEFAULT_TEACHER_DISCORD_ROLES;
  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length) roles = parsed;
    } catch {
      /* default */
    }
  }

  return {
    teacherDiscordUserIds: new Set(teachers.map((t) => t.discordUserId).filter(Boolean)),
    teacherDiscordNames: new Set(
      teachers.map((t) => normalizeTeacherNameKey(t.discord)).filter(Boolean),
    ),
    allowedRoleNames: new Set(roles.map((r) => r.name)),
  };
}

async function findCandidates(ctx) {
  const users = await prisma.user.findMany({
    where: {
      status: 'active',
      teacherId: { not: null },
    },
    include: { adminRole: true },
  });

  const withHistory = await prisma.assignmentHistory.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      action: { in: ASSIGNABLE_ACTIONS },
    },
    select: { userId: true },
  });
  const hasHistory = new Set(withHistory.map((h) => h.userId));

  const rows = [];
  const excluded = { admin: 0, teacher: 0, resident: 0, hasHistory: 0 };

  for (const u of users) {
    if (hasHistory.has(u.id)) {
      excluded.hasHistory += 1;
      continue;
    }
    const role = getUserRole(u, ctx);
    if (role !== 'student') {
      excluded[role] = (excluded[role] ?? 0) + 1;
      continue;
    }
    rows.push({
      userId: u.id,
      teacherId: u.teacherId,
      classId: u.classId,
      role,
      siteRole: u.siteRole,
      status: u.status,
    });
  }

  return { rows, excluded, activeWithTeacherId: users.length };
}

async function dryRun() {
  const ctx = await loadRoleContext();
  const { rows, excluded, activeWithTeacherId } = await findCandidates(ctx);
  const batchId = makeBatchId();

  console.log(
    JSON.stringify(
      {
        mode: 'dry-run',
        wouldInsert: rows.length,
        previewBatchId: batchId,
        noteExample: noteForBatch(batchId),
        activeWithTeacherId,
        excluded,
        sample: rows.slice(0, 10),
        allUserIds: rows.map((r) => r.userId),
      },
      null,
      2,
    ),
  );
  return { rows, batchId };
}

async function execute() {
  const ctx = await loadRoleContext();
  const batchId = makeBatchId();
  const note = noteForBatch(batchId);

  const result = await prisma.$transaction(async (tx) => {
    // 동시 실행 완화: 트랜잭션 advisory lock (스키마 변경 없음)
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advisoryLockKey()})`;

    const users = await tx.user.findMany({
      where: { status: 'active', teacherId: { not: null } },
      include: { adminRole: true },
    });

    const existing = await tx.assignmentHistory.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        action: { in: ASSIGNABLE_ACTIONS },
      },
      select: { userId: true },
    });
    const hasHistory = new Set(existing.map((h) => h.userId));

    const toInsert = [];
    for (const u of users) {
      if (hasHistory.has(u.id)) continue;
      if (getUserRole(u, ctx) !== 'student') continue;
      toInsert.push({
        userId: u.id,
        teacherId: u.teacherId,
        classId: u.classId,
        action: 'assigned',
        note,
      });
    }

    if (toInsert.length === 0) {
      return { inserted: 0, batchId, note, userIds: [] };
    }

    // createMany — id는 Prisma @default(cuid())
    await tx.assignmentHistory.createMany({ data: toInsert });

    const created = await tx.assignmentHistory.findMany({
      where: { note },
      select: { id: true, userId: true },
    });

    return {
      inserted: created.length,
      batchId,
      note,
      userIds: created.map((c) => c.userId),
    };
  });

  console.log(JSON.stringify({ mode: 'execute', ...result }, null, 2));
  console.log(
    `\nRollback later with:\n  node scripts/backfill-assignment-history.mjs --rollback --batch=${result.batchId}`,
  );
  return result;
}

async function verify(batchId) {
  if (!batchId) throw new Error('--verify requires --batch=<batchId>');
  const note = noteForBatch(batchId);
  const rows = await prisma.assignmentHistory.findMany({
    where: { note },
    orderBy: { createdAt: 'asc' },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, status: true, teacherId: true, classId: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  let classIdPreserved = 0;
  let mismatches = 0;
  for (const r of rows) {
    const u = byId.get(r.userId);
    if (!u) {
      mismatches += 1;
      continue;
    }
    if (r.classId === u.classId) classIdPreserved += 1;
    else mismatches += 1;
  }

  console.log(
    JSON.stringify(
      {
        mode: 'verify',
        batchId,
        note,
        rowCount: rows.length,
        classIdPreserved,
        classIdMismatchesOrMissingUser: mismatches,
        actions: [...new Set(rows.map((r) => r.action))],
        sample: rows.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

async function rollback(batchId) {
  if (!batchId) {
    throw new Error(
      '--rollback requires explicit --batch=<batchId>. Refusing broad note LIKE deletes.',
    );
  }
  const note = noteForBatch(batchId);
  const before = await prisma.assignmentHistory.count({ where: { note } });
  if (before === 0) {
    console.log(JSON.stringify({ mode: 'rollback', batchId, deleted: 0, message: 'no rows' }));
    return;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advisoryLockKey()})`;
    const res = await tx.assignmentHistory.deleteMany({ where: { note } });
    return res.count;
  });

  console.log(JSON.stringify({ mode: 'rollback', batchId, note, deleted }, null, 2));
}

async function main() {
  const { flags, opts } = parseArgs(process.argv);
  const modeCount = ['execute', 'verify', 'rollback'].filter((f) => flags.has(f)).length;
  if (modeCount > 1) throw new Error('Use only one of --execute | --verify | --rollback');

  if (flags.has('execute')) {
    await execute();
    return;
  }
  if (flags.has('verify')) {
    await verify(opts.batch);
    return;
  }
  if (flags.has('rollback')) {
    await rollback(opts.batch);
    return;
  }

  // default dry-run
  await dryRun();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
