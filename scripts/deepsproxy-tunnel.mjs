#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const BIN_DIR = path.join(ROOT, '.bin');
const CLOUDFLARED_PATH = path.join(BIN_DIR, 'cloudflared');
const ENV_LOCAL = path.join(ROOT, '.env.local');
const DEEPSPROXY_ENV = '/home/ubuntu/PROJETOS/antenor/deepsproxy/.env';
const CONFIG_URL_KEY = process.env.DEEPSPROXY_CONFIG_URL_KEY || 'deepsproxy_public_url';
const CONFIG_MODEL_KEY = process.env.DEEPSPROXY_CONFIG_MODEL_KEY || 'deepsproxy_model';
const LOCAL_DEEPSPROXY_URL = process.env.LOCAL_DEEPSPROXY_URL || 'http://127.0.0.1:3001';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        const value = line.slice(index + 1).trim();
        const unquoted =
          (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
            ? value.slice(1, -1)
            : value;
        return [line.slice(0, index), unquoted];
      })
  );
}

function localCloudflaredUrl() {
  const arch = os.arch();
  if (arch === 'arm64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64';
  if (arch === 'x64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
  throw new Error(`Arquitetura nao suportada para download automatico do cloudflared: ${arch}`);
}

async function ensureCloudflared() {
  if (fs.existsSync(CLOUDFLARED_PATH)) return CLOUDFLARED_PATH;

  fs.mkdirSync(BIN_DIR, { recursive: true });
  const url = localCloudflaredUrl();
  console.log(`Baixando cloudflared: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar cloudflared: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  fs.writeFileSync(CLOUDFLARED_PATH, bytes, { mode: 0o755 });
  return CLOUDFLARED_PATH;
}

async function assertDeepsProxyOnline() {
  const env = loadEnvFile(DEEPSPROXY_ENV);
  const apiKey = env.API_KEY;
  const response = await fetch(`${LOCAL_DEEPSPROXY_URL}/health`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  if (!response.ok) {
    throw new Error(`DeepsProxy local nao respondeu OK em ${LOCAL_DEEPSPROXY_URL}`);
  }
}

async function upsertRuntimeConfig(key, value) {
  const env = { ...loadEnvFile(ENV_LOCAL), ...process.env };
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Rode: vercel env pull .env.local');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/configuracoes?on_conflict=chave`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ chave: key, valor: value }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao atualizar configuracoes.${key}: ${response.status} ${await response.text().catch(() => '')}`);
  }
}

function deepsProxyModel() {
  const env = loadEnvFile(DEEPSPROXY_ENV);
  return process.env.DEEPSPROXY_MODEL || env.DEFAULT_MODEL || 'deepseek-thinking';
}

async function main() {
  await assertDeepsProxyOnline();
  const cloudflared = await ensureCloudflared();

  console.log(`Abrindo Cloudflare Quick Tunnel para ${LOCAL_DEEPSPROXY_URL}`);
  const child = spawn(cloudflared, ['tunnel', '--url', LOCAL_DEEPSPROXY_URL], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let published = false;
  const handleOutput = async (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);

    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (!match || published) return;

    published = true;
    const publicUrl = match[0];
    const model = deepsProxyModel();
    await upsertRuntimeConfig(CONFIG_URL_KEY, publicUrl);
    await upsertRuntimeConfig(CONFIG_MODEL_KEY, model);

    console.log('\nTunnel publicado para a Vercel via Supabase:');
    console.log(`${CONFIG_URL_KEY}=${publicUrl}`);
    console.log(`${CONFIG_MODEL_KEY}=${model}`);
    console.log('\nMantenha este processo aberto enquanto o site da Vercel precisar usar sua maquina.');
  };

  child.stdout.on('data', (chunk) => void handleOutput(chunk).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  }));
  child.stderr.on('data', (chunk) => void handleOutput(chunk).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  }));

  child.on('exit', (code) => {
    console.log(`cloudflared encerrado com codigo ${code ?? 'desconhecido'}`);
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
