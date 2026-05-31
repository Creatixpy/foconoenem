#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_OUTPUT = path.resolve(ROOT, '..', 'foconoenem-public-release');
const outputDir = path.resolve(process.argv[2] || DEFAULT_OUTPUT);

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: ROOT,
    stdio: options.stdio ?? 'pipe',
    encoding: options.encoding ?? 'utf8',
  });
}

function assertReleaseReady() {
  run('npm', ['run', 'verify:open-source'], { stdio: 'inherit' });
}

function trackedAndUntrackedFiles() {
  const output = run('git', ['ls-files', '-z', '--others', '--cached', '--exclude-standard'], {
    encoding: 'buffer',
  });

  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((file) => fs.existsSync(path.join(ROOT, file)))
    .filter((file) => !file.startsWith('.git/'));
}

function copyFile(relativePath) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  fs.chmodSync(target, fs.statSync(source).mode);
}

assertReleaseReady();

if (fs.existsSync(outputDir)) {
  const marker = path.join(outputDir, '.foconoenem-public-release');
  if (!fs.existsSync(marker)) {
    throw new Error(`Refusing to overwrite ${outputDir}; marker file is missing.`);
  }
  fs.rmSync(outputDir, { recursive: true, force: true });
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, '.foconoenem-public-release'),
  `Generated from ${run('git', ['rev-parse', '--short', 'HEAD']).trim()} on ${new Date().toISOString()}${os.EOL}`
);

for (const file of trackedAndUntrackedFiles()) {
  copyFile(file);
}

console.log(`Created clean public release tree at ${outputDir}`);
console.log('Next step: initialize a new Git repository there and publish only after rotating exposed secrets.');
