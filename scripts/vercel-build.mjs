import { execSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

function run(cmd, env = process.env) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env });
}

function normalizeDbUrl(raw) {
  return (raw ?? '').trim().replace(/^["']|["']$/g, '');
}

function isValidPostgresUrl(url) {
  return /^postgres(ql)?:\/\//.test(url);
}

/** Neon 마이그레이션은 pooler보다 direct URL이 안정적 */
function migrationDatabaseUrl(databaseUrl) {
  const direct = normalizeDbUrl(process.env.DIRECT_URL);
  if (direct && isValidPostgresUrl(direct)) {
    console.log('[build] Using DIRECT_URL for prisma migrate deploy');
    return direct;
  }
  return databaseUrl;
}

async function runMigrateDeploy(databaseUrl) {
  const url = migrationDatabaseUrl(databaseUrl);
  const env = { ...process.env, DATABASE_URL: url };
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[build] prisma migrate deploy (${attempt}/${maxAttempts})`);
      execSync('npx prisma migrate deploy', { stdio: 'inherit', env });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[build] migrate deploy failed (attempt ${attempt}): ${msg}`);
      if (attempt < maxAttempts) {
        const waitMs = attempt * 5000;
        console.log(`[build] Neon cold start 대기 후 재시도 (${waitMs / 1000}s)...`);
        await setTimeout(waitMs);
      }
    }
  }
  return false;
}

async function main() {
  const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const databaseUrl = normalizeDbUrl(process.env.DATABASE_URL);
  const hasValidDb = isValidPostgresUrl(databaseUrl);

  if (databaseUrl && !hasValidDb) {
    console.warn(
      '[build] DATABASE_URL must start with postgresql:// or postgres://',
      `(current prefix: ${JSON.stringify(databaseUrl.slice(0, 20))}...)`,
    );
  }

  run('npx prisma generate');

  if (hasValidDb && !isCi) {
    const migrated = await runMigrateDeploy(databaseUrl);
    if (!migrated) {
      console.warn(
        '[build] DB 마이그레이션 실패 — Next.js 빌드는 계속합니다.',
      );
      console.warn(
        '[build] 런타임 오류 시 Neon DATABASE_URL·DIRECT_URL 확인 후 수동 migrate deploy 실행.',
      );
    } else if (process.env.RUN_DB_SEED === 'true') {
      process.env.DATABASE_URL = databaseUrl;
      run('npx prisma db seed');
    } else {
      console.warn('[build] RUN_DB_SEED is not true — skipping seed (등록 데이터 보존)');
    }
  } else if (!databaseUrl) {
    console.warn('[build] DATABASE_URL not set — skipping migrate/seed');
  } else if (isCi) {
    console.warn('[build] CI environment — skipping migrate/seed');
  } else {
    console.warn('[build] Invalid DATABASE_URL — skipping migrate/seed');
  }

  run('npx next build');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
