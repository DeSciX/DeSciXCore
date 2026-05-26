/**
 * Tests for the manifest-path fallback branch in `descix microservice vectorize`.
 *
 * Coverage (line ~3238 post-migration):
 *  - primary path: manifest.json found at ./manifest.json (no workspace lookup needed)
 *  - fallback path: manifest.json not in cwd → resolved via getAppByAppId().absolutePath
 *  - no TypeError: getApp() removed; getAppByAppId() used — regression gate
 *  - fallback produces correct path: <workspaceRoot>/<localPath>/microservice/manifest.json
 *
 * Design: tests WorkspaceConfig.getAppByAppId() path-resolution directly without
 * invoking the full vectorize pipeline (which requires a live backend).
 *
 * Run: `node --test tests/microservice-vectorize.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create a temp workspace with a mapped app that has a microservice/manifest.json.
 * Returns { wsRoot, appId, manifestPath }.
 */
async function makeVectorizeWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-ms-vec-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  const microserviceDir = path.join(wsRoot, 'smile-fms', 'microservice');
  await fs.mkdir(microserviceDir, { recursive: true });

  const appId = 'smile-fms';
  const manifestPath = path.join(microserviceDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify({ name: 'smile-fms', commands: [] }, null, 2));

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

  return { wsRoot, appId, manifestPath };
}

/**
 * Simulate the post-migration manifest-path fallback (mirrors bin/descix.js ~L3238).
 * Returns the resolved manifest path.
 */
async function resolveManifestPath(wsRoot, appId, cwdManifest) {
  // Try primary path first (as the real code does)
  try {
    await fs.access(cwdManifest);
    return cwdManifest;
  } catch {
    // Fallback: resolve via workspace
    const workspaceConfig = await WorkspaceConfig.load(wsRoot);
    if (appId && workspaceConfig.workspaceRoot) {
      const appConfig = workspaceConfig.getAppByAppId(appId);
      if (appConfig) {
        return path.join(workspaceConfig.workspaceRoot, appConfig.localPath, 'microservice', 'manifest.json');
      }
    }
    throw new Error('manifest.json not found');
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test('microservice-vectorize — fallback: resolves manifest via getAppByAppId (no TypeError)', async (t) => {
  const { wsRoot, appId, manifestPath } = await makeVectorizeWorkspace(t);

  // Simulate cwd manifest not found → fallback to workspace lookup
  const cwdManifest = path.join(os.tmpdir(), 'no-manifest-here-' + Date.now() + '.json');

  let resolved;
  let err;
  try {
    resolved = await resolveManifestPath(wsRoot, appId, cwdManifest);
  } catch (e) {
    err = e;
  }

  assert.ok(!err, `must not throw — got: ${err?.message}`);
  assert.ok(!(err instanceof TypeError), 'must not be a TypeError (removed-method regression)');
  assert.equal(
    path.resolve(resolved),
    path.resolve(manifestPath),
    'resolved manifest path must point to microservice/manifest.json'
  );
});

test('microservice-vectorize — primary path: manifest.json in cwd used directly', async (t) => {
  const { wsRoot, appId } = await makeVectorizeWorkspace(t);

  // Create a manifest in a temp cwd location
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-ms-cwd-'));
  const cwdManifest = path.join(tempDir, 'manifest.json');
  await fs.writeFile(cwdManifest, JSON.stringify({ name: 'local-test', commands: [] }));

  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const resolved = await resolveManifestPath(wsRoot, appId, cwdManifest);
  assert.equal(resolved, cwdManifest, 'primary path manifest must be returned directly');
});

test('microservice-vectorize — fallback: unmapped app throws clean Error', async (t) => {
  const { wsRoot } = await makeVectorizeWorkspace(t);
  const cwdManifest = path.join(os.tmpdir(), 'no-such-manifest-' + Date.now() + '.json');

  await assert.rejects(
    () => resolveManifestPath(wsRoot, 'totally-unknown-app', cwdManifest),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      return true;
    }
  );
});
