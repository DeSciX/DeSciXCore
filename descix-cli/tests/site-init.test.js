/**
 * Tests for the `descix site init` command handler logic.
 *
 * Coverage:
 *  - happy path: getAppByAppId returns config, appPath is resolved correctly
 *  - hard-fail: an app id that is not THE workspace app → no TypeError, throws with meaningful message
 *
 * Design: exercises WorkspaceConfig.getAppByAppId() directly (the post-migration
 * method) against a temp workspace to prove the TypeError regression is closed.
 *
 * Run: `node --test tests/site-init.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig, unmappedAppMessage } from '../lib/workspace-config.js';

/**
 * Create an isolated temp v3 workspace (the repo root IS the app root).
 * Returns { wsRoot, appId, appDir } (appDir === wsRoot).
 */
async function makeTestWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-site-init-'));
  const appDir = wsRoot;
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

  const appId = 'smile-fms';
  const workspace = {
    version: '3.0',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      app: { appId, communityId: 'smile', kbId: 'General' }
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, appId, appDir };
}

/**
 * Simulate site-init lookup (mirrors the post-migration bin/descix.js action).
 * Returns appConfig on success, throws on failure.
 */
async function runSiteInitLookup(wsRoot, appId) {
  const workspaceConfig = await WorkspaceConfig.load(wsRoot);
  const appConfig = workspaceConfig.getAppByAppId(appId);
  if (!appConfig) {
    throw new Error(unmappedAppMessage(appId));
  }
  return appConfig;
}

// ─────────────────────────────────────────────────────────────────────────────

test('site-init — happy path: getAppByAppId returns config with absolutePath and localPath', async (t) => {
  const { wsRoot, appId, appDir } = await makeTestWorkspace(t);

  const appConfig = await runSiteInitLookup(wsRoot, appId);

  assert.ok(appConfig, 'appConfig must be returned for mapped app');
  assert.equal(appConfig.localPath, '.', 'v3 localPath is implicitly the workspace root');
  assert.ok(appConfig.absolutePath, 'absolutePath must be present');
  assert.equal(path.resolve(appConfig.absolutePath), path.resolve(appDir), 'absolutePath must point to app directory');
});

test('site-init — regression: no TypeError for mapped app (Batch 4 regression gate)', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);

  // Must not throw TypeError: workspaceConfig.getApp is not a function
  let threw = false;
  let err;
  try {
    await runSiteInitLookup(wsRoot, appId);
  } catch (e) {
    threw = true;
    err = e;
  }
  assert.equal(threw, false, `must not throw — got: ${err?.message}`);
});

test('site-init — hard-fail: unmapped app throws, not TypeError', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);

  await assert.rejects(
    () => runSiteInitLookup(wsRoot, 'totally-unknown-app'),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError (removed-method regression)');
      assert.match(err.message, /is not this workspace's app \(workspace\.json env\.app\)/);
      return true;
    }
  );
});

// Batch 5: scaffold-copy happy path — exercises copyScaffold() to close the test-coverage
// gap that hid the Hydrator.js path-walk bug from Batch 4.
test('site-init — Batch 5: copyScaffold("site") produces all expected files', async (t) => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-site-scaffold-'));
  t.after(async () => {
    await fs.rm(appDir, { recursive: true, force: true });
  });

  const { copyScaffold } = await import('../lib/core/Hydrator.js');
  await copyScaffold('site', appDir);

  const expectedFiles = [
    path.join(appDir, 'site', 'app.js'),
    path.join(appDir, 'site', 'index.html'),
    path.join(appDir, 'site', 'styles.css'),
    path.join(appDir, 'site', 'DeSciXAppSDK.js'),
    path.join(appDir, 'site', 'README.md'),
  ];

  for (const filePath of expectedFiles) {
    await assert.doesNotReject(
      () => fs.access(filePath),
      `Expected scaffold file to exist: ${path.relative(appDir, filePath)}`
    );
  }
});
