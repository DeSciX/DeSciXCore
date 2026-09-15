/**
 * ABSENT vs UNREADABLE — WorkspaceConfig.load()
 *
 * WHY THIS SUITE EXISTS: load() used to collapse every read failure into
 * 'Workspace not configured. Run "npx descix init"'. A corrupt-but-present workspace.json
 * therefore reported as ABSENT, and the remedy the message prescribed points at overwriting the
 * very file that was still recoverable. A refusal must never prescribe a remedy that destroys
 * the thing it is diagnosing.
 *
 * EVERY CLI-FACING GATE HERE SPAWNS bin/descix.js. It does not re-implement load(), and it does
 * not assert against a copy of the command body — a test that re-implements the action measures
 * the copy and will happily certify the defect.
 *
 * The three gates:
 *   1. CORRUPT is not ABSENT   — discriminator. RED before the fix, GREEN after.
 *   2. ABSENT still works      — REGRESSION GUARD, not a discriminator: it passes on the broken
 *                                tree too, by construction, because that message is correct for
 *                                this one state and the fix deliberately leaves it alone.
 *   3. THE FILE SURVIVES       — the point of the row. Byte-identical by sha256 after the failure.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { WorkspaceConfig, WorkspaceUnreadableError } from '../lib/workspace-config.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, '..', 'bin', 'descix.js');

/** The message that is correct ONLY for a genuinely absent workspace. */
const NOT_CONFIGURED_RE = /Run "npx descix init" first to initialize your workspace/;

/** Spawn the REAL CLI and return its exit status and streams. */
function runCli(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function sha256(file) {
  return createHash('sha256').update(await fs.readFile(file)).digest('hex');
}

async function makeWorkspace(contents) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-ws-'));
  if (contents !== null) {
    await fs.mkdir(path.join(root, '.descix'), { recursive: true });
    await fs.writeFile(path.join(root, '.descix', 'workspace.json'), contents, 'utf-8');
  }
  return root;
}

/** Truncated mid-array — a realistic partial write, not a synthetic blob of garbage. */
const CORRUPT_JSON =
  '{"version":"2.1","env":{"platform":{"appId":"unk-beast","localPath":"apps/unk-beast"},"products":[';

// ---------------------------------------------------------------------------
// GATE 1 — DISCRIMINATOR: a corrupt-but-present workspace is UNREADABLE, not ABSENT.
// ---------------------------------------------------------------------------
test('GATE 1: corrupt workspace.json → UNREADABLE, names path + parse error, never prescribes init', async (t) => {
  const root = await makeWorkspace(CORRUPT_JSON);
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  const configPath = path.join(root, '.descix', 'workspace.json');

  // THE FIXTURE IS PART OF THE GATE: prove these inputs can actually exhibit the failure.
  const size = (await fs.stat(configPath)).size;
  assert.ok(size > 0, 'fixture must be non-empty or it cannot exhibit a parse failure');
  assert.throws(() => JSON.parse(CORRUPT_JSON), 'fixture must be genuinely unparseable');

  const { code, stderr } = await runCli(['app', 'set-localpath', '-a', 'unk-beast', '-p', 'apps/x'], root);

  assert.equal(code, 1, 'must fail loud');
  assert.doesNotMatch(stderr, NOT_CONFIGURED_RE,
    'a file that EXISTS must never be reported as "not configured"');
  assert.match(stderr, /could not be read/, 'must say the file could not be read');
  assert.ok(stderr.includes(configPath), 'must name the offending path');
  assert.match(stderr, /Unexpected end of JSON input/, 'must name the underlying parse error');
  assert.match(stderr, /has NOT been modified/, 'must tell the user their file is intact');
});

// ---------------------------------------------------------------------------
// GATE 2 — REGRESSION GUARD (NOT a discriminator).
// This passes on the pre-fix tree as well. That is expected and correct: 'not configured' is the
// right answer for a genuinely missing workspace, and the fix preserves it deliberately. It is
// recorded as a guard against over-correction, never counted as a shown-RED gate.
// ---------------------------------------------------------------------------
test('GATE 2 (regression guard): absent workspace still gets today\'s message and today\'s advice', async (t) => {
  const root = await makeWorkspace(null);
  const sub = path.join(root, 'sub');
  await fs.mkdir(sub, { recursive: true });
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  // Fixture check: there must genuinely be no workspace.json anywhere at or under root.
  await assert.rejects(() => fs.stat(path.join(root, '.descix', 'workspace.json')));

  const { code, stderr } = await runCli(['app', 'set-localpath', '-a', 'unk-beast', '-p', 'apps/x'], sub);

  assert.equal(code, 1);
  assert.match(stderr, NOT_CONFIGURED_RE, 'absent keeps the init advice — it is correct here');
  assert.doesNotMatch(stderr, /could not be read/, 'absent must not claim an unreadable file');
});

