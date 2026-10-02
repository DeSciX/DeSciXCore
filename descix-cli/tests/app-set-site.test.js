/**
 * Tests for `WorkspaceConfig.setStaticSite()` — the method that backs
 * `descix app set-site`. Parallel to setMicroservicePort() and app-set-port.test.js.
 *
 * Closes the site.static workspace gap (WS-SSGPOD, CEO-D-2026-06-02-SSGPOD-SITE-PREPROD):
 * this is the canonical write path for the `site.static` relative path that the dev
 * gateway's staticSitePlugin serves at /p/{appId}/. Mirrors app-set-port.test.js,
 * operating on site.{static,port} instead of microservice.{port}.
 *
 * Coverage:
 *  - happy path: set site.static → workspace.json env.products[<app>].site.static persisted
 *  - combined: set static + port together (explicit combined write keeps both)
 *  - ONE ACTIVE MODE PER WRITE (measured 2026-10-02, EGPT-Evidence: --port then --static left
 *    both fields and the gateway silently served the dead dev-server port):
 *      - setting static alone CLEARS site.port and site.protocol
 *      - setting port alone CLEARS site.static
 *  - site.protocol: set with port, validated ("http"|"https" only), refused without a port,
 *    cleared on mode switch to static and on unset
 *  - disable case: static:null removes site.static; empty site.{} cleaned up
 *  - disable case: static:null + port:null + protocol:null on app with no site.{} does not throw
 *  - hard-fail: unmapped app → throws with canonical error (not TypeError)
 *  - platform app: setStaticSite works for env.platform entry as well
 *  - anti-regression: WorkspaceConfig exposes setStaticSite as a function
 *
 * Design: operates directly against WorkspaceConfig using a temp workspace.
 * Never touches the real ~/.descix/workspace.json.
 *
 * Run: `node --test tests/app-set-site.test.js` from descix-cli/.
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
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-setsite-'));
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

test('setStaticSite — happy path: site.static saved to env.products[app].site.static', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { static: 'site' });

  // Reload from disk and verify persistence
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.ok(product, 'product entry must exist');
  assert.equal(product.site?.static, 'site', 'site.static must be "site" after save');
});

test('setStaticSite — combined: static + port set together', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { static: '.', port: 4321 });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.static, '.', 'site.static must be "." after save');
  assert.equal(product.site?.port, 4321, 'site.port must be 4321 after save');
});

test('setStaticSite — disable case: static:null removes site.static and cleans up empty site.{}', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  // First set static
  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { static: 'site' });

  // Then remove it
  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setStaticSite(productAppId, { static: null });

  // Reload and verify site.static is gone and site.{} is cleaned up
  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.ok(product, 'product entry must still exist');
  assert.equal(product.site, undefined, 'site.{} must be deleted when empty after static removal');
});

test('setStaticSite — disable case: static:null + port:null on app with no site.{} does not throw', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  // No site.{} set yet — must not throw
  await assert.doesNotReject(
    () => wc.setStaticSite(productAppId, { static: null, port: null }),
    'setStaticSite(null,null) on app with no site must not throw'
  );
});

test('ONE ACTIVE MODE PER WRITE — the measured sequence (--port then --static) leaves STATIC only', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  // The measured defect sequence (EGPT-Evidence, 2026-10-02): author on a dev server...
  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { port: 5612 });

  // ...then preview the build via --static. Pre-fix this kept BOTH fields and the gateway
  // silently proxied /p/{app} to the (now dead) dev-server port.
  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setStaticSite(productAppId, { static: 'site' });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.static, 'site', 'site.static must be set');
  assert.equal(product.site?.port, undefined, 'site.port must be CLEARED by the static write (one active mode per write)');
  assert.equal(product.site?.protocol, undefined, 'site.protocol must be cleared with the dev-server mode');
});

test('ONE ACTIVE MODE PER WRITE — setting port alone clears an existing site.static', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { static: 'site' });

  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setStaticSite(productAppId, { port: 5612 });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.port, 5612, 'site.port must be set');
  assert.equal(product.site?.static, undefined, 'site.static must be CLEARED by the port write (one active mode per write)');
});

test('explicit combined write (static + port in ONE call) keeps both fields', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { static: 'site', port: 5612 });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.static, 'site', 'combined write keeps site.static');
  assert.equal(product.site?.port, 5612, 'combined write keeps site.port');
});

test('site.protocol — set with port, persisted; cleared on mode switch to static', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { port: 5612, protocol: 'http' });

  let reloaded = await WorkspaceConfig.load(wsRoot);
  let product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.protocol, 'http', 'site.protocol must be persisted');
  assert.equal(product.site?.port, 5612, 'site.port must be persisted');

  // Mode switch to static clears port AND protocol
  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setStaticSite(productAppId, { static: 'site' });

  reloaded = await WorkspaceConfig.load(wsRoot);
  product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.protocol, undefined, 'site.protocol must be cleared on mode switch to static');
  assert.equal(product.site?.port, undefined, 'site.port must be cleared on mode switch to static');
});

test('site.protocol — invalid value refused loud, nothing written', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    () => wc.setStaticSite(productAppId, { port: 5612, protocol: 'ftp' }),
    /site\.protocol must be "http" or "https"/
  );

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site, undefined, 'a refused write must persist nothing');
});

test('site.protocol — refused without a port (protocol describes the dev-server upstream)', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    () => wc.setStaticSite(productAppId, { protocol: 'http' }),
    /only valid in dev-server mode/
  );

  // And the static+protocol contradiction is refused too (static clears the port lane).
  const wc2 = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    () => wc2.setStaticSite(productAppId, { static: 'site', protocol: 'http' }),
    /only valid in dev-server mode/
  );
});

test('site.protocol — allowed alone when site.port already exists', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { port: 5612 });

  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setStaticSite(productAppId, { protocol: 'http' });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site?.port, 5612, 'existing site.port preserved');
  assert.equal(product.site?.protocol, 'http', 'site.protocol set onto the existing dev-server config');
});

test('unset — static:null + port:null + protocol:null clears the whole site.{} slot', async (t) => {
  const { wsRoot, productAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(productAppId, { port: 5612, protocol: 'http' });

  const wc2 = await WorkspaceConfig.load(wsRoot);
  await wc2.setStaticSite(productAppId, { static: null, port: null, protocol: null });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  const product = reloaded.env.products.find(p => p.appId === productAppId);
  assert.equal(product.site, undefined, 'site.{} must be fully removed by unset');
});

test('setStaticSite — hard-fail: unmapped app throws with canonical error text', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    () => wc.setStaticSite('totally-unknown-app', { static: 'site' }),
    (err) => {
      assert.ok(!(err instanceof TypeError), 'must not be a TypeError');
      assert.match(err.message, /not mapped in workspace\.json/);
      assert.match(err.message, /descix app init/);
      assert.match(err.message, /descix app set-localpath/);
      return true;
    }
  );
});

test('setStaticSite — platform app: site.static saved to env.platform.site.static', async (t) => {
  const { wsRoot, platformAppId } = await makeTestWorkspace(t);

  const wc = await WorkspaceConfig.load(wsRoot);
  await wc.setStaticSite(platformAppId, { static: 'site' });

  const reloaded = await WorkspaceConfig.load(wsRoot);
  assert.equal(reloaded.env.platform?.site?.static, 'site', 'platform site.static must be persisted');
});

test('anti-regression: WorkspaceConfig exposes setStaticSite as a function', async (t) => {
  const { wsRoot } = await makeTestWorkspace(t);
  const wc = await WorkspaceConfig.load(wsRoot);
  assert.equal(
    typeof wc.setStaticSite,
    'function',
    'WorkspaceConfig.setStaticSite must exist (backs `descix app set-site` / WS-SSGPOD site.static gap)'
  );
});
