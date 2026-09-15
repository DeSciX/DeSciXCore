/**
 * A PATH THIS CLI ACCEPTS MUST BE HONOURED, OR REFUSED BEFORE ANYTHING IS WRITTEN.
 *
 * WHAT THIS GATE COMPARES: the two workspace.json WRITERS that persist a localPath —
 * `registerApp` and `setLocalPath` — against one absolute value and one relative value.
 *
 * WHY IT IS SHAPED AS A COMPARISON AND NOT A REFUSAL CHECK. Three writers persisted a
 * localPath and exactly ONE validated it. `descix app init -p /absolute` therefore wrote an
 * absolute localPath, CREATED DIRECTORIES AT AN ARBITRARY ABSOLUTE LOCATION taken from user
 * input, printed a green success line and exited 0 — and bricked the workspace only on the
 * NEXT read, because the loader refuses an absolute localPath for EVERY command including the
 * repair verbs, while the refusal message forbids hand-editing.
 *
 * THE `setLocalPath` ARM IS A POSITIVE CONTROL AND MUST NOT BE REMOVED. A suite that only
 * shows `registerApp` refusing cannot distinguish the fix from a resolver that refuses
 * EVERYTHING — an outage reads identically to a repair. The relative-path arms are the other
 * half of the same discrimination: over-blocking is the failure a refusal-only suite never
 * catches.
 *
 * Run: `node --test tests/localpath-writers-validate.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

const CONFIG_REL = path.join('.descix', 'workspace.json');

/**
 * Isolated temp workspace with one already-mapped app and one real relative directory.
 * Registered for removal with t.after so a run leaves no residue behind — this suite writes
 * workspace files and (on the unfixed tree) provokes directory creation, so cleaning up after
 * itself is part of the gate, not housekeeping.
 */
async function makeWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-localpath-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'existing'), { recursive: true });
  await fs.writeFile(
    path.join(wsRoot, CONFIG_REL),
    JSON.stringify(
      { version: '2.1', type: 'workspace', env: { products: [{ appId: 'mapped', localPath: 'existing', kbId: 'General' }] } },
      null, 2
    )
  );
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return wsRoot;
}

const readConfig = (wsRoot) => fs.readFile(path.join(wsRoot, CONFIG_REL), 'utf-8');

// ── THE DEFECT ───────────────────────────────────────────────────────────────

test('registerApp REFUSES an absolute localPath BEFORE writing anything', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const absTarget = path.join(wsRoot, 'arbitrary-abs-target');
  const before = await readConfig(wsRoot);

  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  assert.throws(
    () => cfg.registerApp('somecommunity', 'disposable-probe', { localPath: absTarget, kbId: 'General' }),
    /is an absolute path/,
    'registerApp accepted an absolute localPath — the value the loader refuses on the next read'
  );

  // Refused BEFORE writing: the file must be byte-identical, not merely "valid".
  assert.equal(await readConfig(wsRoot), before, 'workspace.json was mutated despite the refusal');
});

test('the refusal names the offending entry and the remedy, and does not prescribe deleting the file', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  let message = '';
  try {
    cfg.registerApp('somecommunity', 'named-probe', { localPath: path.join(wsRoot, 'x'), kbId: 'General' });
  } catch (e) { message = e.message; }
  assert.match(message, /named-probe/, 'refusal must name the offending entry');
  assert.match(message, /relative to the workspace root/, 'refusal must state what is required');
  assert.doesNotMatch(message, /\bdelete\b/i, 'a refusal must not prescribe destroying what it is diagnosing');
});

// ── POSITIVE CONTROL: the predicate must DISCRIMINATE, not just reject ───────

test('POSITIVE CONTROL — setLocalPath refuses the same absolute value', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  await assert.rejects(
    () => cfg.setLocalPath('mapped', path.join(wsRoot, 'arbitrary-abs-target')),
    /is an absolute path/,
    'the already-validated writer stopped refusing — the control, not the subject, has broken'
  );
});

// ── THE LEGAL CASE STILL WORKS (a refusal-only suite cannot tell a fix from an outage) ──

