import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { formatFinding, privatePathRules, scanSecrets, verifyCurrentTree, verifyHistory } from '../../scripts/public-security.mjs';

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts');
const hookRoot = path.resolve(scriptRoot, '../.githooks');
const offlineEnv = { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_SYSTEM: os.devNull, GIT_AUTHOR_NAME: 'Offline fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'Offline fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' };
for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_COUNT']) delete offlineEnv[name];
const fake = (prefix, length = 40) => prefix + 'aB123cdEF456'.repeat(12).slice(0, length);
const jwt = (role) => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url'),
  Buffer.from('offline-fixture-signature').toString('base64url'),
].join('.');

function runGit(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: offlineEnv });
  } catch { throw new Error('Offline Git fixture command failed; output suppressed.'); }
}

function fixture(t) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'aprovia-security-test-'));
  const root = path.join(parent, 'repo');
  fs.mkdirSync(root);
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  runGit(root, ['init', '--quiet']);
  for (const file of ['.env.example', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'LICENSE']) fs.writeFileSync(path.join(root, file), 'Safe public fixture.\n');
  fs.writeFileSync(path.join(root, '.gitignore'), '.env.local\nAGENTS.md\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '--quiet', '-m', 'Public fixture']);
  return { root, parent };
}

test('provider patterns, privileged JWT, inline assignments and private keys return redacted locations', () => {
  const cases = [
    ['stripe_secret_key', fake('sk_' + 'live_')],
    ['stripe_secret_key', fake('rk_' + 'test_')],
    ['stripe_webhook_secret', fake('wh' + 'sec_')],
    ['supabase_secret_key', fake('sb_' + 'secret_')],
    ['supabase_personal_access_token', fake('sb' + 'p_')],
    ['google_api_key', fake('AI' + 'za')],
    ['groq_api_key', fake('gs' + 'k_')],
    ['openai_api_key', fake('sk-' + 'proj-')],
    ['openai_api_key', fake('sk-' + 'svcacct-')],
    ['github_token', fake('gh' + 'p_')],
    ['github_token', fake('github_' + 'pat_')],
    ['vercel_token', fake('ver' + 'cel_')],
    ['vercel_access_token', fake('vc' + 'p_')],
    ['npm_access_token', fake('np' + 'm_')],
    ['aws_access_key', 'AK' + 'IA' + 'A'.repeat(16)],
    ['slack_token', fake('xo' + 'xb-')],
    ['private_key', '-----BEGIN ' + 'RSA PRIVATE KEY-----'],
    ['privileged_supabase_jwt', jwt('service_role')],
    ['private_bearer_jwt', jwt('authenticated')],
    ['sensitive_literal_assignment', 'NEWSAPI_API_KEY=' + 'a1'.repeat(16)],
    ['sensitive_literal_assignment', 'ADMIN_CRON_' + 'SECRET=' + 'segredo-' + 'offline-fixture-value'],
    ['sensitive_literal_assignment', 'const apiKey = "' + fake('unprefixed') + '";'],
    ['sensitive_literal_assignment', '{"password":"' + fake('unprefixed') + '"}'],
    ['credential_url', 'postgresql://user:' + fake('unprefixed') + '@host/db'],
  ];
  for (const [rule, value] of cases) {
    const findings = scanSecrets(`public line\n${value}`);
    assert.equal(findings.some((finding) => finding.rule === rule && finding.line === 2), true, `Missing ${rule}`);
    assert.equal(JSON.stringify(findings).includes(value), false, `Credential leaked for ${rule}`);
    assert.equal(formatFinding({ ...findings[0], file: value, scope: 'fixture' }).includes(value), false, `Path leaked for ${rule}`);
  }
});

