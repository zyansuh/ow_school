import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

run('prisma generate');

if (process.env.DATABASE_URL) {
  run('prisma db push --skip-generate');
  run('tsx prisma/seed.ts');
} else {
  console.warn('[vercel-build] DATABASE_URL not set — skipping db push/seed');
}

run('next build');
