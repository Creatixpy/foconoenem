#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';

const SECRET_PATTERNS = [
  'sk_(live|test)_[A-Za-z0-9]{16,}',
  'whsec_[A-Za-z0-9]{16,}',
  'AIza[0-9A-Za-z_-]{30,}',
  'gsk_[A-Za-z0-9]{20,}',
  'nvapi-[A-Za-z0-9_-]{20,}',
  'sb_secret_[A-Za-z0-9_-]{20,}',
  'sbp_[A-Za-z0-9_-]{20,}',
  'SUPABASE_ACCESS_TOKEN[[:space:]]*[:=][[:space:]]*[^[:space:],}]+',
];

const EXCLUDED_PATHS = [
  ':!node_modules',
  ':!.next',
  ':!.vercel/output',
  ':!.bin',
];

const pattern = SECRET_PATTERNS.join('|');
const revisions = execFileSync('git', ['rev-list', '--all'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const hits = new Map();

for (const revision of revisions) {
  const result = spawnSync(
    'git',
    ['grep', '-Il', '-E', pattern, revision, '--', '.', ...EXCLUDED_PATHS],
    { encoding: 'utf8' }
  );

  if (result.status !== 0 && result.status !== 1) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  for (const line of result.stdout.split('\n').filter(Boolean)) {
    const firstColon = line.indexOf(':');
    const file = firstColon >= 0 ? line.slice(firstColon + 1) : line;
    hits.set(file, (hits.get(file) ?? 0) + 1);
  }
}

if (hits.size > 0) {
  console.error('Git history verification failed. Matching files:');
  for (const [file, count] of [...hits.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`- ${file} (${count} revisions)`);
  }
  console.error('\nPublish from a fresh/orphan history or rewrite history before making the repository public.');
  process.exit(1);
}

console.log('Git history verification passed.');