test('placeholders, public anon JWTs, operational identifiers and runtime references are accepted', () => {
  const safe = [
    'NEWSAPI_API_KEY=your-news-api-key',
    'NEWSAPI_API_KEY=sua-chave-newsapi',
    'SUPABASE_SERVICE_ROLE_KEY=chave-service-role',
    'API_TOKEN=${API_TOKEN}',
    'SUPABASE_SERVICE_ROLE_KEY=<replace-me>',
    'const apiKey = process.env.GEMINI_API_KEY;',
    'const password = form.password;',
    '{ apiKey: apiKey, token: existingToken, password: deletePassword }',
    '{ accessToken: session?.access_token, auth: "required" }',
    'function validatePassword(password: string): PasswordValidationResult {',
    'function signOut(token: string): Promise<AuthResult> {',
    'RESET_PASSWORD: "/reset-password",',
    'INVALID_PASSWORD: "INVALID_PASSWORD",',
    'const token = "test-token";',
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${jwt('anon')}`,
    'postgresql://user:<password>@host/database',
  ].join('\n');
  assert.deepEqual(scanSecrets(safe), []);
});

test('private paths cover nested dotenv, agent/editor state, key stores and diagnostics', () => {
  for (const file of ['.env', 'nested/.env.production', 'nested/AGENTS.override.md', 'AGENTS.md', 'AGENTS.local.md', '.vscode/settings.json', '.idea/workspace.xml', '.cursor/mcp.json', '.mcp.json', '.codex/state.json', '.local/cache.txt', '.testsprite/credentials.json', 'OPEN_SOURCE_RELEASE.md', 'nested/private.p12', 'secret.pfx', 'private.key', 'private.pem', 'id_rsa', 'private/id_ed25519', 'supabase/.temp/token', 'Screenshot_failure.png', 'testsprite_tests/tmp/config.json']) {
    assert.equal(privatePathRules(file).length > 0, true, `Not blocked: ${file}`);
  }
  for (const file of ['.env.example', 'nested/.env.example', 'README.md', 'public/logo.svg', '.github/workflows/security.yml']) assert.deepEqual(privatePathRules(file), []);
});

test('credential-bearing filenames are blocked and redacted in reports', (t) => {
  const { root } = fixture(t);
  const name = fake('gh' + 'p_') + '.txt';
  fs.writeFileSync(path.join(root, name), 'Public-looking content.');
  const result = verifyCurrentTree(root);
  const finding = result.failures.find((entry) => entry.scope === 'working_tree_path');
  assert.equal(finding?.rule, 'github_token');
  assert.equal(formatFinding(finding).includes(name), false);
});

test('index secrets remain blocked after a safe replacement or deletion in the working tree', (t) => {
  const { root } = fixture(t);
  const file = path.join(root, 'configuration.txt');
  fs.writeFileSync(file, fake('sb' + 'p_'));
  runGit(root, ['add', 'configuration.txt']);
  fs.writeFileSync(file, 'Safe replacement.');
  const replaced = verifyCurrentTree(root);
  assert.equal(replaced.failures.some((finding) => finding.scope === 'index' && finding.rule === 'supabase_personal_access_token'), true);
  assert.equal(replaced.failures.some((finding) => finding.scope === 'working_tree' && finding.rule === 'supabase_personal_access_token'), false);
  fs.unlinkSync(file);
  assert.equal(verifyCurrentTree(root).failures.some((finding) => finding.scope === 'index' && finding.rule === 'supabase_personal_access_token'), true);
});

test('untracked secrets block validation, ignored private runtime files do not become release inputs', (t) => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, '.env.local'), fake('gs' + 'k_'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), 'Private local instructions.');
  assert.deepEqual(verifyCurrentTree(root).failures, []);
  fs.writeFileSync(path.join(root, 'accidental.txt'), fake('github_' + 'pat_'));
  assert.equal(verifyCurrentTree(root).failures.some((finding) => finding.scope === 'working_tree' && finding.rule === 'github_token'), true);
});

test('history scans deleted blobs, every old path, branch refs and commit metadata', (t) => {
  const { root } = fixture(t);
  fs.mkdirSync(path.join(root, '.vscode'));
  fs.writeFileSync(path.join(root, '.vscode/mcp.json'), fake('sb' + 'p_'));
  runGit(root, ['add', '.vscode/mcp.json']);
  runGit(root, ['commit', '--quiet', '-m', 'Old private fixture']);
  runGit(root, ['branch', 'old-private']);
  runGit(root, ['rm', '--quiet', '-r', '.vscode']);
  runGit(root, ['commit', '--quiet', '-m', 'Remove private fixture']);
  runGit(root, ['commit', '--allow-empty', '--quiet', '-m', fake('gh' + 'p_')]);
  runGit(root, ['tag', '-a', 'private-metadata-fixture', '-m', `${fake('vc' + 'p_')}\npostgresql://user:${fake('unprefixed')}@host/db`]);
  const result = verifyHistory(root);
  assert.equal(result.failures.some((finding) => finding.scope === 'history_blob' && finding.rule === 'supabase_personal_access_token'), true);
  assert.equal(result.failures.some((finding) => finding.scope === 'history_path' && finding.rule === 'local_editor_config'), true);
  assert.equal(result.failures.some((finding) => finding.scope === 'history_commit' && finding.rule === 'github_token'), true);
  assert.equal(result.failures.some((finding) => finding.scope === 'history_tag' && finding.rule === 'vercel_access_token'), true);
  assert.equal(result.failures.some((finding) => finding.scope === 'history_tag' && finding.rule === 'credential_url'), true);
  assert.equal(result.failures.filter((finding) => finding.scope === 'history_blob' && finding.rule === 'supabase_personal_access_token').length, 1);
  assert.equal(verifyCurrentTree(root).failures.length, 0);
});

test('binary content is scanned instead of bypassing text secrets', () => {
  const bytes = Buffer.concat([Buffer.from([0, 255, 0]), Buffer.from(fake('wh' + 'sec_'))]);
  assert.equal(scanSecrets(bytes).some((finding) => finding.rule === 'stripe_webhook_secret'), true);
});

test('release exports the reviewed index and excludes every untracked/ignored input', (t) => {
  const { root, parent } = fixture(t);
  fs.writeFileSync(path.join(root, 'reviewed.txt'), 'Reviewed tracked content.');
  runGit(root, ['add', 'reviewed.txt']);
  fs.writeFileSync(path.join(root, 'reviewed.txt'), 'Unstaged replacement.');
  fs.writeFileSync(path.join(root, 'untracked.txt'), 'Unreviewed content.');
  fs.writeFileSync(path.join(root, '.env.local'), fake('gs' + 'k_'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), 'Private local instructions.');
  const output = path.join(parent, 'release');
  const result = spawnSync(process.execPath, [path.join(scriptRoot, 'create-public-release.mjs'), output], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, 'Release fixture failed; output suppressed.');
  assert.equal(fs.readFileSync(path.join(output, 'reviewed.txt'), 'utf8'), 'Reviewed tracked content.');
  for (const file of ['untracked.txt', '.env.local', 'AGENTS.md', '.git']) assert.equal(fs.existsSync(path.join(output, file)), false);
  const again = spawnSync(process.execPath, [path.join(scriptRoot, 'create-public-release.mjs'), output], { cwd: root, encoding: 'utf8' });
  assert.equal(again.status, 1);
  assert.equal(fs.readFileSync(path.join(output, 'reviewed.txt'), 'utf8'), 'Reviewed tracked content.');
});

test('release rejects symlinks and credentials without disclosing their values', (t) => {
  const { root, parent } = fixture(t);
  const secret = fake('sb' + 'p_');
  fs.writeFileSync(path.join(root, 'accidental.txt'), secret);
  runGit(root, ['add', 'accidental.txt']);
  fs.unlinkSync(path.join(root, 'accidental.txt'));
  const result = spawnSync(process.execPath, [path.join(scriptRoot, 'create-public-release.mjs'), path.join(parent, 'release')], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
  assert.equal(fs.existsSync(path.join(parent, 'release')), false);
  runGit(root, ['reset', '--quiet', 'HEAD', '--', 'accidental.txt']);
  fs.symlinkSync(path.join(root, '.env.example'), path.join(root, 'link.txt'));
  runGit(root, ['add', 'link.txt']);
  assert.equal(verifyCurrentTree(root).failures.some((finding) => finding.rule === 'non_regular_release_file'), true);
});

test('release refuses destinations inside the repository, including through a parent symlink', (t) => {
  const { root, parent } = fixture(t);
  fs.symlinkSync(root, path.join(parent, 'alias'));
  for (const output of [path.join(root, 'release'), path.join(parent, 'alias/release')]) {
    const result = spawnSync(process.execPath, [path.join(scriptRoot, 'create-public-release.mjs'), output], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(path.join(root, 'release')), false);
  }
});

function copyHookRuntime(root) {
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, '.githooks'), { recursive: true });
  for (const file of ['public-security.mjs', 'verify-open-source.mjs', 'verify-history-clean.mjs', 'install-security-hooks.mjs']) fs.copyFileSync(path.join(scriptRoot, file), path.join(root, 'scripts', file));
  for (const file of ['pre-commit', 'pre-push']) {
    fs.copyFileSync(path.join(hookRoot, file), path.join(root, '.githooks', file));
    fs.chmodSync(path.join(root, '.githooks', file), 0o755);
  }
}

