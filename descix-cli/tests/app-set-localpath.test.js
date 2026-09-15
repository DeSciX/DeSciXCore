/**
 * Tests for `descix app set-localpath`.
 *
 * THESE TESTS SPAWN bin/descix.js. They do not re-implement it.
 *
 * The previous version of this file defined a local `runSetLocalpath()` that mirrored the action
 * body line for line. A mirror cannot fail when the command it mirrors is wrong, and it cannot
 * pass when the command it mirrors is fixed — it measures the copy. Worse, its happy-path case
 * asserted that an ABSOLUTE path was written to localPath, encoding the very brick this suite now
 * guards against: set-localpath writing a value resolveWorkspacePath will refuse on the next read,
 * leaving a workspace no sanctioned verb could repair.
 *
 * COVERAGE BOUNDARY — what this suite reads, and where the green stops:
 *   READS  : the real CLI's exit status, and the bytes of .descix/workspace.json before/after.
 *   CATCHES: a refusal that nevertheless wrote; a write of a loader-rejected localPath; a
 *            regression that rejects legitimate relative values; a bricked workspace that
 *            set-localpath cannot repair.
 *   ALSO READS: env.platform — covered by the three tests below, which assert the entry actually
 *            MOVED rather than trusting the exit code and the ✓ banner.
 *   DOES NOT READ: any non-absolute class of invalid localPath; anything about npm-published
 *            @descix/cli; the banner's own rendering of the old value.
 *   RUN BY : `npm test` in descix-cli/ (node --test "tests/*.test.js").
 *
 * Run: `node --test tests/app-set-localpath.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'node:url';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'descix.js');

/**
 * Run the REAL cli. Resolves with { code, stdout, stderr } — never rejects on a non-zero exit,
 * because a non-zero exit is the thing most of these tests are measuring.
 */
function runCli(cwd, args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI, ...args], { cwd }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr });
    });
  });
}

/**
 * Create an isolated temp workspace with one product mapped at `localPath`.
 * Pass an absolute value to reproduce a workspace already BRICKED by the old behaviour.
 */
async function makeTestWorkspace(t, localPath = 'my-app') {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-ws-'));
  await fs.mkdir(path.join(wsRoot, 'my-app'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'my-app-v2'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

  const appId = 'testapp';
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(
      { version: '2.1', type: 'workspace', env: { products: [{ appId, localPath, kbId: 'General' }] } },
      null,
      2
    )
  );

  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return { wsRoot, appId };
}

const wsFile = (wsRoot) => path.join(wsRoot, '.descix', 'workspace.json');

async function sha256(file) {
  return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
}

async function localPathOf(wsRoot, appId) {
  const parsed = JSON.parse(await fs.readFile(wsFile(wsRoot), 'utf-8'));
  return parsed.env.products.find((p) => p.appId === appId)?.localPath;
}

// ─────────────────────────────────────────────────────────────────────────────

test('set-localpath — REFUSES an absolute path AND leaves workspace.json byte-identical', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  const before = await sha256(wsFile(wsRoot));

  const { code, stderr } = await runCli(wsRoot, [
    'app', 'set-localpath', '-a', appId, '-p', path.join(wsRoot, 'my-app-v2')
  ]);

  assert.notEqual(code, 0, 'an absolute path must be refused with a non-zero exit');
  assert.match(stderr, /absolute path/, 'the refusal must name what is wrong');
  assert.equal(
    await sha256(wsFile(wsRoot)),
    before,
    'A REFUSAL THAT ALSO WROTE IS THE FAILURE THIS TEST EXISTS TO END: workspace.json must be byte-identical'
  );
});

test('set-localpath — happy path: a workspace-relative path is accepted and written verbatim', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);

  const { code, stderr } = await runCli(wsRoot, ['app', 'set-localpath', '-a', appId, '-p', 'my-app-v2']);

  assert.equal(code, 0, `a legitimate relative path must still be accepted (stderr: ${stderr})`);
  assert.equal(await localPathOf(wsRoot, appId), 'my-app-v2', 'localPath must be stored relative');
});

test('set-localpath — RECOVERS a workspace already bricked by the old behaviour', async (t) => {
  // Seeded with an absolute localPath: exactly what the pre-fix command persisted.
  const { wsRoot, appId } = await makeTestWorkspace(t, path.join(os.tmpdir(), 'somewhere-absolute'));

  const { code, stderr } = await runCli(wsRoot, ['app', 'set-localpath', '-a', appId, '-p', 'my-app']);

  assert.equal(code, 0, `set-localpath must repair a bricked workspace, not refuse it (stderr: ${stderr})`);
  assert.equal(await localPathOf(wsRoot, appId), 'my-app', 'the bad absolute value must be replaced');
});

