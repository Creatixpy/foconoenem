#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const REQUIRED_FILES = [
  '.env.example',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'LICENSE',
];

const EXCLUDED_PREFIXES = [
  '.git/',
  '.next/',
  '.vercel/',
  '.bin/',
  'node_modules/',
];

const SECRET_RULES = [
  ['private_key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['stripe_secret_key', /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['stripe_webhook_secret', /\bwhsec_[A-Za-z0-9]{16,}\b/],
  ['supabase_secret_key', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ['supabase_personal_access_token', /\bsbp_[A-Za-z0-9_-]{20,}\b/],
  ['google_api_key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['groq_api_key', /\bgsk_[A-Za-z0-9]{20,}\b/],
  ['nvidia_api_key', /\bnvapi-[A-Za-z0-9_-]{20,}\b/],
  ['openai_api_key', /\bsk-proj-[A-Za-z0-9_-]{20,}\b|\bsk-[A-Za-z0-9]{32,}\b/],
  ['github_token', /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/],
  ['vercel_token', /\bvercel_[A-Za-z0-9]{20,}\b/],
];

function gitLsFiles() {
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--others', '--cached', '--exclude-standard'],
    { encoding: 'buffer' }
  );

  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((file) => fs.existsSync(file))
    .filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

function isBinary(buffer) {
  return buffer.includes(0);
}

const failures = [];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(file)) {
    failures.push(`missing required release file: ${file}`);
  }
}

for (const file of gitLsFiles()) {
  const buffer = fs.readFileSync(file);
  if (isBinary(buffer)) continue;

  const lines = buffer.toString('utf8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const [name, rule] of SECRET_RULES) {
      if (rule.test(line)) {
        failures.push(`${file}:${index + 1}: matched ${name}`);
      }
      rule.lastIndex = 0;
    }
  }
}

if (failures.length > 0) {
  console.error('Open-source verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Open-source verification passed for the current publishable tree.');
