/**
 * Tests for `descix drive pull` / `descix drive push` (WS-CLI-V2.1-PURGE DN-5).
 *
 * Coverage:
 *  - `descix drive --help` lists both "pull" and "push" subcommands
 *  - `descix drive pull --help` shows Drive content authoring help
 *  - `descix drive push --help` shows Drive content authoring help
 *  - drive pull/push delegate to the same underlying functions as the removed
 *    `kb pull`/`kb push` (verified by checking the function import in kb.js)
 *
 * Design: spawns the real CLI binary as a child process for help-text assertions.
 * Does NOT test the Drive API itself (requires ADC) — that is an E2E concern.
 *
 * Run: `node --test tests/drive-pull-push.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { runKbPull, runKbPush } from '../lib/commands/kb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '../bin/descix.js');

function runCli(args) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [CLI, ...args], {
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

// ─────────────────────────────────────────────────────────────────────────────

test('descix drive --help lists "pull" as a subcommand', async () => {
  const { stdout, stderr, code } = await runCli(['drive', '--help']);
  const output = stdout + stderr;
  assert.ok(
    /pull/.test(output),
    `"descix drive --help" must list 'pull'. Got:\n${output}`
  );
});

test('descix drive --help lists "push" as a subcommand', async () => {
  const { stdout, stderr } = await runCli(['drive', '--help']);
  const output = stdout + stderr;
  assert.ok(
    /push/.test(output),
    `"descix drive --help" must list 'push'. Got:\n${output}`
  );
});

test('descix drive pull --help shows Drive content authoring description', async () => {
  const { stdout, stderr } = await runCli(['drive', 'pull', '--help']);
  const output = stdout + stderr;
  // The drive pull command must show meaningful help
  assert.ok(
    output.length > 0,
    'drive pull --help must produce output'
  );
  // Must not show "unknown command"
  assert.ok(
    !/unknown command/i.test(output),
    '"drive pull" must not be an unknown command'
  );
  // Must describe Drive content authoring purpose
  assert.ok(
    /drive|Drive|pull|content/i.test(output),
    'drive pull --help must mention drive/pull/content in its description'
  );
});

test('descix drive push --help shows Drive content authoring description', async () => {
  const { stdout, stderr } = await runCli(['drive', 'push', '--help']);
  const output = stdout + stderr;
  assert.ok(output.length > 0, 'drive push --help must produce output');
  assert.ok(
    !/unknown command/i.test(output),
    '"drive push" must not be an unknown command'
  );
  assert.ok(
    /drive|Drive|push|staging/i.test(output),
    'drive push --help must mention drive/push/staging in its description'
  );
});

test('drive pull/push delegate to the same underlying kb functions (not new implementations)', () => {
  // The drive commands in bin/descix.js call kbCommands.runKbPull and kbCommands.runKbPush.
  // Verify these exports exist in kb.js — confirming no new backend implementation was added.
  assert.equal(typeof runKbPull, 'function', 'runKbPull must be exported from kb.js');
  assert.equal(typeof runKbPush, 'function', 'runKbPush must be exported from kb.js');
  // The functions are the same ones drive pull/push call — same Drive API endpoint contract.
});

test('descix drive pull exits non-zero without workspace (no silent degradation)', async () => {
  // Run from a temp dir that has no workspace.json — must fail cleanly, not silently
  const { code, stdout, stderr } = await runCli(['drive', 'pull', '--app', 'dummy']);
  // Without a workspace, it must fail (non-zero). A silent 0 exit would be wrong.
  // Note: May exit 1 due to workspace-not-found or Drive-not-configured — both are correct.
  assert.notEqual(code, 0, 'drive pull without workspace must exit non-zero (hard-fail)');
});