function hookFixture(t) {
  const result = fixture(t);
  copyHookRuntime(result.root);
  runGit(result.root, ['add', 'scripts', '.githooks']);
  runGit(result.root, ['commit', '--quiet', '-m', 'Install reviewed guards']);
  runGit(result.root, ['branch', '-M', 'main']);
  return result;
}

function installHooks(root) {
  return spawnSync(process.execPath, ['scripts/install-security-hooks.mjs'], { cwd: root, encoding: 'utf8', env: offlineEnv });
}

function remoteSnapshot(root) {
  return {
    refs: runGit(root, ['for-each-ref', '--format=%(refname) %(objectname)']),
    objects: runGit(root, ['cat-file', '--batch-all-objects', '--batch-check=%(objectname)']).trim().split('\n').filter(Boolean).sort(),
  };
}

test('tracked hook installation is idempotent and pre-commit blocks staged secrets', (t) => {
  const { root } = hookFixture(t);
  assert.equal(installHooks(root).status, 0);
  assert.equal(installHooks(root).status, 0);
  assert.equal(runGit(root, ['config', '--local', '--get', 'core.hooksPath']).trim(), '.githooks');
  const before = runGit(root, ['rev-parse', 'HEAD']);
  const secret = fake('gs' + 'k_');
  fs.writeFileSync(path.join(root, 'accidental.txt'), secret);
  runGit(root, ['add', 'accidental.txt']);
  const result = spawnSync('git', ['commit', '--quiet', '-m', 'Must be blocked'], { cwd: root, encoding: 'utf8', env: offlineEnv });
  assert.notEqual(result.status, 0);
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
  assert.equal(runGit(root, ['rev-parse', 'HEAD']), before);
});

