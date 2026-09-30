import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const REQUIRED_RELEASE_FILES = ['.env.example', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'LICENSE'];

const SECRET_RULES = [
  ['private_key', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/g],
  ['stripe_secret_key', /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ['stripe_webhook_secret', /\bwhsec_[A-Za-z0-9]{16,}\b/g],
  ['supabase_secret_key', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g],
  ['supabase_personal_access_token', /\bsbp_[A-Za-z0-9_-]{20,}\b/g],
  ['google_api_key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['groq_api_key', /\bgsk_[A-Za-z0-9]{20,}\b/g],
  ['openai_api_key', /\bsk-(?:(?:proj|svcacct|admin)-)?[A-Za-z0-9_-]{32,}\b/g],
  ['github_token', /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ['vercel_token', /\bvercel_[A-Za-z0-9_-]{20,}\b/g],
  ['vercel_access_token', /\bvcp_[A-Za-z0-9_-]{20,}\b/g],
  ['npm_access_token', /\bnpm_[A-Za-z0-9]{20,}\b/g],
  ['aws_access_key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['slack_token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['credential_url', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|https?):\/\/[^\s/:@]+:([^\s/@]+)@/g],
];

export const PRIVATE_PATH_RULES = [
  ['local_env_file', /(?:^|\/)\.env(?:$|\.(?!example$)[^/]+$)/i],
  ['local_editor_config', /(?:^|\/)(?:\.vscode|\.idea|\.cursor)\//i],
  ['local_mcp_config', /(?:^|\/)(?:\.mcp\.json|mcp\.json|mcp_config\.json)$/i],
  ['local_agent_instructions', /(?:^|\/)AGENTS(?:\.local|\.override)?\.md$/i],
  ['local_agent_state', /(?:^|\/)(?:\.agents|\.codex|\.claude|\.local|\.vercel|\.bin|\.testsprite)\//i],
  ['local_cloud_credentials', /(?:^|\/)(?:\.ssh|\.aws|\.azure|\.docker)\/|(?:^|\/)\.config\/gcloud\/|(?:^|\/)(?:\.netrc|\.pypirc)$/i],
  ['local_skill_lock', /(?:^|\/)skills-lock\.json$/i],
  ['local_supabase_state', /(?:^|\/)supabase\/(?:\.temp|\.branches)\//i],
  ['generated_private_artifact', /(?:^|\/)(?:node_modules|\.next|coverage|\.git)\//i],
  ['private_key_file', /\.(?:pem|key|p12|pfx|jks|keystore)$/i],
  ['private_ssh_key', /(?:^|\/)id_(?:rsa|dsa|ecdsa|ed25519)(?!\.pub$)(?:\.[^/]+)?$/i],
  ['local_log', /(?:^|\/)(?:[^/]+\.log|\.DS_Store)$/i],
  ['diagnostic_screenshot', /(?:^|\/)(?:erro|Screenshot_.*)\.(?:png|jpe?g|webp)$/i],
  ['private_audit_report', /(?:^|\/)(?:IMPLEMENTACAO_PLANO_MAX|OPEN_SOURCE_RELEASE|FINAL_AUDIT_VERIFICATION_.*|RELATORIO_COMPLETO_SISTEMA_.*|.*_AUDIT_.*)\.md$/i],
  ['local_testsprite_artifact', /(?:^|\/)testsprite_tests\//i],
];

function isPlaceholder(value) {
  return !value || /^(?:<[^>]+>|\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*|\*+|x{3,}|\.{3}|(?:your|replace|placeholder|example)[-_ ].*|(?:sua|seu)[-_].*|chave[-_]service[-_]role|(?:test|dummy|fake|sample)[-_ ](?:key|token|secret|password)|changeme|change_me|REDACTED|TODO)$/i.test(value);
}

function sensitiveName(name) {
  const normalized = name.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  if (/(?:anon|publishable|public)key$/.test(normalized)) return false;
  return name.toLowerCase() === '_auth' || /(?:apikey|apitoken|accesstoken|authtoken|authorization|clientsecret|servicerolekey|secretkey|secretaccesskey|webhooksecret|password|passwd|privatekey|secret|token)$/.test(normalized);
}

function literalAssignments(line) {
  const results = [];
  const assignments = /["']?([A-Za-z_][A-Za-z0-9_.-]*)["']?\s*(?::|=(?!=))\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|`([^`\r\n]*)`|([^\s,;}#]+))/g;
  for (const match of line.matchAll(assignments)) {
    if (!sensitiveName(match[1])) continue;
    const quoted = match[2] ?? match[3] ?? match[4];
    const value = (quoted ?? (match[5] ?? '').replace(/['"`]+$/, '')).trim();
    if (isPlaceholder(value)) continue;
    if (/^(?:\/|https?:\/\/)/.test(value) || /^[A-Z]+(?:_[A-Z]+)+$/.test(value)) continue;
    if (/\s/.test(value) && !/^Bearer\s+\S+$/i.test(value)) continue;
    const dotenvLiteral = /^[A-Z][A-Z0-9_]*$/.test(match[1]) && match[0].includes('=') && !/\b(?:const|let|var)\b/.test(line.slice(0, match.index));
    const hexLiteral = /^[a-f0-9]{32,}$/i.test(value);
    if (quoted === undefined && !dotenvLiteral && !hexLiteral && /^(?:process\.|import\.|[A-Za-z_$][\w$]*(?:[?.)<>\[\]]|\(|$)|null$|undefined$|true$|false$)/.test(value)) continue;
    if (value.includes('${') || /^(?:process\.env\.|env\.)/.test(value)) continue;
    if (value.length >= 8) results.push('sensitive_literal_assignment');
  }
  return results;
}

/** Returns locations and rule names only; never returns matched credential values. */
export function scanSecrets(content) {
  const text = Buffer.isBuffer(content) ? content.toString('utf8') : String(content);
  const findings = new Map();
  const add = (rule, line) => findings.set(`${rule}:${line}`, { rule, line });
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const [name, pattern] of SECRET_RULES) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        if (name === 'credential_url' && isPlaceholder(match[1])) continue;
        add(name, index + 1);
      }
    }
    for (const name of literalAssignments(line)) add(name, index + 1);
    for (const match of line.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)) {
      try {
        const parts = match[0].split('.');
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (typeof header?.alg !== 'string' || !payload || typeof payload !== 'object' || Array.isArray(payload)) continue;
        if (['service_role', 'supabase_admin'].includes(payload.role)) add('privileged_supabase_jwt', index + 1);
        else if (!(payload.role === 'anon' && payload.iss === 'supabase')) add('private_bearer_jwt', index + 1);
      } catch { /* A malformed JWT is not a verified privileged token. */ }
    }
  }
  return [...findings.values()];
}

export function privatePathRules(file) {
  return PRIVATE_PATH_RULES.filter(([, pattern]) => pattern.test(file)).map(([name]) => name);
}

export function safeLocation(file) {
  return scanSecrets(file).length ? '"<redacted path>"' : JSON.stringify(file);
}

export function formatFinding(finding) {
  const location = safeLocation(finding.file);
  return `${finding.scope}: ${location}${finding.line ? `:${finding.line}` : ''}: ${finding.rule}`;
}

export function git(root, args, options = {}) {
  return execFileSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], ...options });
}

export function indexEntries(root) {
  return git(root, ['ls-files', '--stage', '-z']).toString('utf8').split('\0').filter(Boolean).map((entry) => {
    const tab = entry.indexOf('\t');
    const [mode, oid, stage] = entry.slice(0, tab).split(' ');
    return { mode, oid, stage: Number(stage), file: entry.slice(tab + 1) };
  });
}

export function inspectFile(file, buffer, scope) {
  return [
    ...privatePathRules(file).map((rule) => ({ file, rule, scope })),
    ...scanSecrets(file).map((finding) => ({ ...finding, file, scope: `${scope}_path` })),
    ...scanSecrets(buffer).map((finding) => ({ ...finding, file, scope })),
  ];
}

export function verifyCurrentTree(root) {
  const failures = [];
  const entries = indexEntries(root);
  const cached = new Map();
  for (const entry of entries) {
    if (entry.stage !== 0) failures.push({ file: entry.file, rule: 'unresolved_index_conflict', scope: 'index' });
    if (entry.mode !== '100644' && entry.mode !== '100755') {
      failures.push({ file: entry.file, rule: 'non_regular_release_file', scope: 'index' });
      continue;
    }
    if (!cached.has(entry.oid)) cached.set(entry.oid, git(root, ['cat-file', 'blob', entry.oid]));
    failures.push(...inspectFile(entry.file, cached.get(entry.oid), 'index'));
  }
  const files = new Set(git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).toString('utf8').split('\0').filter(Boolean));
  for (const file of files) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile()) {
      failures.push({ file, rule: 'non_regular_release_file', scope: 'working_tree' });
      continue;
    }
    failures.push(...inspectFile(file, fs.readFileSync(absolute), 'working_tree'));
  }
  for (const file of REQUIRED_RELEASE_FILES) {
    if (!entries.some((entry) => entry.file === file && entry.stage === 0)) failures.push({ file, rule: 'missing_required_tracked_file', scope: 'index' });
    if (!fs.existsSync(path.join(root, file))) failures.push({ file, rule: 'missing_required_release_file', scope: 'working_tree' });
  }
  return { failures, entries };
}

export function parsePushUpdates(input) {
  const revisions = new Set();
  const failures = [];
  for (const line of input.split('\n').filter(Boolean)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4 || !fields[1].match(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/) || !fields[3].match(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/)) throw new Error('invalid_push_input');
    const [localRef, localOid, remoteRef] = fields;
    if (!/^0+$/.test(localOid)) revisions.add(localOid);
    for (const file of [localRef, remoteRef]) failures.push(...scanSecrets(file).map((finding) => ({ ...finding, file, scope: 'push_ref' })));
  }
  return { revisions: [...revisions], failures };
}

