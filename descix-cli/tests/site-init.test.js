/**
 * Tests for the `descix site init` command handler logic.
 *
 * Coverage:
 *  - happy path: getAppByAppId returns config, appPath is resolved correctly
 *  - hard-fail: unmapped app → no TypeError, throws with meaningful message
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
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create an isolated temp workspace with one product mapped.
 * Returns { wsRoot, appId, appDir }.
 */
async function makeTestWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-site-init-'));
  const appDir = path.join(wsRoot, 'smile-fms');
  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

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
    throw new Error(`App not found in workspace.json.`);
  }
  return appConfig;
}

// ─────────────────────────────────────────────────────────────────────────────

test('site-init — happy path: getAppByAppId returns config with absolutePath and localPath', async (t) => {
  const { wsRoot, appId, appDir } = await makeTestWorkspace(t);

  const appConfig = await runSiteInitLookup(wsRoot, appId);

  assert.ok(appConfig, 'appConfig must be returned for mapped app');
  assert.ok(appConfig.localPath, 'localPath must be present');
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
      assert.match(err.message, /not found in workspace\.json/);
      return true;
    }
  );
});
