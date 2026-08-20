/**
 * Tests for `workspaceProductsPlugin()` — the @descix/app-sdk/dev Vite plugin that
 * live-refreshes the app-store product map (__WORKSPACE_PRODUCTS__) in a RUNNING app
 * dev server when .descix/workspace.json changes, with NO dev-server restart.
 * (WS-SSGPOD task 1 / CEO-D-2026-06-02-EVP-NO-APPDEV-CLI-PLUS-DEV-URL.)
 *
 * Mechanism under test:
 *   - The plugin watches workspace.json.
 *   - On a change that alters the product map, it sends a custom Vite HMR event
 *     (`descix:workspace-products`) over server.hot with the fresh product map.
 *   - It also exposes a virtual module (client runtime) and a resolveId/load pair.
 *
 * This test proves the SERVER side end-to-end against a SYNTHETIC temp workspace
 * (NOT descix-ssgpod): it stands up the plugin with a fake Vite server whose
 * `hot.send` is a spy, adds a product site to the temp workspace.json, and asserts
 * the plugin pushes a `descix:workspace-products` event carrying the new product —
 * i.e. the running PWA would receive the live update without restarting.
 *
 * Run: `node --test tests/workspace-products-hmr.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { EventEmitter } from 'node:events';
import {
  workspaceProductsPlugin,
  WORKSPACE_PRODUCTS_VIRTUAL_ID,
  WORKSPACE_PRODUCTS_HMR_EVENT,
  buildWorkspaceProducts,
  createViteProxyConfig,
} from '@descix/app-sdk/dev';

async function makeTempWorkspace(t, env) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-wshmr-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await writeWorkspace(wsRoot, env);
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return wsRoot;
}

async function writeWorkspace(wsRoot, env) {
  const workspace = { version: '2.1', workspaceRoot: wsRoot, type: 'workspace', env };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );
}

/** Fake Vite server with a hot.send spy and an httpServer EventEmitter. */
function makeFakeServer() {
  const sent = [];
  const httpServer = new EventEmitter();
  return {
    sent,
    httpServer,
    hot: { send: (msg) => sent.push(msg) },
  };
}

