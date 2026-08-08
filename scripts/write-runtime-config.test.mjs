import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), 'write-runtime-config.mjs');

async function runGenerator(env) {
  const cwd = await mkdtemp(resolve(tmpdir(), 'senatla-runtime-config-'));

  try {
    const result = await new Promise((resolveResult) => {
      const child = spawn(process.execPath, [scriptPath], {
        cwd,
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          ...env,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('close', (code) => resolveResult({ code, stdout, stderr, cwd }));
    });

    return result;
  } catch (error) {
    await rm(cwd, { recursive: true, force: true });
    throw error;
  }
}

test('uses common Vercel Supabase aliases when Senatla names are absent', async () => {
  const result = await runGenerator({
    SENATLA_API_MODE: 'supabase',
    NEXT_PUBLIC_SUPABASE_URL: ' https://example.supabase.co ',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ' anon-key ',
  });

  try {
    assert.equal(result.code, 0, result.stderr);
    const contents = await readFile(resolve(result.cwd, 'src/assets/runtime-config.json'), 'utf8');
    const parsed = JSON.parse(contents);
    assert.equal(parsed.api.mode, 'supabase');
    assert.equal(parsed.api.supabaseUrl, 'https://example.supabase.co');
    assert.equal(parsed.api.supabaseAnonKey, 'anon-key');
  } finally {
    await rm(result.cwd, { recursive: true, force: true });
  }
});

test('fails fast when Supabase mode lacks browser-safe connection values', async () => {
  const result = await runGenerator({ SENATLA_API_MODE: 'supabase' });

  try {
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /SENATLA_API_MODE=supabase requires SENATLA_SUPABASE_URL/);
  } finally {
    await rm(result.cwd, { recursive: true, force: true });
  }
});