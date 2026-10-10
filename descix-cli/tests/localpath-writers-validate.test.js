/**
 * NO WORKSPACE.JSON WRITER PERSISTS A localPath, AND THE ONE RESOLVER REFUSES AN ABSOLUTE ONE.
 *
 * HISTORY OF THE GATE. Three writers persisted a localPath and exactly ONE validated it:
 * `descix app init -p /absolute` wrote an absolute localPath, CREATED DIRECTORIES AT AN
 * ARBITRARY ABSOLUTE LOCATION taken from user input, printed a green success line and exited 0 —
 * and bricked the workspace only on the NEXT read. Under workspace v3 (single-app) the repo root
 * IS the app root: localPath is no longer an input to any writer, `setLocalPath` and the `-p`
 * option are deleted, and the failure class is closed by construction rather than by validation.
 *
 * WHAT SURVIVES, AND IS GATED HERE:
 *  - registerApp ignores a localPath it is handed: nothing path-like reaches workspace.json, so
 *    the next read cannot be bricked by it (the arm that would have caught the original defect)
 *  - resolveWorkspacePath (the one owner of workspace-relative -> absolute) still refuses an
 *    absolute value, naming the entry, and still accepts a relative one — the positive control
 *    without which a refuse-everything resolver would read as a repair
 *  - the deleted writers (setLocalPath, the product surface) stay deleted
 *
 * Run: `node --test tests/localpath-writers-validate.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig, resolveWorkspacePath } from '../lib/workspace-config.js';

const CONFIG_REL = path.join('.descix', 'workspace.json');

/** Isolated temp v3 workspace holding one app; removed by t.after so a run leaves no residue. */
async function makeWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-localpath-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.writeFile(
    path.join(wsRoot, CONFIG_REL),
    JSON.stringify(
      { version: '3.0', type: 'workspace', env: { app: { appId: 'mapped', communityId: 'somecommunity', kbId: 'General' } } },
      null, 2
    )
  );
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return wsRoot;
}

const readConfig = async (wsRoot) => JSON.parse(await fs.readFile(path.join(wsRoot, CONFIG_REL), 'utf-8'));

// ── THE DEFECT CLASS: a path taken from the caller reaching the file ─────────

test('registerApp persists NO localPath even when handed an absolute one', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const absTarget = path.join(wsRoot, 'arbitrary-abs-target');

  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  cfg.registerApp('somecommunity', 'mapped', { localPath: absTarget, kbId: 'General' });
  await cfg.save(wsRoot);

  const written = await readConfig(wsRoot);
  assert.ok(!('localPath' in written.env.app), 'localPath reached workspace.json — it is no longer an input');
  assert.ok(!JSON.stringify(written).includes(absTarget), 'the caller-supplied absolute path was persisted');
  await assert.rejects(() => fs.stat(absTarget), 'registerApp must never create the directory it was handed');

  // And the workspace is still READABLE afterwards: "not bricked", proven by a real read.
  const reread = await WorkspaceConfig.tryLoad(wsRoot);
  assert.equal(reread.getAppByAppId('mapped')?.localPath, '.');
  assert.equal(reread.getAppByAppId('mapped')?.absolutePath, wsRoot);
});

// ── THE ONE RESOLVER: refuses absolute, accepts relative ─────────────────────

test('resolveWorkspacePath REFUSES an absolute localPath, naming the entry and the remedy', () => {
  const wsRoot = path.join(os.tmpdir(), 'ws-root');
  let message = '';
  try {
    resolveWorkspacePath(wsRoot, path.join(wsRoot, 'x'), 'named-probe');
  } catch (e) { message = e.message; }
  assert.match(message, /is an absolute path/, 'the absolute value must be refused');
  assert.match(message, /named-probe/, 'refusal must name the offending entry');
  assert.match(message, /relative to the workspace root/, 'refusal must state what is required');
  assert.doesNotMatch(message, /\bdelete\b/i, 'a refusal must not prescribe destroying what it is diagnosing');
});

test('POSITIVE CONTROL — resolveWorkspacePath accepts a relative localPath', () => {
  const wsRoot = path.join(os.tmpdir(), 'ws-root');
  assert.equal(resolveWorkspacePath(wsRoot, 'existing', 'legal-probe'), path.resolve(wsRoot, 'existing'));
  assert.equal(resolveWorkspacePath(wsRoot, '.', 'legal-probe'), path.resolve(wsRoot));
});

// ── THE DEAD SURFACE IS DELETED, NOT GUARDED ─────────────────────────────────

test('the superseded writers are GONE from the instance', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  for (const gone of ['setLocalPath', 'registerProduct', 'unregisterProduct', 'getProduct', 'listProducts', 'computeAbsolutePaths']) {
    assert.equal(typeof cfg[gone], 'undefined', `${gone} is still present — deleted surface must not be fenced or restored`);
  }
  assert.equal(cfg.products, undefined, 'the legacy this.products map is still present');
  // Negative control for this arm: a method that REMAINS must still be found, or an assertion
  // that passes because the lookup itself is broken is indistinguishable from a real deletion.
  assert.equal(typeof cfg.registerApp, 'function', 'registerApp missing — this arm is not discriminating');
});

test('COVERAGE BOUNDARY', () => {
  console.log([
    'COMPARES : what registerApp writes against a caller-supplied absolute localPath, and',
    '           resolveWorkspacePath against one absolute and one relative value.',
    'CATCHES  : a workspace.json writer that persists a value the loader will refuse on the',
    '           next read, and a resolver that over-blocks a legal relative path.',
    'DOES NOT READ : the `descix` process or its exit code; the directories the app-init',
    '           action creates; any other consumer of workspace.json; anything outside descix-cli.',
    'RUN BY   : `npm test` in descix-cli (node --test "tests/*.test.js").',
  ].join('\n'));
});
