/**
 * Unit tests for `descix app init --local-only`.
 *
 * WS-SMILE-4APP Phase 1 / WS-A — verifies:
 *   1. --local-only does NOT construct a DeSciXApiClient (no auth, no network calls).
 *   2. The three canonical app directories are created: site/, kb/General/, microservice/.
 *   3. No Firestore/Pinecone traffic is possible (enforced by never-constructing-the-client).
 *   4. Exit code 0 on a clean scaffold.
 *
 * Approach: spawn the real CLI as a child process against a temp workspace. --local-only
 * never imports DeSciXApiClient, so zero network egress is structurally guaranteed.
 *
 * Run: `node --test tests/app-init-local-only.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'descix.js');

async function mkTempWorkspace() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-app-init-test-'));
  return root;
}

async function runCli(args, cwd) {
  return new Promise((resolve) => {
    // Belt-and-braces: point DESCIX_API_URL at an unreachable address so that if
    // the command ever tried to phone home, it would fail loudly (not silently pass).
    const env = { ...process.env, DESCIX_API_URL: 'http://127.0.0.1:1' };
    const child = spawn(process.execPath, [CLI_PATH, ...args], { cwd, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => { stdout += b.toString(); });
    child.stderr.on('data', (b) => { stderr += b.toString(); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('app init --local-only creates canonical directories without a DeSciXApiClient', async () => {
  const cwd = await mkTempWorkspace();
  try {
    const result = await runCli(
      ['app', 'init', '-a', 'smile-test', '-c', 'smile', '--local-only'],
      cwd
    );

    assert.equal(result.code, 0, `CLI exit != 0. stderr=${result.stderr}\nstdout=${result.stdout}`);
    assert.match(result.stdout, /Platform-mutation gate is CLOSED/, '--local-only banner must print');
    assert.match(result.stdout, /scaffolded \(--local-only\)/, 'completion line must print');

    // Canonical directories exist
    const siteStat = await fs.stat(path.join(cwd, 'site'));
    const kbStat = await fs.stat(path.join(cwd, 'kb', 'General'));
    const msStat = await fs.stat(path.join(cwd, 'microservice'));
    const assetsStat = await fs.stat(path.join(cwd, 'assets'));
    assert.ok(siteStat.isDirectory());
    assert.ok(kbStat.isDirectory());
    assert.ok(msStat.isDirectory());
    assert.ok(assetsStat.isDirectory());

    // No service wallet emitted (flag removed; creator-session pattern via microservice init)
    let walletAccessErr = null;
    try { await fs.access(path.join(cwd, 'microservice', '.descix', 'wallet.json')); }
    catch (e) { walletAccessErr = e; }
    assert.ok(walletAccessErr, 'app init --local-only must NOT emit wallet.json');
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('app init --local-only requires --community OR workspace default', async () => {
  const cwd = await mkTempWorkspace();
  try {
    const result = await runCli(
      ['app', 'init', '-a', 'smile-test', '--local-only'],
      cwd
    );

    assert.notEqual(result.code, 0, 'missing community should fail');
    assert.match(
      result.stderr + result.stdout,
      /requires --community/,
      'error must explain missing community'
    );
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});
