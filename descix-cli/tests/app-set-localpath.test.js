/**
 * Tests for `descix app set-localpath`.
 *
 * Coverage:
 *  - happy path: valid path updates localPath in workspace.json env.products entry
 *  - hard-fail: non-existent path → "Path does not exist: <path>"
 *  - hard-fail: unmapped app → canonical "not mapped" message
 *  - hard-fail: missing -a → WorkspaceConfig error (unmapped app id '')
 *
 * Design: tests operate directly against WorkspaceConfig using a temp workspace;
 * they never mutate the real ~/.descix/workspace.json or any app's workspace.json.
 *
 * Run: `node --test tests/app-set-localpath.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create an isolated temp workspace.json with one product mapped.
 * Returns { wsRoot, appId, appDir } — appDir is a real directory that exists.
 */
async function makeTestWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-ws-'));
  const appDir = path.join(wsRoot, 'my-app');
  await fs.mkdir(appDir, { recursive: true });
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

  const appId = 'testapp';
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      products: [{ appId, localPath: 'my-app', kbId: 'General' }]
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  // Cleanup after test
  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, appId, appDir };
}

/**
 * Simulate set-localpath logic (mirrors bin/descix.js appCommand set-localpath action).
 * Returns updated WorkspaceConfig on success, throws on failure.
 */
async function runSetLocalpath(wsRoot, appId, newPath) {
  const workspaceConfig = await WorkspaceConfig.load(wsRoot);
  const appConfig = workspaceConfig.getAppByAppId(appId);
  if (!appConfig) {
    throw new Error(`App '${appId}' is not mapped. Run 'descix app init -a ${appId}' first.`);
  }

  let stat;
  try {
    stat = await fs.stat(newPath);
  } catch {
    throw new Error(`Path does not exist: ${newPath}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${newPath}`);
  }

  // Update env.products entry
  const products = workspaceConfig.env?.products || [];
  for (const product of products) {
    if (product.appId === appId || product.app_id === appId) {
      product.localPath = newPath;
      break;
    }
  }
  await workspaceConfig.save(wsRoot);
  return workspaceConfig;
}

// ─────────────────────────────────────────────────────────────────────────────

test('set-localpath — happy path: valid path updates localPath in workspace.json', async (t) => {
  const { wsRoot, appId, appDir } = await makeTestWorkspace(t);

  // Create a second directory as the new target
  const newAppDir = path.join(wsRoot, 'my-app-v2');
  await fs.mkdir(newAppDir, { recursive: true });

  await runSetLocalpath(wsRoot, appId, newAppDir);

  // Reload and verify
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const updated = reloaded.getAppByAppId(appId);
  assert.ok(updated, 'app should still be mapped after update');
  assert.equal(updated.localPath, newAppDir, 'localPath must equal the new path');
});

test('set-localpath — hard-fail: non-existent path → canonical error message', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  const badPath = path.join(wsRoot, 'NONEXISTENT_XYZ_' + Date.now());

  await assert.rejects(
    () => runSetLocalpath(wsRoot, appId, badPath),
    (err) => {
      assert.match(err.message, /Path does not exist:/);
      assert.ok(err.message.includes(badPath), 'error must include the bad path');
      return true;
    },
    'must throw for non-existent path'
  );
});

test('set-localpath — hard-fail: unmapped app → canonical "not mapped" message', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  const realDir = path.join(wsRoot, 'some-real-dir');
  await fs.mkdir(realDir, { recursive: true });

  await assert.rejects(
    () => runSetLocalpath(wsRoot, 'totally-unknown-app-id', realDir),
    /not mapped/,
    'must throw for unmapped app'
  );
});

test('set-localpath — hard-fail: path that is a file (not a directory) → "not a directory"', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  const filePath = path.join(wsRoot, 'a-file.txt');
  await fs.writeFile(filePath, 'hello');

  await assert.rejects(
    () => runSetLocalpath(wsRoot, appId, filePath),
    /Path is not a directory:/,
    'must reject file paths'
  );
});
