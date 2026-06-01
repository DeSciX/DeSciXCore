/**
 * Tests for `WorkspaceConfig.setMicroservicePort()` — the method that backs
 * `descix app set-port`. Parallel to setSitePort()/site-servelocal.test.js.
 *
 * Closes WS-CLI-MESH-ROUTING-GAP: this is the canonical write path for the
 * microservice port that `descix microservice init` reads (and hard-fails on
 * if missing). Mirrors site-servelocal.test.js exactly, operating on
 * microservice.{} instead of site.{}.
 *
 * Coverage:
 *  - happy path: set port → workspace.json env.products[<app>].microservice.port persisted
 *  - disable case: port null → microservice.port removed; empty microservice.{} cleaned up
 *  - disable case on app with no microservice.{} → does not throw
 *  - hard-fail: unmapped app → throws with canonical error (not TypeError)
 *  - platform app: setMicroservicePort works for env.platform entry as well
 *  - anti-regression: WorkspaceConfig exposes setMicroservicePort as a function
 *
 * Design: operates directly against WorkspaceConfig using a temp workspace.
 * Never touches the real ~/.descix/workspace.json.
 *
 * Run: `node --test tests/app-set-port.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Create an isolated temp workspace with one product and one platform app mapped.
 * Returns { wsRoot, productAppId, platformAppId }.
 */
async function makeTestWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-setport-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'my-product'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'my-platform'), { recursive: true });

  const productAppId = 'descix-ssgpod';
  const platformAppId = 'daita';

  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      platform: { appId: platformAppId, localPath: 'my-platform', kbId: 'General' },
      products: [{ appId: productAppId, localPath: 'my-product', kbId: 'General' }]
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, productAppId, platformAppId };
}

// ─────────────────────────────────────────────────────────────────────────────

test('setMicroservicePort — happy path: port saved to env.products[app].microservice.port', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setMicroservicePort(productAppId, 3015);

  // Reload from disk and verify persistence
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.ok(product, 'product entry must exist');
  assert.equal(product.microservice?.port, 3015, 'microservice.port must be 3015 after save');
});

test('setMicroservicePort — disable case: null removes microservice.port and cleans up empty microservice.{}', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  // First set a port
  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setMicroservicePort(productAppId, 3015);

  // Then disable
  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setMicroservicePort(productAppId, null);

  // Reload and verify microservice.port is gone and microservice.{} is cleaned up
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.ok(product, 'product entry must still exist');
  assert.equal(product.microservice, undefined, 'microservice.{} must be deleted when empty after port removal');
});

test('setMicroservicePort — disable case: null on app with no microservice.{} does not throw', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  // No microservice.{} set yet — must not throw
  await assert.doesNotReject(
    () => wc.setMicroservicePort(productAppId, null),
    'setMicroservicePort(null) on app with no microservice must not throw'
  );
});

test('setMicroservicePort — hard-fail: unmapped app throws with canonical error text', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    () => wc.setMicroservicePort('totally-unknown-app', 3015),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      assert.match(err.message, /not mapped in workspace\.json/);
      assert.match(err.message, /descix app init/);
      assert.match(err.message, /descix app set-localpath/);
      return true;
    }
  );
});

test('setMicroservicePort — platform app: port saved to env.platform.microservice.port', async (t) => {
  const { wsRoot, platformAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setMicroservicePort(platformAppId, 4000);

  const reloaded = await WorkspaceConfig.load(wsRoot);
  assert.equal(reloaded.env.platform?.microservice?.port, 4000, 'platform microservice.port must be persisted');
});

test('anti-regression: WorkspaceConfig exposes setMicroservicePort as a function', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  const wc = await WorkspaceConfig.load(wsRoot);
  assert.equal(
    typeof wc.setMicroservicePort,
    'function',
    'WorkspaceConfig.setMicroservicePort must exist (backs `descix app set-port` / WS-CLI-MESH-ROUTING-GAP)'
  );
});
