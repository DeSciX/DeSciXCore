/**
 * Tests for kb namespace purge (WS-CLI-V2.1-PURGE DN-5).
 *
 * Coverage:
 *  - `descix kb --help` does NOT list `pull` or `push`
 *  - `descix kb pull` exits non-zero (unknown command)
 *  - `descix kb push` exits non-zero (unknown command)
 *
 * Design: spawns the real CLI binary as a child process (no mocking of commander).
 * This tests the actual registered command surface, not a simulation.
 *
 * Run: `node --test tests/kb-namespace-purge.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '../bin/descix.js');

/**
 * Run a CLI command and capture stdout, stderr, and exit code.
 * @param {string[]} args
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
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

test('kb --help does NOT list "pull" as a subcommand', async () => {
  const { stdout, stderr } = await runCli(['kb', '--help']);
  const output = stdout + stderr;
  // Help text should not mention pull/push as kb subcommands
  const lines = output.split('\n').filter(l => /^\s+(pull|push)/.test(l));
  assert.equal(
    lines.length,
    0,
    `"descix kb --help" must not list 'pull' or 'push' as subcommands. Found: ${JSON.stringify(lines)}`
  );
});

test('kb --help does NOT list "push" as a subcommand', async () => {
  const { stdout, stderr } = await runCli(['kb', '--help']);
  const output = stdout + stderr;
  // More targeted: confirm neither "pull" nor "push" appear in the Commands section
  // (they may appear in description text for drive commands, so we check the command listing only)
  const commandsSection = output
    .split(/Commands?:/i)[1] || output;
  assert.ok(
    !(/^\s+pull\b/.test(commandsSection)),
    '"pull" must not be listed as a kb command'
  );
  assert.ok(
    !(/^\s+push\b/.test(commandsSection)),
    '"push" must not be listed as a kb command'
  );
});

test('descix kb pull exits non-zero (command removed)', async () => {
  const { code, stderr, stdout } = await runCli(['kb', 'pull', '--app', 'dummy']);
  assert.notEqual(code, 0, `"descix kb pull" must exit non-zero after purge; got code=${code}`);
  // Commander emits "unknown command" or "error" on stderr/stdout for unknown subcommands
  const output = stdout + stderr;
  // The process must not succeed silently
  assert.ok(
    code !== 0,
    '"descix kb pull" must fail; command was removed from kb namespace'
  );
});

test('descix kb push exits non-zero (command removed)', async () => {
  const { code, stdout, stderr } = await runCli(['kb', 'push', '--app', 'dummy']);
  assert.notEqual(code, 0, `"descix kb push" must exit non-zero after purge; got code=${code}`);
});