async function waitFor(predicate, { timeoutMs = 4000, intervalMs = 25 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────

test('workspaceProductsPlugin — exposes the virtual module via resolveId/load', async (t) => {
  const wsRoot = await makeTempWorkspace(t, {
    platform: { appId: 'daita', localPath: 'p', site: { port: 5174 } },
    products: [],
  });
  const plugin = workspaceProductsPlugin(wsRoot);

  const resolved = plugin.resolveId(WORKSPACE_PRODUCTS_VIRTUAL_ID);
  assert.ok(resolved, 'resolveId must resolve the virtual id');
  const code = plugin.load(resolved);
  assert.match(code, /import\.meta\.hot/, 'client runtime must be hot-guarded');
  assert.match(code, new RegExp(WORKSPACE_PRODUCTS_HMR_EVENT), 'client runtime must listen for the HMR event');
  assert.match(code, /setWorkspaceProducts/, 'client runtime must call AppData.setWorkspaceProducts');

  // apply:'serve' — dev only
  assert.equal(plugin.apply, 'serve');
});

test('workspaceProductsPlugin — pushes a live HMR update when a product site is ADDED to workspace.json', async (t) => {
  // Start with only the platform; no products yet.
  const wsRoot = await makeTempWorkspace(t, {
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [],
  });

  const plugin = workspaceProductsPlugin(wsRoot, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  // Now ADD a product with a static site (what `descix app set-site` would do).
  await writeWorkspace(wsRoot, {
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [{ appId: 'descix-synthpod', localPath: 'synthpod', site: { static: 'site' } }],
  });

  const got = await waitFor(() => server.sent.length > 0);
  assert.ok(got, 'plugin must push an HMR message after workspace.json changes');

  const msg = server.sent.find((m) => m.event === WORKSPACE_PRODUCTS_HMR_EVENT);
  assert.ok(msg, 'must send the descix:workspace-products custom event');
  assert.equal(msg.type, 'custom');
  assert.ok(msg.data?.products, 'event payload must carry the product map');
  // The new product must now resolve to the gateway static route /p/{appId}.
  assert.equal(
    msg.data.products['descix-synthpod'],
    'https://localhost:5173/p/descix-synthpod',
    'newly-added static product must appear in the pushed map at the gateway route'
  );

});

test('workspaceProductsPlugin — does NOT push when the change does not alter the product map', async (t) => {
  const wsRoot = await makeTempWorkspace(t, {
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [{ appId: 'descix-synthpod', localPath: 'synthpod', site: { static: 'site' } }],
  });

  const plugin = workspaceProductsPlugin(wsRoot, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  // Rewrite the SAME product map (add an unrelated, non-product field).
  await writeWorkspace(wsRoot, {
    gateway: { port: 5173 }, // does not change the product URLs (5173 is the default anyway)
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [{ appId: 'descix-synthpod', localPath: 'synthpod', site: { static: 'site' } }],
  });

  // Give the watcher a chance to (not) fire.
  await new Promise((r) => setTimeout(r, 300));
  const pushed = server.sent.filter((m) => m.event === WORKSPACE_PRODUCTS_HMR_EVENT);
  assert.equal(pushed.length, 0, 'no HMR push when the resolved product map is unchanged');
});

test('workspaceProductsPlugin — a dev-server PORT change does not churn the shell map; the gateway absorbs it', async (t) => {
  // This test previously asserted the opposite ('changing a dev-server port must
  // push a live update', with the map carrying https://localhost:6002). That was
  // true only while the shell was handed the app's OWN origin — the G-1 defect
  // that broke SplitView cross-origin. The map now carries the GATEWAY URL for
  // dev-server products, which is deliberately STABLE across upstream port moves:
  // the gateway restarts on the same workspace change and re-points /p/{appId} at
  // the new port (gateway.js watchWorkspaceConfig -> buildGatewayProxy -> restart),
  // so the browser-facing URL never has to change. Not pushing is the CORRECT
  // behaviour here, and the shell is strictly quieter for it.
  const wsRoot = await makeTempWorkspace(t, {
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [{ appId: 'descix-devsrv', localPath: 'devsrv', site: { port: 6001 } }],
  });

  const plugin = workspaceProductsPlugin(wsRoot, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  const before = buildWorkspaceProducts(wsRoot)['descix-devsrv'];
  assert.equal(before, 'https://localhost:5173/p/descix-devsrv');

  await writeWorkspace(wsRoot, {
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [{ appId: 'descix-devsrv', localPath: 'devsrv', site: { port: 6002 } }],
  });

  await new Promise((r) => setTimeout(r, 300));
  const pushed = server.sent.filter((m) => m.event === WORKSPACE_PRODUCTS_HMR_EVENT);
  assert.equal(pushed.length, 0, 'the browser-facing URL is unchanged, so there is nothing to push');
  assert.equal(buildWorkspaceProducts(wsRoot)['descix-devsrv'], before);
});

test('workspaceProductsPlugin — the port change is NOT lost: the gateway proxy follows it', async (t) => {
  // The other half of the contract above. If the map stops carrying the port, the
  // port must still reach the thing that actually needs it — the proxy target —
  // or the change is silently dropped and the app 502s behind a stable URL.
  const wsRoot = await makeTempWorkspace(t, {
    platform: { appId: 'daita', localPath: 'platform', site: { port: 5174 } },
    products: [{ appId: 'descix-devsrv', localPath: 'devsrv', site: { port: 6002 } }],
  });

  const config = JSON.parse(await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8'));
  const proxy = createViteProxyConfig(wsRoot, config, { apiGatewayUrl: 'https://dev.descix.net' });
  assert.equal(proxy['/p/descix-devsrv'].target, 'https://localhost:6002');
});
