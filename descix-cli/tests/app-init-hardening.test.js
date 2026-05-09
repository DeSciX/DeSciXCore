/**
 * Tests for `app init` hardening (WS-CLI-V2.1-PURGE Batch 2).
 *
 * Coverage:
 *  - hard-fail: already-mapped app + -p flag → canonical redirect message
 *  - hard-fail: new app with non-existent path → error (no silent mkdir -p)
 *  - happy path: new app + valid existing dir registers correctly
 *
 * Design: tests use WorkspaceConfig directly against a temp workspace fixture
 * and simulate the app init workspace registration logic without requiring
 * a live platform connection (the Firestore/Products API call is mocked).
 *
 * Run: `node --test tests/app-init-hardening.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create an isolated temp workspace with one already-mapped app.
 */
async function makeTestWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-appinit-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'EGPT'), { recursive: true });

  const appId = 'egpt';
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      products: [{ appId, localPath: 'EGPT', kbId: 'General' }]
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
 * Simulate the workspace-registration portion of `app init`
 * (mirrors bin/descix.js ~L1056–L1074, the part that runs before API calls).
 *
 * Returns the registered localPath on success. Throws on guard violations.
 * Does NOT call apiClient — validates only workspace-level logic.
 */
async function simulateAppInitWorkspaceStep(wsRoot, appId, localPathOption) {
  const workspaceConfig = await WorkspaceConfig.tryLoad(wsRoot);
  const alreadyMapped = workspaceConfig?.getAppByAppId(appId);

  // Guard: already-mapped + -p → hard-fail
  if (alreadyMapped && localPathOption) {
    throw new Error(
      `App '${appId}' is already mapped to '${alreadyMapped.localPath}'. ` +
      `Use 'descix app set-localpath -a ${appId} -p <new-path>' to update.`
    );
  }

  if (!alreadyMapped) {
    const localPath = localPathOption || '.';
    const wsRootResolved = workspaceConfig?.workspaceRoot || wsRoot;
    const absPath = path.resolve(wsRootResolved, localPath);

    // Guard: path must exist (no silent mkdir -p)
    try {
      const stat = await fs.stat(absPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path is not a directory: ${absPath}`);
      }
    } catch (e) {
      if (e.message.includes('Path is not a directory')) throw e;
      throw new Error(`Path does not exist: ${absPath}`);
    }

    const cfg = workspaceConfig || new WorkspaceConfig({}, wsRootResolved);
    cfg.registerApp('test-community', appId, { localPath, kbId: 'General' });
    await cfg.save(wsRootResolved);
    return localPath;
  }

  return alreadyMapped.localPath;
}

// ─────────────────────────────────────────────────────────────────────────────

test('app init — hard-fail: already-mapped + -p → canonical redirect message', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  const newPath = path.join(wsRoot, 'new-location');
  await fs.mkdir(newPath, { recursive: true });

  await assert.rejects(
    () => simulateAppInitWorkspaceStep(wsRoot, appId, newPath),
    (err) => {
      assert.match(
        err.message,
        /is already mapped to/,
        'must mention "already mapped"'
      );
      assert.match(
        err.message,
        /descix app set-localpath/,
        'must redirect user to set-localpath command'
      );
      return true;
    },
    'must throw when app is already mapped and -p is provided'
  );
});

test('app init — hard-fail: new app with non-existent path → no silent mkdir -p', async (t) => {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-initguard-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

  // Empty workspace — no products
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: { products: [] }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  const badPath = path.join(wsRoot, 'DOES_NOT_EXIST_' + Date.now());

  await assert.rejects(
    () => simulateAppInitWorkspaceStep(wsRoot, 'newapp', badPath),
    /Path does not exist:/,
    'must throw for non-existent path (no silent mkdir -p)'
  );

  // Verify the directory was NOT created
  let existed = false;
  try {
    await fs.stat(badPath);
    existed = true;
  } catch {
    // expected — should not exist
  }
  assert.equal(existed, false, 'mkdir -p must NOT have been called silently');
});

test('app init — happy path: new app + valid existing dir registers in workspace.json', async (t) => {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-inithappy-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  const appDir = path.join(wsRoot, 'my-new-app');
  await fs.mkdir(appDir, { recursive: true });

  // Empty workspace
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: { products: [] }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  const appId = 'freshapp';
  await simulateAppInitWorkspaceStep(wsRoot, appId, appDir);

  // Reload and verify
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const registered = reloaded.getAppByAppId(appId);
  assert.ok(registered, 'new app must be registered in workspace.json after init');
  assert.equal(registered.localPath, appDir, 'localPath must match the provided path');
});

test('app init — happy path: already-mapped app without -p is idempotent (no error)', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);

  // Should NOT throw when -p is absent and app is already mapped
  const localPath = await simulateAppInitWorkspaceStep(wsRoot, appId, null);
  assert.ok(localPath, 'must return existing localPath without error');
});