test('set-localpath — hard-fail: non-existent path, resolved against the WORKSPACE ROOT', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  const before = await sha256(wsFile(wsRoot));

  const { code, stderr } = await runCli(wsRoot, [
    'app', 'set-localpath', '-a', appId, '-p', 'NONEXISTENT_XYZ_' + Date.now()
  ]);

  assert.notEqual(code, 0, 'must exit non-zero for a non-existent path');
  assert.match(stderr, /Path does not exist:/);
  assert.match(stderr, /resolved against workspace root/, 'must say what the path was resolved against');
  assert.equal(await sha256(wsFile(wsRoot)), before, 'nothing may be written on a refusal');
});

test('set-localpath — hard-fail: a file is not a directory', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  await fs.writeFile(path.join(wsRoot, 'a-file.txt'), 'hello');
  const before = await sha256(wsFile(wsRoot));

  const { code, stderr } = await runCli(wsRoot, ['app', 'set-localpath', '-a', appId, '-p', 'a-file.txt']);

  assert.notEqual(code, 0);
  assert.match(stderr, /Path is not a directory:/);
  assert.equal(await sha256(wsFile(wsRoot)), before, 'nothing may be written on a refusal');
});

/**
 * env.platform coverage. `set-localpath` used to walk env.products[] only, so every case below
 * either wrote nothing while printing success, or — once the resolving read was removed —
 * printed success on a workspace it had not repaired. A loud failure became a silent lie at the
 * one entry that matters most: the caller gets a ✓ and goes to debug something else.
 */
async function makePlatformWorkspace(t, localPath = 'cloud') {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-plat-'));
  await fs.mkdir(path.join(wsRoot, 'cloud'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'other'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(
      { version: '2.1', type: 'workspace', env: { platform: { appId: 'daita', localPath, kbId: 'General' }, products: [] } },
      null, 2
    )
  );
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return { wsRoot, appId: 'daita' };
}

const platformLocalPath = async (wsRoot) =>
  JSON.parse(await fs.readFile(wsFile(wsRoot), 'utf-8')).env.platform.localPath;

test('set-localpath — env.platform: a BRICKED platform app is actually repaired, not just reported repaired', async (t) => {
  const { wsRoot, appId } = await makePlatformWorkspace(t, path.join(os.tmpdir(), 'somewhere-absolute'));

  const { code, stderr } = await runCli(wsRoot, ['app', 'set-localpath', '-a', appId, '-p', 'cloud']);

  assert.equal(code, 0, `must repair the platform app (stderr: ${stderr})`);
  assert.equal(
    await platformLocalPath(wsRoot),
    'cloud',
    'SILENT LIE GUARD: exit 0 and a ✓ banner mean nothing if env.platform.localPath did not move'
  );
});

test('set-localpath — env.platform: a healthy platform app is actually written (no silent no-op)', async (t) => {
  const { wsRoot, appId } = await makePlatformWorkspace(t);

  const { code } = await runCli(wsRoot, ['app', 'set-localpath', '-a', appId, '-p', 'other']);

  assert.equal(code, 0);
  assert.equal(await platformLocalPath(wsRoot), 'other', 'the platform entry must actually change');
});

test('set-localpath — env.platform: an absolute path is refused and nothing is written', async (t) => {
  const { wsRoot, appId } = await makePlatformWorkspace(t);
  const before = await sha256(wsFile(wsRoot));

  const { code, stderr } = await runCli(wsRoot, [
    'app', 'set-localpath', '-a', appId, '-p', path.join(wsRoot, 'other')
  ]);

  assert.notEqual(code, 0, 'the platform entry gets the same refusal as a product entry');
  assert.match(stderr, /absolute path/);
  assert.equal(await sha256(wsFile(wsRoot)), before, 'workspace.json must be byte-identical');
});

test('set-localpath — hard-fail: unmapped app uses the canonical one-owner message', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);

  const { code, stderr } = await runCli(wsRoot, [
    'app', 'set-localpath', '-a', 'totally-unknown-app-id', '-p', 'my-app'
  ]);

  assert.notEqual(code, 0);
  assert.match(stderr, /is not mapped in workspace\.json/, 'must be unmappedAppMessage(), not a local copy');
});