// ---------------------------------------------------------------------------
// GATE 3 — THE ONE THAT MATTERS: the user's recoverable file is still there, byte for byte.
// ---------------------------------------------------------------------------
test('GATE 3: after the UNREADABLE failure the corrupt workspace.json is byte-identical', async (t) => {
  const root = await makeWorkspace(CORRUPT_JSON);
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  const configPath = path.join(root, '.descix', 'workspace.json');
  const before = await sha256(configPath);
  const sizeBefore = (await fs.stat(configPath)).size;
  assert.ok(sizeBefore > 0, 'fixture must be non-empty');

  const { code } = await runCli(['app', 'set-localpath', '-a', 'unk-beast', '-p', 'apps/x'], root);
  assert.equal(code, 1);

  const after = await sha256(configPath);
  assert.equal((await fs.stat(configPath)).size, sizeBefore, 'size must not change');
  assert.equal(after, before, 'THE FILE MUST SURVIVE — the whole point of this row');
});

// ---------------------------------------------------------------------------
// A file we can SEE but cannot OPEN is UNREADABLE, not absent.
// ---------------------------------------------------------------------------
test('permission-denied workspace.json is UNREADABLE, not "not configured"', async (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    t.skip('running as root: chmod 000 would not deny this process');
    return;
  }
  const root = await makeWorkspace('{"version":"2.1","env":{"platform":{"appId":"x"}}}');
  const configPath = path.join(root, '.descix', 'workspace.json');
  await fs.chmod(configPath, 0o000);
  t.after(async () => {
    await fs.chmod(configPath, 0o600).catch(() => {});
    await fs.rm(root, { recursive: true, force: true });
  });

  const { code, stderr } = await runCli(['app', 'set-localpath', '-a', 'x', '-p', 'y'], root);

  assert.equal(code, 1);
  assert.doesNotMatch(stderr, NOT_CONFIGURED_RE);
  assert.match(stderr, /could not be read/);
  assert.match(stderr, /EACCES/, 'must name the permission error');
  assert.doesNotMatch(stderr, /EACCES: EACCES/, 'reason line must not double the error code');
});

// ---------------------------------------------------------------------------
// The ONE OWNER, consumed directly. tryLoad must not re-swallow what load() now distinguishes:
// a corrupt workspace reported as null is how the CLI silently fell back to the default origin.
// ---------------------------------------------------------------------------
test('tryLoad(): null for ABSENT, throws WorkspaceUnreadableError for UNREADABLE', async (t) => {
  const absentRoot = await makeWorkspace(null);
  const corruptRoot = await makeWorkspace(CORRUPT_JSON);
  t.after(async () => {
    await fs.rm(absentRoot, { recursive: true, force: true });
    await fs.rm(corruptRoot, { recursive: true, force: true });
  });

  assert.equal(await WorkspaceConfig.tryLoad(absentRoot), null, 'absent is a soft no');

  await assert.rejects(
    () => WorkspaceConfig.tryLoad(corruptRoot),
    (err) => {
      assert.ok(err instanceof WorkspaceUnreadableError, 'must be the typed error, not a string match');
      assert.equal(err.code, 'WORKSPACE_UNREADABLE');
      assert.ok(err.configPath.endsWith(path.join('.descix', 'workspace.json')));
      return true;
    },
    'a damaged workspace must not be reported as "no workspace here"'
  );
});

// ---------------------------------------------------------------------------
// v1 stays a v1 error — it must not be absorbed into UNREADABLE by the restructure.
// ---------------------------------------------------------------------------
test('v1 workspace still raises the v1 migration error, not UNREADABLE', async (t) => {
  const root = await makeWorkspace(JSON.stringify({ version: '1.0', communities: { egpt: {} } }));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await assert.rejects(
    () => WorkspaceConfig.load(root),
    (err) => {
      assert.ok(!(err instanceof WorkspaceUnreadableError), 'v1 is parseable — not an unreadable file');
      assert.match(err.message, /v1 workspace format is not supported/);
      return true;
    }
  );

  // tryLoad keeps soft-failing on v1 (existing contract, asserted by workspace-config-v1-hard-error).
  assert.equal(await WorkspaceConfig.tryLoad(root), null);
});
