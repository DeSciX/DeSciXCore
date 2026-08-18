/**
 * Tests for the `descix site upload` local-backend guard (WS-DEPLOY-HARDENING item 7).
 *
 * Grounded bug: `site upload` could target a local backend inherited from the workspace
 * rather than named by the invocation. The fix hard-fails when the resolved API URL is
 * local AND was NOT reached via an explicit DESCIX_API_URL/--api-url/--env override.
 *
 * NOTE (env-model ruling, 2026-08-18): the ORIGINAL trigger — a DEV workspace with no
 * apiUrl silently deriving https://localhost:{platform.microservice.port} — is gone by
 * construction: getApiUrl() no longer derives localhost from an environment NAME, and
 * every named env writes a cloud URL. localhost is now only ever an explicitly pinned
 * env.apiUrl, which is the shape these tests pin the guard against.
 *
 * Design: spawns the real CLI binary as a child process against an isolated temp workspace.
 * Does not require a live backend or credentials: the guard fires before `requireAuth()`.
 *
 * Run: `node --test tests/site-upload-local-guard.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '../bin/descix.js');

async function makeDevWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-site-upload-guard-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'platform-app'), { recursive: true });

  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      environment: 'DEV',
      // Explicitly pinned local backend — the only way a workspace resolves to
      // localhost now that environment names never derive a local URL.
      apiUrl: 'https://localhost:4000',
      platform: {
        appId: 'daita',
        localPath: 'platform-app',
        microservice: { port: 4000, devCommand: 'npm run dev:service' }
      },
      products: []
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return wsRoot;
}

function runCli(args, { cwd, env }) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [CLI, ...args], {
      cwd,
      env: { ...env, FORCE_COLOR: '0', NO_COLOR: '1' }
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

// ─────────────────────────────────────────────────────────────────────────────

test('site upload hard-fails on a workspace-pinned local backend (no --env, no DESCIX_API_URL)', async (t) => {
  const wsRoot = await makeDevWorkspace(t);

  // Strip DESCIX_API_URL from the child env: the invocation names no target.
  const { DESCIX_API_URL, ...envWithoutApiUrl } = process.env;

  const { stdout, stderr, code } = await runCli(['site', 'upload', '-a', 'daita'], {
    cwd: wsRoot,
    env: envWithoutApiUrl
  });
  const output = stdout + stderr;

  assert.notEqual(code, 0, `expected non-zero exit code. Got 0. Output:\n${output}`);
  assert.ok(
    /Refusing site upload against a local backend/.test(output),
    `expected the local-backend hard-fail message. Got:\n${output}`
  );
  assert.ok(
    /localhost:4000/.test(output),
    `expected the resolved localhost:4000 URL to be echoed back. Got:\n${output}`
  );
  assert.ok(
    /--env=<dev\|demo\|prod>/.test(output) && /DESCIX_API_URL/.test(output),
    `expected the remediation hint (--env or DESCIX_API_URL). Got:\n${output}`
  );
});

test('site upload guard is bypassed when DESCIX_API_URL explicitly points at a remote env', async (t) => {
  const wsRoot = await makeDevWorkspace(t);

  const { stdout, stderr } = await runCli(['site', 'upload', '-a', 'daita'], {
    cwd: wsRoot,
    env: { ...process.env, DESCIX_API_URL: 'https://dev.descix.net' }
  });
  const output = stdout + stderr;

  // The localhost guard must NOT fire. The command may still fail downstream (e.g. no
  // credentials in this isolated temp workspace) — that is fine and expected; we're only
  // proving the silent-fallback guard did not trigger for an explicit remote override.
  assert.ok(
    !/Refusing site upload against a local backend/.test(output),
    `guard should be bypassed for an explicit remote DESCIX_API_URL. Got:\n${output}`
  );
});

test('an unconfigured workspace resolves to the shipped PROD default, so the guard never fires', async (t) => {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-site-upload-default-'));
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify({ version: '2.1', workspaceRoot: wsRoot, type: 'workspace',
                     env: { environment: 'DEV', platform: { appId: 'daita', localPath: 'platform-app',
                            microservice: { port: 4000 } }, products: [] } }, null, 2)
  );

  // Isolate HOME too: ~/.descix/config.json is user-level machine state that can pin a
  // local api_url, and this test is about what the CODE derives, not what this box holds.
  const fakeHome = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-home-'));
  t.after(async () => { await fs.rm(fakeHome, { recursive: true, force: true }); });
  const { DESCIX_API_URL, ...envWithoutApiUrl } = process.env;
  const { stdout, stderr } = await runCli(['site', 'upload', '-a', 'daita'],
    { cwd: wsRoot, env: { ...envWithoutApiUrl, HOME: fakeHome } });
  const output = stdout + stderr;

  // An environment NAME must never derive a localhost URL: DEV + microservice.port 4000
  // used to resolve https://localhost:4000; it now resolves to the shipped PROD default.
  assert.ok(
    !/Refusing site upload against a local backend/.test(output),
    `no localhost should be derived from an env name. Got:\n${output}`
  );
});