test('real pre-push permits safe history and blocks historical secrets before any remote object or ref changes', (t) => {
  const { root, parent } = hookFixture(t);
  assert.equal(installHooks(root).status, 0);
  const remote = path.join(parent, 'remote.git');
  fs.mkdirSync(remote);
  runGit(remote, ['init', '--bare', '--quiet']);
  runGit(root, ['remote', 'add', 'origin', remote]);
  const allowed = spawnSync('git', ['push', '--quiet', 'origin', 'main'], { cwd: root, encoding: 'utf8', env: offlineEnv });
  assert.equal(allowed.status, 0, 'Safe push was blocked; output suppressed.');
  const before = remoteSnapshot(remote);
  assert.equal(before.refs.includes('refs/heads/main'), true);
  assert.equal(before.objects.length > 0, true);
  const secret = fake('sb' + 'p_');
  fs.writeFileSync(path.join(root, 'old-configuration.txt'), secret);
  runGit(root, ['add', 'old-configuration.txt']);
  // Simulate receiving a commit that was made without this repository's hooks.
  runGit(root, ['-c', 'core.hooksPath=' + os.devNull, 'commit', '--quiet', '-m', 'Historical private fixture']);
  runGit(root, ['rm', '--quiet', 'old-configuration.txt']);
  runGit(root, ['commit', '--quiet', '-m', 'Clean current tree']);
  assert.deepEqual(verifyCurrentTree(root).failures, []);
  const blocked = spawnSync('git', ['push', '--quiet', 'origin', 'main'], { cwd: root, encoding: 'utf8', env: offlineEnv });
  assert.notEqual(blocked.status, 0);
  assert.equal(`${blocked.stdout}${blocked.stderr}`.includes(secret), false);
  assert.deepEqual(remoteSnapshot(remote), before);
});

