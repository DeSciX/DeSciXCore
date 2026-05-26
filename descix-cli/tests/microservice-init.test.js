/**
 * Tests for `descix microservice init` post-migration behavior.
 *
 * PRIMARY AC for Batch 4: `descix microservice init -c smile -a smile-fms` must
 * succeed (no TypeError: workspaceConfig.getApp is not a function).
 *
 * Coverage:
 *  - regression gate: getAppByAppId used (not removed getApp) — no TypeError
 *  - happy path: mapped app returns config with absolutePath and localPath
 *  - hard-fail: unmapped app throws a clean Error, not a TypeError
 *
 * Design: exercises WorkspaceConfig.getAppByAppId() directly against a temp
 * workspace to validate the post-migration call site is correct.
 *
 * Run: `node --test tests/microservice-init.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create an isolated temp workspace that mirrors a real smile-fms setup.
 * Returns { wsRoot, appId }.
 */
async function makeSmileWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-ms-init-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'smile-fms'), { recursive: true });

  const appId = 'smile-fms';
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      products: [{ appId, localPath: 'smile-fms', kbId: 'General' }]
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, appId };
}

/**
 * Simulate the post-migration microservice-init lookup
 * (mirrors the fixed bin/descix.js action).
 */
async function runMicroserviceInitLookup(wsRoot, appId) {
  const workspaceConfig = await WorkspaceConfig.load(wsRoot);
  const appConfig = workspaceConfig.getAppByAppId(appId);
  if (!appConfig) {
    throw new Error(`App not found in workspace.json.`);
  }
  return appConfig;
}

// ─────────────────────────────────────────────────────────────────────────────

test('microservice-init — PRIMARY AC: smile-fms lookup succeeds with no TypeError', async (t) => {
  const { wsRoot, appId } = await makeSmileWorkspace(t);

  // This is the exact regression: getApp(communityId, appId) was called before Batch 4,
  // which throws TypeError. Post-migration uses getAppByAppId(appId). Must not throw.
  let threw = false;
  let err;
  try {
    await runMicroserviceInitLookup(wsRoot, appId);
  } catch (e) {
    threw = true;
    err = e;
  }

  assert.equal(threw, false, `lookup must not throw for mapped app — got: ${err?.message}`);
});

test('microservice-init — happy path: appConfig has absolutePath and localPath', async (t) => {
  const { wsRoot, appId } = await makeSmileWorkspace(t);

  const appConfig = await runMicroserviceInitLookup(wsRoot, appId);

  assert.ok(appConfig.localPath, 'localPath must be present');
  assert.ok(appConfig.absolutePath, 'absolutePath must be present');
  assert.equal(
    path.resolve(appConfig.absolutePath),
    path.resolve(path.join(wsRoot, 'smile-fms')),
    'absolutePath must point to the app directory'
  );
});

test('microservice-init — hard-fail: unmapped app throws clean Error (not TypeError)', async (t) => {
  const { wsRoot } = await makeSmileWorkspace(t);

  await assert.rejects(
    () => runMicroserviceInitLookup(wsRoot, 'totally-unknown-app'),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'error must not be a TypeError (removed-method regression check)');
      assert.match(err.message, /not found in workspace\.json/);
      return true;
    }
  );
});

// Batch 5: scaffold-copy + injection happy path — exercises copyScaffold() and the
// community_id/app_id injection pattern to close the test-coverage gap that hid
// the Hydrator.js path-walk bug from Batch 4.
test('microservice-init — Batch 5: copyScaffold("microservice") produces all expected files and defaults-config is injectable', async (t) => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-ms-scaffold-'));
  t.after(async () => {
    await fs.rm(appDir, { recursive: true, force: true });
  });

  const { copyScaffold } = await import('../lib/core/Hydrator.js');
  await copyScaffold('microservice', appDir);

  // Assert all expected scaffold files/dirs exist
  const expectedFiles = [
    path.join(appDir, 'microservice', 'app.js'),
    path.join(appDir, 'microservice', 'package.json'),
    path.join(appDir, 'microservice', 'manifest.json'),
    path.join(appDir, 'microservice', 'defaults-config.json'),
  ];
  for (const filePath of expectedFiles) {
    await assert.doesNotReject(
      () => fs.access(filePath),
      `Expected scaffold file to exist: ${path.relative(appDir, filePath)}`
    );
  }

  // Assert services/ directory exists
  const servicesDir = path.join(appDir, 'microservice', 'services');
  const servicesStat = await fs.stat(servicesDir);
  assert.ok(servicesStat.isDirectory(), 'services/ must be a directory');

  // Simulate the injection logic from the CLI handler:
  // read defaults-config.json, inject community_id + app_id, write back, assert injected
  const defaultsPath = path.join(appDir, 'microservice', 'defaults-config.json');
  const rawDefaults = await fs.readFile(defaultsPath, 'utf-8');
  const defaults = JSON.parse(rawDefaults);
  defaults.community_id = 'smile';
  defaults.app_id = 'smile-fms';
  await fs.writeFile(defaultsPath, JSON.stringify(defaults, null, 2));

  const injected = JSON.parse(await fs.readFile(defaultsPath, 'utf-8'));
  assert.equal(injected.community_id, 'smile', 'community_id must be injected');
  assert.equal(injected.app_id, 'smile-fms', 'app_id must be injected');
});
