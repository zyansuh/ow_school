import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const hasDb = Boolean(process.env.DATABASE_URL);

run('npx prisma generate');

if (hasDb && !isCi) {
  run('npx prisma db push --skip-generate');
  run('npx prisma db seed');
} else if (!hasDb) {
  console.warn('[build] DATABASE_URL not set — skipping db push/seed');
} else {
  console.warn('[build] CI environment — skipping db push/seed');
}

run('npx next build');