test('registerApp ACCEPTS a relative localPath and persists it', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  cfg.registerApp('somecommunity', 'legal-probe', { localPath: 'existing', kbId: 'General' });
  await cfg.save(wsRoot);

  const written = JSON.parse(await readConfig(wsRoot));
  const entry = written.env.products.find((p) => p.appId === 'legal-probe');
  assert.ok(entry, 'a relative localPath was rejected — the fix is over-blocking');
  assert.equal(entry.localPath, 'existing');

  // And the workspace is still READABLE afterwards: "not bricked", proven by a real read.
  const reread = await WorkspaceConfig.tryLoad(wsRoot);
  assert.equal(reread.getAppByAppId('legal-probe')?.localPath, 'existing');
});

test('POSITIVE CONTROL — setLocalPath still accepts a relative localPath', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  await cfg.setLocalPath('mapped', 'existing');
  const reread = await WorkspaceConfig.tryLoad(wsRoot);
  assert.equal(reread.getAppByAppId('mapped')?.localPath, 'existing');
});

// ── THE DEAD SURFACE IS DELETED, NOT GUARDED ─────────────────────────────────

test('the superseded product surface is GONE from the instance', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  for (const gone of ['registerProduct', 'unregisterProduct', 'getProduct', 'listProducts', 'computeAbsolutePaths']) {
    assert.equal(typeof cfg[gone], 'undefined', `${gone} is still present — deleted surface must not be fenced or restored`);
  }
  assert.equal(cfg.products, undefined, 'the legacy this.products map is still present');
  // Negative control for this arm: a method that REMAINS must still be found, or an assertion
  // that passes because the lookup itself is broken is indistinguishable from a real deletion.
  assert.equal(typeof cfg.registerApp, 'function', 'registerApp missing — this arm is not discriminating');
});

/**
 * THE VERSION-DOWNGRADE ITEM, RECORDED AS MEASURED RATHER THAN AS BELIEVED.
 *
 * registerProduct set `this.version = '2.0'`. That assignment was REAL, and it is tempting to
 * call it a downgrade. IT WAS NOT ONE. `this.version` has writers and NO READERS: save() stamps
 * the literal '2.1' into configData and never consults the field.
 *
 * MEASURED on the pristine base: load a v2.1 workspace, call registerProduct, save -> on disk
 * STILL 2.1. Force cfg.version to '2.0', save -> STILL 2.1. Force '9.9' -> STILL 2.1. THE
 * DOWNGRADE WAS LATENT AND NEVER REACHED DISK.
 *
 * THERE IS DELIBERATELY NO ASSERTION HERE ON THE SAVED VERSION. One would read as rigour and
 * COULD NOT FAIL: '2.1' is true on both trees, before and after this change, whatever any writer
 * does, because the value is a literal at the write site. A gate that cannot fail is not a gate,
 * and shipping one inside the change that exists to abolish that shape is how the shape survives.
 *
 * A WRITE IS NOT AN EFFECT: confirming an assignment exists is not confirming it does anything.
 * Trace a field-set to a READER before calling it a behaviour. What this arm asserts instead is
 * the one thing that both discriminates and keeps the item findable if the surface is ever
 * resurrected -- that the writer is gone.
 */
test('the writer that set version 2.0 is gone (the downgrade itself was latent - see above)', async (t) => {
  const wsRoot = await makeWorkspace(t);
  const cfg = await WorkspaceConfig.tryLoad(wsRoot);
  assert.equal(typeof cfg.registerProduct, 'undefined',
    'registerProduct is back - and re-measure whether save() now READS this.version before calling it a downgrade');
  // Negative control for this arm: a writer that REMAINS must still be found, or this passes
  // because the lookup is broken rather than because the surface is gone.
  assert.equal(typeof cfg.registerApp, 'function', 'registerApp missing - this arm is not discriminating');
});

test('COVERAGE BOUNDARY', () => {
  console.log([
    'COMPARES : registerApp vs setLocalPath, on one absolute and one relative localPath.',
    'CATCHES  : a workspace.json writer that persists a value the loader will refuse on the',
    '           next read, and a fix that over-blocks a legal relative path.',
    'DOES NOT READ : the `descix` process or its exit code; the directories the app-init',
    '           action creates at the resolved path; the SAVED WORKSPACE VERSION (save() writes',
    '           the literal 2.1 and consults no field, so no assertion on it could fail); any',
    '           other consumer of workspace.json; anything outside descix-cli.',
    'RUN BY   : `npm test` in descix-cli (node --test "tests/*.test.js").',
  ].join('\n'));
});
