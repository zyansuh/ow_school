import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim() ?? '';
  // Vercel에 따옴표까지 넣은 경우 제거
  return raw.replace(/^["']|["']$/g, '');
}

function isValidPostgresUrl(url) {
  return /^postgres(ql)?:\/\//.test(url);
}

const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const databaseUrl = getDatabaseUrl();
const hasValidDb = isValidPostgresUrl(databaseUrl);

if (databaseUrl && !hasValidDb) {
  console.warn(
    '[build] DATABASE_URL must start with postgresql:// or postgres://',
    `(current prefix: ${JSON.stringify(databaseUrl.slice(0, 20))}...)`,
  );
}

run('npx prisma generate');

if (hasValidDb && !isCi) {
  process.env.DATABASE_URL = databaseUrl;
  run('npx prisma db push --skip-generate');
  run('npx prisma db seed');
} else if (!databaseUrl) {
  console.warn('[build] DATABASE_URL not set — skipping db push/seed');
} else if (isCi) {
  console.warn('[build] CI environment — skipping db push/seed');
} else {
  console.warn('[build] Invalid DATABASE_URL — skipping db push/seed, continuing build');
}

run('npx next build');
