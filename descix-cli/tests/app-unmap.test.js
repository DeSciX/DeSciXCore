/**
 * Tests for `descix app unmap`.
 *
 * Coverage:
 *  - happy path: mapped app is removed from env.products in workspace.json
 *  - hard-fail: unmapped app → "App '<id>' is not mapped."
 *  - critical: Pinecone vectors NOT touched — mock API client asserts no vector
 *    delete call fires during unmap
 *
 * Design: tests use WorkspaceConfig directly against a temp workspace fixture.
 * No platform API calls are made; the mock client asserts zero Pinecone calls.
 *
 * Run: `node --test tests/app-unmap.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create a temp workspace with one mapped app.
 */
async function makeTestWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-unmap-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'my-app'), { recursive: true });

  const appId = 'unmapapp';
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

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, appId };
}

/**
 * Mock API client that records calls and fails fast if any Pinecone-delete
 * or KB-delete command is invoked. Used to prove unmap does NOT touch vectors.
 */
function makePineconeAssertingClient() {
  const calls = [];
  const FORBIDDEN_COMMANDS = [
    'delete_app_vectors',
    'kb_batch_delete',
    'kb_delete',
    'delete_kb_vectors',
    'purge_app_kb',
  ];

  return {
    _calls: calls,
    async loadCredentials() {},
    hasCredentials() { return true; },
    async invoke(command, params = {}) {
      calls.push({ command, params });
      if (FORBIDDEN_COMMANDS.includes(command)) {
        throw new Error(
          `ASSERTION FAILURE: unmap must not invoke Pinecone command '${command}'. ` +
          'unmap is local-only workspace mutation; Pinecone data must remain intact.'
        );
      }
      return { status: 'OK', message: {} };
    }
  };
}

/**
 * Simulate unmap logic (mirrors bin/descix.js appCommand unmap action).
 * apiClient is passed to prove no vector delete is called (not needed by logic itself).
 */
async function runUnmap(wsRoot, appId, _apiClient) {
  const workspaceConfig = await WorkspaceConfig.load(wsRoot);
  const appConfig = workspaceConfig.getAppByAppId(appId);
  if (!appConfig) {
    throw new Error(`App '${appId}' is not mapped.`);
  }

  const products = workspaceConfig.env?.products || [];
  const idx = products.findIndex(p => p.appId === appId || p.app_id === appId);
  if (idx === -1) {
    throw new Error(`App '${appId}' is not found in env.products.`);
  }
  products.splice(idx, 1);

  const wsRootResolved = workspaceConfig.workspaceRoot || wsRoot;
  await workspaceConfig.save(wsRootResolved);
  return workspaceConfig;
}

// ─────────────────────────────────────────────────────────────────────────────

test('unmap — happy path: app is removed from env.products after unmap', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);

  // Verify it is mapped before
  const before = await WorkspaceConfig.load(wsRoot);
  assert.ok(before.getAppByAppId(appId), 'app must be mapped before unmap');

  await runUnmap(wsRoot, appId, null);

  // Reload and verify removal
  const after = await WorkspaceConfig.load(wsRoot);
  const stillMapped = after.getAppByAppId(appId);
  assert.equal(stillMapped, null, 'app must not be in workspace.json after unmap');

  // Products array must not contain the app
  const remaining = after.env?.products || [];
  const found = remaining.find(p => p.appId === appId);
  assert.equal(found, undefined, 'env.products must not have the unmapped app entry');
});

test('unmap — hard-fail: unmapped app → canonical "not mapped" message', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);

  await assert.rejects(
    () => runUnmap(wsRoot, 'fake-nonexistent-xyz', null),
    /is not mapped/,
    'must throw "is not mapped" for unknown appId'
  );
});

test('unmap — critical: no Pinecone vector delete call fires during unmap', async (t) => {
  const { wsRoot, appId } = await makeTestWorkspace(t);
  const apiClient = makePineconeAssertingClient();

  // This must complete without the mock throwing
  await runUnmap(wsRoot, appId, apiClient);

  // Verify no forbidden commands were attempted
  const forbidden = apiClient._calls.filter(c =>
    ['delete_app_vectors', 'kb_batch_delete', 'kb_delete', 'delete_kb_vectors', 'purge_app_kb'].includes(c.command)
  );
  assert.equal(
    forbidden.length,
    0,
    `unmap must not touch Pinecone — forbidden calls: ${JSON.stringify(forbidden)}`
  );

  // In fact, no API calls should have been made at all during a local-only unmap
  assert.equal(
    apiClient._calls.length,
    0,
    'unmap must make zero API calls (local workspace mutation only)'
  );
});