export function verifyHistory(root, { additionalRevisions = [] } = {}) {
  if (additionalRevisions.some((revision) => !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision))) throw new Error('invalid_revision');
  const selected = [...new Set(additionalRevisions)];
  const failures = [];
  const revisions = git(root, ['rev-list', '--all', ...selected]).toString('utf8').trim().split('\n').filter(Boolean);
  const objects = git(root, ['rev-list', '--objects', '--all', '--no-object-names', ...selected]).toString('utf8').split('\n').filter(Boolean);
  const objectIds = [...new Set(objects)];
  const types = objectIds.length ? git(root, ['cat-file', '--batch-check=%(objectname) %(objecttype)'], { input: `${objectIds.join('\n')}\n` }).toString('utf8').trim().split('\n') : [];
  const blobPaths = new Map();
  const pathFindings = new Set();
  for (const revision of revisions) {
    const tree = git(root, ['ls-tree', '-r', '--full-tree', '-z', revision]).toString('utf8').split('\0').filter(Boolean);
    for (const entry of tree) {
      const tab = entry.indexOf('\t');
      const [, type, oid] = entry.slice(0, tab).split(' ');
      const file = entry.slice(tab + 1);
      if (type === 'blob') {
        if (!blobPaths.has(oid)) blobPaths.set(oid, new Set());
        blobPaths.get(oid).add(file);
      }
      for (const rule of [...privatePathRules(file), ...scanSecrets(file).map((finding) => finding.rule)]) {
        const key = `${rule}\0${file}`;
        if (!pathFindings.has(key)) failures.push({ file, rule, scope: 'history_path' });
        pathFindings.add(key);
      }
    }
  }
  for (const record of types) {
    const [oid, type] = record.split(' ');
    if (!['blob', 'commit', 'tag'].includes(type)) continue;
    const findings = scanSecrets(git(root, ['cat-file', type, oid]));
    const paths = type === 'blob' ? (blobPaths.get(oid) ?? new Set([`object/${oid}`])) : new Set([`${type}/${oid}`]);
    for (const file of paths) failures.push(...findings.map((finding) => ({ ...finding, file, scope: `history_${type}` })));
  }
  const refs = git(root, ['for-each-ref', '--format=%(refname)']).toString('utf8').trim().split('\n').filter(Boolean);
  for (const file of refs) failures.push(...scanSecrets(file).map((finding) => ({ ...finding, file, scope: 'history_ref' })));
  return { failures, revisions: revisions.length, objects: objectIds.length };
}

export function printFailures(failures) {
  for (const finding of failures) console.error(`- ${formatFinding(finding)}`);
}
