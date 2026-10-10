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
import { makeV3Tree } from './tools/v3-tree.mjs';

/**
 * A v3 gateway tree: the gateway workspace lists sibling app repos, each holding its OWN
 * single-app workspace.json. `repos` are all WRITTEN; `gateway` decides which are LISTED — the
 * plugin's product map is whatever resolveWorkspaceApps makes of the listing.
 */
async function makeTempWorkspace(t, { repos, gateway }) {
  const tree = await makeV3Tree(t, { repos, gateway });
  return tree;
}

/** Re-write ONLY the gateway workspace's env.gateway block (what editing the listing does). */
async function writeGateway(dir, gateway) {
  const file = path.join(dir, '.descix', 'workspace.json');
  const doc = JSON.parse(await fs.readFile(file, 'utf8'));
  doc.env.gateway = gateway;
  await fs.writeFile(file, JSON.stringify(doc, null, 2));
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

const DAITA = { appId: 'daita', site: { port: 5174 } };
const SYNTHPOD = { appId: 'descix-synthpod', site: { static: 'site' } };
const DEVSRV = (port) => ({ appId: 'descix-devsrv', site: { port } });

test('workspaceProductsPlugin — exposes the virtual module via resolveId/load', async (t) => {
  const { dir } = await makeTempWorkspace(t, { repos: { daita: DAITA }, gateway: { shell: 'daita' } });
  const plugin = workspaceProductsPlugin(dir);
  const resolved = plugin.resolveId(WORKSPACE_PRODUCTS_VIRTUAL_ID);
  assert.ok(resolved, 'resolveId must resolve the virtual id');
  const code = plugin.load(resolved);
  assert.match(code, /import\.meta\.hot/, 'client runtime must be hot-guarded');
  assert.match(code, new RegExp(WORKSPACE_PRODUCTS_HMR_EVENT), 'client runtime must listen for the HMR event');
  assert.match(code, /setWorkspaceProducts/, 'client runtime must call AppData.setWorkspaceProducts');

  // apply:'serve' — dev only
  assert.equal(plugin.apply, 'serve');
});

test('workspaceProductsPlugin — pushes a live HMR update when an app repo is ADDED to the gateway listing', async (t) => {
  // Start with only the shell listed; the synthpod repo exists on disk but is not served yet.
  const { dir } = await makeTempWorkspace(t, {
    repos: { daita: DAITA, synthpod: SYNTHPOD },
    gateway: { shell: 'daita' },
  });

  const plugin = workspaceProductsPlugin(dir, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  // Now LIST the repo (what adding it to env.gateway.appRepos does).
  await writeGateway(dir, { shell: '../daita', appRepos: ['../synthpod'] });

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
    'newly-listed static product must appear in the pushed map at the gateway route'
  );
});

test('workspaceProductsPlugin — does NOT push when the change does not alter the product map', async (t) => {
  const { dir } = await makeTempWorkspace(t, {
    repos: { daita: DAITA, synthpod: SYNTHPOD },
    gateway: { shell: 'daita', appRepos: ['synthpod'] },
  });

  const plugin = workspaceProductsPlugin(dir, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  // Rewrite the SAME listing plus an unrelated field.
  await writeGateway(dir, { port: 5173, shell: '../daita', appRepos: ['../synthpod'] }); // 5173 is the default anyway

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
  const { dir, repos } = await makeTempWorkspace(t, {
    repos: { daita: DAITA, devsrv: DEVSRV(6001), synthpod: SYNTHPOD },
    gateway: { shell: 'daita', appRepos: ['devsrv'] },
  });

  const plugin = workspaceProductsPlugin(dir, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  const before = buildWorkspaceProducts(dir)['descix-devsrv'];
  assert.equal(before, 'https://localhost:5173/p/descix-devsrv');

  // Move the dev server's port in the APP REPO's own workspace.json, then touch the gateway
  // workspace (same listing) so the watcher definitely runs against the moved port.
  await fs.writeFile(
    path.join(repos.devsrv, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', env: { app: DEVSRV(6002) } }, null, 2)
  );
  await writeGateway(dir, { port: 5173, shell: '../daita', appRepos: ['../devsrv'] });

  await new Promise((r) => setTimeout(r, 300));
  const pushed = server.sent.filter((m) => m.event === WORKSPACE_PRODUCTS_HMR_EVENT);
  assert.equal(pushed.length, 0, 'the browser-facing URL is unchanged, so there is nothing to push');
  assert.equal(buildWorkspaceProducts(dir)['descix-devsrv'], before);

  // POSITIVE CONTROL: the watcher is alive and the quiet above was a verdict, not deafness —
  // listing one more repo DOES push.
  await writeGateway(dir, { port: 5173, shell: '../daita', appRepos: ['../devsrv', '../synthpod'] });
  assert.ok(await waitFor(() => server.sent.length > 0), 'control: a real map change must still push');
});

test('workspaceProductsPlugin — the port change is NOT lost: the gateway proxy follows it', async (t) => {
  // The other half of the contract above. If the map stops carrying the port, the
  // port must still reach the thing that actually needs it — the proxy target —
  // or the change is silently dropped and the app 502s behind a stable URL.
  const { dir } = await makeTempWorkspace(t, {
    repos: { daita: DAITA, devsrv: DEVSRV(6002) },
    gateway: { shell: 'daita', appRepos: ['devsrv'] },
  });

  const proxy = createViteProxyConfig(dir, { apiGatewayUrl: 'https://dev.descix.net' });
  assert.equal(proxy['/p/descix-devsrv'].target, 'https://localhost:6002');
});

test('workspaceProductsPlugin — a LISTED repo changing its own site config pushes a live update (fork (b) gap)', async (t) => {
  // v3 moved the site config into each app repo's OWN workspace.json (`descix app set-site`
  // writes THERE), so a watcher that only sees the gateway's .descix directory goes deaf to
  // exactly the write the plugin exists for. This gate holds the fix: the plugin watches every
  // listed repo's workspace.json too.
  const { dir, repos } = await makeTempWorkspace(t, {
    repos: { daita: DAITA, devsrv: DEVSRV(6001) },
    gateway: { shell: 'daita', appRepos: ['devsrv'] },
  });

  const plugin = workspaceProductsPlugin(dir, { debounceMs: 30 });
  const server = makeFakeServer();
  plugin.configureServer(server);
  t.after(() => server.httpServer.emit('close'));

  // The app FLIPS MODE in its own repo: dev server → static build. The gateway file is
  // untouched; the browser-facing map changes (the /p route stays, but a NEW product appears
  // if the app previously had no site — use that sharper shape: devsrv DROPS its site).
  await fs.writeFile(
    path.join(repos.devsrv, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', env: { app: { appId: 'descix-devsrv' } } }, null, 2)
  );

  const got = await waitFor(() => server.sent.some((m) => m.event === WORKSPACE_PRODUCTS_HMR_EVENT));
  assert.ok(got, 'a listed repo changing its own workspace.json must push — the gateway file never moved');
  const msg = server.sent.find((m) => m.event === WORKSPACE_PRODUCTS_HMR_EVENT);
  assert.ok(!(msg.data.products && msg.data.products['descix-devsrv']), 'the app that dropped its site must leave the map');
});

test('watchWorkspaceConfig — fires on a LISTED repo\'s own workspace.json change, and re-arms when the listing grows', async (t) => {
  const { watchWorkspaceConfig } = await import('@descix/app-sdk/dev');
  const { dir, repos } = await makeTempWorkspace(t, {
    repos: { daita: DAITA, devsrv: DEVSRV(6001), synthpod: SYNTHPOD },
    gateway: { shell: 'daita', appRepos: ['devsrv'] },
  });

  const calls = [];
  const watcher = watchWorkspaceConfig(dir, (cfg) => calls.push(cfg), { debounceMs: 30 });
  t.after(() => watcher.close());

  // 1. A listed repo's own file changes → onChange fires (the gateway restarts its proxy).
  await fs.writeFile(
    path.join(repos.devsrv, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', env: { app: DEVSRV(6002) } }, null, 2)
  );
  assert.ok(await waitFor(() => calls.length >= 1), 'listed-repo change must fire onChange');

  // 2. The GATEWAY file lists one more repo → onChange fires AND the watcher re-arms so the
  // newly listed repo is covered too.
  await writeGateway(dir, { port: 5173, shell: '../daita', appRepos: ['../devsrv', '../synthpod'] });
  assert.ok(await waitFor(() => calls.length >= 2), 'gateway-listing change must fire onChange');

  const n = calls.length;
  await fs.writeFile(
    path.join(repos.synthpod, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', env: { app: { appId: 'descix-synthpod', site: { static: 'dist' } } } }, null, 2)
  );
  assert.ok(await waitFor(() => calls.length > n), 'the NEWLY listed repo must be watched after the re-arm');
});
