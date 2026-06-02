/**
 * Tests for `resolveAppGatewayUrl()` — the SDK resolver that backs `descix app open`.
 * (WS-SSGPOD dev-URL command.)
 *
 * resolveAppGatewayUrl(workspaceRoot, appId) returns the LOCAL GATEWAY URL that
 * `descix serve` would route the app at — the same workspace.json read path behind
 * buildWorkspaceProducts() that the PWA bakes into __WORKSPACE_PRODUCTS__, so the URL
 * matches what the app store routes to.
 *
 * Coverage:
 *  - static site   → https://localhost:{gatewayPort}/p/{appId}
 *  - dev-server site → https://localhost:{gatewayPort}/p/{appId} (gateway proxies the port)
 *  - platform app  → https://localhost:{gatewayPort}/  (root)
 *  - custom gateway port (env.gateway.port) is honored
 *  - hard-fail: unmapped app → throws (not TypeError)
 *  - hard-fail: mapped app with NO site config → throws (not TypeError)
 *
 * Design: operates against a temp workspace; never touches the real workspace.json.
 * Run: `node --test tests/app-open.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { resolveAppGatewayUrl } from '@descix/app-sdk/dev';

/**
 * Build a temp workspace with: a platform app, a static-site product, a
 * dev-server product, and a no-site product.
 */
async function makeTestWorkspace(t, { gatewayPort } = {}) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-appopen-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });

  const env = {
    platform: { appId: 'daita', localPath: 'my-platform', kbId: 'General', site: { port: 5174 } },
    products: [
      { appId: 'descix-ssgpod', localPath: 'ssgpod', kbId: 'General', site: { static: 'site' } },
      { appId: 'descix-devsrv', localPath: 'devsrv', kbId: 'General', site: { port: 6001 } },
      { appId: 'descix-nosite', localPath: 'nosite', kbId: 'General' },
    ],
  };
  if (gatewayPort) env.gateway = { port: gatewayPort };

  const workspace = { version: '2.1', workspaceRoot: wsRoot, type: 'workspace', env };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return { wsRoot };
}

// ─────────────────────────────────────────────────────────────────────────────

test('resolveAppGatewayUrl — static site → /p/{appId} on default gateway port 5173', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  const r = resolveAppGatewayUrl(wsRoot, 'descix-ssgpod');
  assert.equal(r.url, 'https://localhost:5173/p/descix-ssgpod');
  assert.equal(r.kind, 'static');
  assert.equal(r.gatewayPort, 5173);
});

test('resolveAppGatewayUrl — dev-server site → /p/{appId} (gateway proxies the port)', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  const r = resolveAppGatewayUrl(wsRoot, 'descix-devsrv');
  assert.equal(r.url, 'https://localhost:5173/p/descix-devsrv');
  assert.equal(r.kind, 'dev-server');
  assert.match(r.via, /localhost:6001/, 'via must reference the proxied dev-server origin port');
});

test('resolveAppGatewayUrl — platform app → gateway root', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  const r = resolveAppGatewayUrl(wsRoot, 'daita');
  assert.equal(r.url, 'https://localhost:5173/');
  assert.equal(r.kind, 'platform');
});

test('resolveAppGatewayUrl — honors custom env.gateway.port', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t, { gatewayPort: 4999 });
  const r = resolveAppGatewayUrl(wsRoot, 'descix-ssgpod');
  assert.equal(r.url, 'https://localhost:4999/p/descix-ssgpod');
  assert.equal(r.gatewayPort, 4999);
});

test('resolveAppGatewayUrl — hard-fail: unmapped app throws (not TypeError)', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  assert.throws(
    () => resolveAppGatewayUrl(wsRoot, 'totally-unknown-app'),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      assert.match(err.message, /not mapped in workspace\.json/);
      return true;
    }
  );
});

test('resolveAppGatewayUrl — hard-fail: mapped app with no site config throws (not TypeError)', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  assert.throws(
    () => resolveAppGatewayUrl(wsRoot, 'descix-nosite'),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      assert.match(err.message, /no site config/);
      return true;
    }
  );
});

test('resolveAppGatewayUrl — hard-fail: missing workspace.json throws', async (t) => {
  const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-nows-'));
  t.after(async () => { await fs.rm(emptyDir, { recursive: true, force: true }); });
  assert.throws(
    () => resolveAppGatewayUrl(emptyDir, 'daita'),
    /No \.descix\/workspace\.json found/
  );
});
