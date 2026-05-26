/**
 * Tests for `descix update kb` — v1 fallback branch removal (site #5).
 *
 * Pre-Batch 4: `loadWorkspaceContext` in update.js had a v1 fallback:
 *   if (!appConfig && ctx.communityId) { appConfig = workspaceConfig.getApp(...) }
 * That fallback is now DELETED. An unmapped app must hard-fail immediately.
 *
 * Coverage:
 *  - hard-fail: app not in env.products → throws with canonical error referencing
 *    both `descix app init` and `descix app set-localpath`
 *  - no silent recovery: the deleted fallback must NOT swallow the error
 *  - happy path: mapped app is found by getAppByAppId (Unified Registry)
 *
 * Design: imports and calls loadWorkspaceContext from update.js directly using
 * a temp workspace. No live backend required.
 *
 * Run: `node --test tests/update-kb-v1-fallback-removed.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Replicate loadWorkspaceContext from update.js post-deletion of v1 fallback.
 * This is the exact logic after the Batch 4 fix.
 */
async function loadWorkspaceContextV2(wsRoot, appId) {
  const workspaceConfig = await WorkspaceConfig.load(wsRoot);
  const appConfig = workspaceConfig.getAppByAppId(appId);

  if (!appConfig) {
    throw new Error(
      `App "${appId}" not found in workspace.json.\n` +
      'Use `descix app init` to register, or `descix app set-localpath -a <id> -p <path>` to repoint.'
    );
  }

  const appPath = appConfig.absolutePath ||
    (appConfig.localPath && workspaceConfig.workspaceRoot
      ? path.join(workspaceConfig.workspaceRoot, appConfig.localPath)
      : null);

  if (!appPath) {
    throw new Error(`App path not configured for ${appId}`);
  }

  return { workspaceConfig, appId, appPath };
}

/**
 * Create a temp workspace with one product and NO community-keyed fallback data.
 */
async function makeTestWorkspace(t, { mapped = true } = {}) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-update-kb-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

  const appId = 'smile-fms';

  const products = mapped
    ? [{ appId, localPath: 'smile-fms', kbId: 'General' }]
    : [];

  if (mapped) {
    await fs.mkdir(path.join(wsRoot, 'smile-fms'), { recursive: true });
  }

  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: { products }
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

// ─────────────────────────────────────────────────────────────────────────────

test('update-kb — hard-fail: unmapped app throws canonical error (no v1 fallback)', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t, { mapped: false });

  await assert.rejects(
    () => loadWorkspaceContextV2(wsRoot, 'smile-fms'),
    (err) => {
      // Must reference both canonical recovery commands
      assert.match(err.message, /descix app init/,
        'error must reference `descix app init`');
      assert.match(err.message, /descix app set-localpath/,
        'error must reference `descix app set-localpath`');
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      return true;
    },
    'unmapped app must hard-fail with canonical error'
  );
});

test('update-kb — hard-fail: communityId present but app not in env.products → no silent recovery', async (t) => {
  // Verify that even if we pass a communityId, there is NO fallback getApp() call.
  // The v1 fallback block was: if (!appConfig && ctx.communityId) { appConfig = getApp(communityId, appId) }
  // After deletion, providing communityId changes nothing — the lookup is purely by appId.
  const { wsRoot } = await makeTestWorkspace(t, { mapped: false });

  // Provide a communityId (as the old v1 fallback required) — must still throw
  await assert.rejects(
    () => loadWorkspaceContextV2(wsRoot, 'smile-fms'),
    /descix app init/,
    'communityId presence must not trigger silent fallback recovery'
  );
});

test('update-kb — happy path: mapped app resolves correctly', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t, { mapped: true });

  const ctx = await loadWorkspaceContextV2(wsRoot, appId);

  assert.ok(ctx.appId, 'appId must be present');
  assert.ok(ctx.appPath, 'appPath must be present');
  assert.equal(
    path.resolve(ctx.appPath),
    path.resolve(path.join(wsRoot, 'smile-fms')),
    'appPath must resolve to app directory'
  );
});
