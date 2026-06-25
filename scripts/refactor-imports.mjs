#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const replacements = [
  ['@/lib/teacher/assigned-students', '@/lib/teacher/assigned-students'],
  ['@/lib/teacher/discord-field', '@/lib/teacher/discord-field'],
  ['@/lib/teacher/discord-link', '@/lib/teacher/discord-link'],
  ['@/lib/teacher/students', '@/lib/teacher/students'],
  ['@/lib/teacher/recruiting', '@/lib/teacher/recruiting'],
  ['@/lib/teacher/classes', '@/lib/teacher/classes'],
  ['@/lib/teacher/counts', '@/lib/teacher/counts'],
  ['@/lib/teacher/display', '@/lib/teacher/display'],
  ['@/lib/teacher/activity', '@/lib/teacher/activity'],
  ['@/lib/teacher/delete', '@/lib/teacher/delete'],
  ['@/lib/teacher/auth', '@/lib/teacher/auth'],
  ['@/lib/teacher/query', '@/lib/teacher/query'],
  ['@/lib/admin/discord-sync', '@/lib/admin/discord-sync'],
  ['@/lib/discord/guild', '@/lib/discord/guild'],
  ['@/lib/discord/guild-membership', '@/lib/discord/guild-membership'],
  ['@/lib/discord/guild-tenure', '@/lib/discord/guild-tenure'],
  ['@/lib/discord/id', '@/lib/discord/id'],
  ['@/lib/admin/points', '@/lib/admin/points'],
  ['@/lib/auth/config', '@/lib/auth/config'],
  ['@/lib/auth/errors', '@/lib/auth/errors'],
  ['@/lib/auth/url', '@/lib/auth/url'],
  ['@/lib/students/assignment', '@/lib/students/assignment'],
  ['@/lib/students/users', '@/lib/students/users'],
  ['@/lib/users/display', '@/lib/users/display'],
  ['@/lib/users/header', '@/lib/users/header'],
  ['@/lib/users/role', '@/lib/users/role'],
  ['@/lib/home/class-stats', '@/lib/home/class-stats'],
  ['@/lib/home/stats', '@/lib/home/stats'],
  ['@/lib/home/ensure-classes', '@/lib/home/ensure-classes'],
  ['@/lib/interviews/access', '@/lib/interviews/access'],
  ['@/lib/interviews/utils', '@/lib/interviews/utils'],
  ['@/lib/utils/async', '@/lib/utils/async'],
  ['@/lib/utils/form-options', '@/lib/utils/form-options'],
  ['@/lib/students/graduation', '@/lib/students/graduation'],
  ['@/lib/auth/rbac', '@/lib/auth/rbac'],
  ['@/lib/utils/mbti', '@/lib/utils/mbti'],
  ['@/lib/utils/segment', '@/lib/utils/segment'],
  ["@/lib/applications/status'", "@/lib/applications/status'"],
  ['@/lib/applications/status"', '@/lib/applications/status"'],
  ['@/hooks/auth/use-discord-sign-in', '@/hooks/auth/use-discord-sign-in'],
  ['@/components/home/home-content', '@/components/home/home-content'],
];

function collectFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name !== 'node_modules' && name !== '.next') collectFiles(p, acc);
    } else if (/\.(ts|tsx|mjs)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

const files = [...collectFiles(join(root, 'src')), ...collectFiles(join(root, 'scripts'))];
let changed = 0;
for (const file of files) {
  const orig = readFileSync(file, 'utf8');
  let text = orig;
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  if (text !== orig) {
    writeFileSync(file, text);
    changed++;
  }
}
console.log(`Updated imports in ${changed} files`);
