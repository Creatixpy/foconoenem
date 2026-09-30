#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args) {
  return spawnSync('git', args, { cwd: checkout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

try {
  const worktree = git(['rev-parse', '--show-toplevel']);
  if (worktree.status !== 0 || fs.realpathSync(worktree.stdout.trim()) !== fs.realpathSync(checkout)) {
    console.log('Security hooks skipped: this checkout has no matching Git worktree.');
  } else {
    const hookDirectory = path.join(checkout, '.githooks');
    if (!fs.existsSync(hookDirectory) || !fs.lstatSync(hookDirectory).isDirectory() || fs.lstatSync(hookDirectory).isSymbolicLink()) throw new Error('missing_hooks');
    const hookFiles = ['pre-commit', 'pre-push'];
    for (const file of hookFiles) {
      const absolute = path.join(hookDirectory, file);
      if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile() || fs.lstatSync(absolute).isSymbolicLink()) throw new Error('missing_hooks');
    }
    if (git(['ls-files', '--error-unmatch', ...hookFiles.map((file) => `.githooks/${file}`)]).status !== 0) throw new Error('untracked_hooks');
    const configuration = git(['config', '--get-all', 'core.hooksPath']);
    if (configuration.status !== 0 && configuration.status !== 1) throw new Error('git_configuration');
    const configuredPaths = configuration.stdout.trim().split('\n').filter(Boolean);
    if (configuredPaths.some((configured) => path.resolve(checkout, configured) !== hookDirectory)) throw new Error('existing_configuration');
    if (!configuredPaths.length) {
      const defaultLocation = git(['rev-parse', '--git-path', 'hooks']);
      if (defaultLocation.status !== 0) throw new Error('git_configuration');
      const defaults = path.resolve(checkout, defaultLocation.stdout.trim());
      if (fs.existsSync(defaults) && fs.readdirSync(defaults).some((file) => !file.endsWith('.sample'))) throw new Error('existing_default_hooks');
    }
    for (const file of hookFiles) fs.chmodSync(path.join(hookDirectory, file), 0o755);
    if (!configuredPaths.length && git(['config', '--local', 'core.hooksPath', '.githooks']).status !== 0) throw new Error('git_configuration');
    console.log('Security hooks enabled: pre-commit validates index/tree; pre-push validates tree and every proposed history before transfer.');
  }
} catch (error) {
  const explanation = ['existing_configuration', 'existing_default_hooks'].includes(error?.message)
    ? 'Existing Git hooks were preserved. Integrate the security checks into that hook setup explicitly.'
    : 'Hook installation could not complete safely. Existing Git configuration was preserved.';
  console.error(`Security hooks not installed: ${explanation}`);
  process.exitCode = 1;
}
