/**
 * Tests for `WorkspaceConfig.setSitePort()` — the new method that backs
 * `descix site servelocal` and `descix update site --port`.
 *
 * Coverage:
 *  - happy path: register port → workspace.json env.products[<app>].site.port persisted
 *  - disable case: port null → site.port removed; empty site.{} cleaned up
 *  - hard-fail: unmapped app → throws with canonical error (not TypeError)
 *  - platform app: setSitePort works for env.platform entry as well
 *
 * Design: operates directly against WorkspaceConfig using a temp workspace.
 * Never touches the real ~/.descix/workspace.json.
 *
 * Run: `node --test tests/site-servelocal.test.js` from descix-cli/.
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
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-servelocal-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'my-product'), { recursive: true });
  await fs.mkdir(path.join(wsRoot, 'my-platform'), { recursive: true });

  const productAppId = 'smile-fms';
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

test('setSitePort — happy path: port saved to env.products[app].site.port', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setSitePort(productAppId, 5200);

  // Reload from disk and verify persistence
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.ok(product, 'product entry must exist');
  assert.equal(product.site?.port, 5200, 'site.port must be 5200 after save');
});

test('setSitePort — disable case: null removes site.port and cleans up empty site.{}', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  // First set a port
  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setSitePort(productAppId, 5201);

  // Then disable
  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setSitePort(productAppId, null);

  // Reload and verify site.port is gone and site.{} is cleaned up
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.ok(product, 'product entry must still exist');
  assert.equal(product.site, undefined, 'site.{} must be deleted when empty after port removal');
});

test('setSitePort — disable case: null on app with no site.{} does not throw', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  // No site.{} set yet — must not throw
  await assert.doesNotReject(
    () => wc.setSitePort(productAppId, null),
    'setSitePort(null) on app with no site must not throw'
  );
});

test('setSitePort — hard-fail: unmapped app throws with canonical error text', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    () => wc.setSitePort('totally-unknown-app', 5202),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      assert.match(err.message, /not mapped in workspace\.json/);
      assert.match(err.message, /descix app init/);
      assert.match(err.message, /descix app set-localpath/);
      return true;
    }
  );
});

test('setSitePort — platform app: port saved to env.platform.site.port', async (t) => {
  const { wsRoot, platformAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setSitePort(platformAppId, 5174);

  const reloaded = await WorkspaceConfig.load(wsRoot);
  assert.equal(reloaded.env.platform?.site?.port, 5174, 'platform site.port must be persisted');
});