test('pre-push also scans an unreferenced commit explicitly proposed by object ID', (t) => {
  const { root, parent } = hookFixture(t);
  assert.equal(installHooks(root).status, 0);
  const remote = path.join(parent, 'remote.git');
  fs.mkdirSync(remote);
  runGit(remote, ['init', '--bare', '--quiet']);
  runGit(root, ['remote', 'add', 'origin', remote]);
  const before = remoteSnapshot(remote);
  const secret = fake('github_' + 'pat_');
  fs.writeFileSync(path.join(root, 'detached-private.txt'), secret);
  runGit(root, ['add', 'detached-private.txt']);
  const tree = runGit(root, ['write-tree']).trim();
  const parentCommit = runGit(root, ['rev-parse', 'HEAD']).trim();
  const proposed = runGit(root, ['commit-tree', tree, '-p', parentCommit, '-m', 'Detached private fixture']).trim();
  runGit(root, ['reset', '--quiet', 'HEAD', '--', 'detached-private.txt']);
  fs.unlinkSync(path.join(root, 'detached-private.txt'));
  assert.deepEqual(verifyHistory(root).failures, []);
  const blocked = spawnSync('git', ['push', '--quiet', 'origin', `${proposed}:refs/heads/detached`], { cwd: root, encoding: 'utf8', env: offlineEnv });
  assert.notEqual(blocked.status, 0);
  assert.equal(`${blocked.stdout}${blocked.stderr}`.includes(secret), false);
  assert.deepEqual(remoteSnapshot(remote), before);
});

test('installer preserves an existing custom hooks path and every existing default hook', (t) => {
  const first = hookFixture(t);
  runGit(first.root, ['config', '--local', 'core.hooksPath', 'existing-hooks']);
  assert.equal(installHooks(first.root).status, 1);
  assert.equal(runGit(first.root, ['config', '--get', 'core.hooksPath']).trim(), 'existing-hooks');
  const second = hookFixture(t);
  const custom = path.join(second.root, '.git/hooks/post-checkout');
  fs.writeFileSync(custom, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(custom, 0o755);
  assert.equal(installHooks(second.root).status, 1);
  const configuration = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: second.root, encoding: 'utf8', env: offlineEnv });
  assert.equal(configuration.status, 1);
  assert.equal(fs.readFileSync(custom, 'utf8'), '#!/bin/sh\nexit 0\n');
});

test('installer safely skips exported deployments outside Git', (t) => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'aprovia-no-git-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  copyHookRuntime(parent);
  const result = installHooks(parent);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.includes('skipped'), true);
  assert.equal(fs.existsSync(path.join(parent, '.git')), false);
});
