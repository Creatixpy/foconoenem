#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { git, printFailures, privatePathRules, verifyCurrentTree } from './public-security.mjs';

const root = process.cwd();
const output = path.resolve(process.argv[2] || path.resolve(root, '..', 'aprovia-public-release'));
let temporary;

function resolvesWithinRepository(target) {
  let ancestor = target;
  const suffix = [];
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('unsafe_output');
    suffix.unshift(path.basename(ancestor));
    ancestor = parent;
  }
  const realTarget = path.resolve(fs.realpathSync(ancestor), ...suffix);
  const relative = path.relative(fs.realpathSync(root), realTarget);
  return !relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..');
}

try {
  const relative = path.relative(root, output);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..') || relative === '..' || resolvesWithinRepository(output)) {
    throw new Error('unsafe_output');
  }
  if (fs.existsSync(output)) throw new Error('existing_output');
  const { failures, entries } = verifyCurrentTree(root);
  if (failures.length) {
    console.error('Public release refused:');
    printFailures(failures);
    process.exitCode = 1;
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    temporary = fs.mkdtempSync(`${output}.tmp-`);
    for (const entry of entries) {
      if (entry.stage !== 0 || privatePathRules(entry.file).length || !['100644', '100755'].includes(entry.mode)) continue;
      const target = path.resolve(temporary, entry.file);
      if (!target.startsWith(`${temporary}${path.sep}`)) throw new Error('unsafe_path');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, git(root, ['cat-file', 'blob', entry.oid]), { mode: entry.mode === '100755' ? 0o755 : 0o644 });
    }
    fs.writeFileSync(path.join(temporary, '.aprovia-public-release'), 'Public release snapshot: tracked index files only.\n');
    if (fs.existsSync(output)) throw new Error('existing_output');
    fs.renameSync(temporary, output);
    temporary = undefined;
    console.log('Created a public release snapshot from approved tracked index files. Untracked, ignored and private files were excluded.');
    console.log('This export does not establish clean remote history or credential revocation.');
  }
} catch (error) {
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
  const message = error?.message === 'existing_output'
    ? 'Public release refused: output already exists; choose a new empty destination.'
    : 'Public release could not complete safely. Existing directories were not overwritten.';
  console.error(message);
  process.exitCode = 1;
}
