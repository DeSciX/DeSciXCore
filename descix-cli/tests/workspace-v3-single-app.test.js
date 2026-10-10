/**
 * Workspace v3 — single-app format (CEO 2026-10-09 "we are better off revising the
 * workspace.json to be single app"; fork (b) chosen 2026-10-10: the gateway takes a LIST of
 * app-repo roots, each repo a single-app workspace).
 *
 * The contract under test:
 *  - a v3 file (`version: "3.0"`, `env.app`) loads; `getAppByAppId` answers for THE app
 *    (localPath '.', absolutePath == workspace root) and null for any other id
 *  - a v2.1 MULTI-APP file (`env.platform` / `env.products`) hard-errors in the loader naming
 *    the migration (re-run `descix app init` in each app repo), exactly as v1 does — no
 *    silent partial read, file untouched
 *  - save() round-trips v3 and never writes env.platform / env.products
 *  - registerApp on an empty workspace creates env.app; a SECOND app id refuses loudly
 *    (single-app is the format, not a convention)
 *  - setStaticSite / setMicroservicePort keep their APIs, operating on env.app
 *  - assertNoParentWorkspace: `app init` refuses when an ANCESTOR directory holds a workspace —
 *    a nested checkout must never silently register into the parent (the measured trap,
 *    appInit tryLoad walk-up)
 *
 * Run: `node --test tests/workspace-v3-single-app.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig, assertNoParentWorkspace } from '../lib/workspace-config.js';

const V3 = {
  version: '3.0',
  env: {
    environment: 'PROD',
    apiUrl: 'https://descix.net',
    gateway: { port: 5173 },
    app: {
      appId: 'egpt-frqtl',
      communityId: 'egpt',
      kbId: 'General',
      site: { static: 'site/dist' },
      microservice: { port: 4100 },
    },
  },
};

async function writeWorkspace(dir, obj) {
  await fs.mkdir(path.join(dir, '.descix'), { recursive: true });
  await fs.writeFile(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(obj, null, 2));
}

async function tmpdir(t, prefix) {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rm(d, { recursive: true, force: true }));
  return d;
}

test('v3 loads; getAppByAppId answers for THE app and null otherwise', async (t) => {
  const wsRoot = await tmpdir(t, 'descix-v3-load-');
  await writeWorkspace(wsRoot, V3);
  const cfg = await WorkspaceConfig.load(wsRoot);
  const app = cfg.getAppByAppId('egpt-frqtl');
  assert.ok(app, 'the single app resolves');
  assert.equal(app.localPath, '.');
  assert.equal(path.resolve(app.absolutePath), path.resolve(wsRoot), 'app root IS the workspace root');
  assert.equal(app.communityId, 'egpt');
  assert.equal(app.kbId, 'General');
  assert.equal(cfg.getAppByAppId('daita'), null, 'any other id is not here');
});

test('v2.1 multi-app (env.platform/env.products) hard-errors naming the v3 migration', async (t) => {
  const wsRoot = await tmpdir(t, 'descix-v3-refuse21-');
  await writeWorkspace(wsRoot, {
    version: '2.1',
    env: {
      environment: 'DEV',
      apiUrl: 'https://dev.descix.net',
      platform: { appId: 'daita', localPath: 'DeSciX/DeSciX_Cloud' },
      products: [{ appId: 'powch', localPath: 'DeSciX/DeSciX_Powch' }],
    },
  });
  const before = await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8');
  await assert.rejects(
    () => WorkspaceConfig.load(wsRoot),
    (err) => {
      assert.match(err.message, /v2\.1 multi-app workspace format is not supported/i);
      assert.match(err.message, /descix app init/, 'remedy names the per-repo re-init');
      assert.match(err.message, /workspace\.json/, 'names the file');
      return true;
    }
  );
  const after = await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8');
  assert.equal(after, before, 'refusal leaves the file untouched');
});

test('a v2.1 file with ONLY env.products (single app mapped elsewhere) also refuses — the mapping model itself is retired', async (t) => {
  const wsRoot = await tmpdir(t, 'descix-v3-refuse21b-');
  await writeWorkspace(wsRoot, {
    version: '2.1',
    env: { environment: 'PROD', apiUrl: 'https://descix.net', products: [{ appId: 'egpt-frqtl', localPath: '.' }] },
  });
  await assert.rejects(() => WorkspaceConfig.load(wsRoot), /v2\.1 multi-app workspace format is not supported/i);
});

test('save() round-trips v3 and writes no platform/products keys', async (t) => {
  const wsRoot = await tmpdir(t, 'descix-v3-save-');
  await writeWorkspace(wsRoot, V3);
  const cfg = await WorkspaceConfig.load(wsRoot);
  await cfg.save(wsRoot);
  const raw = JSON.parse(await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8'));
  assert.equal(raw.version, '3.0');
  assert.equal(raw.env.app.appId, 'egpt-frqtl');
  assert.equal(raw.env.app.site.static, 'site/dist');
  assert.equal(raw.env.app.microservice.port, 4100);
  assert.ok(!('platform' in raw.env), 'no env.platform in v3 output');
  assert.ok(!('products' in raw.env), 'no env.products in v3 output');
  const reloaded = await WorkspaceConfig.load(wsRoot);
  assert.ok(reloaded.getAppByAppId('egpt-frqtl'));
});

test('registerApp creates env.app once; a second app id refuses loudly', async (t) => {
  const wsRoot = await tmpdir(t, 'descix-v3-register-');
  const cfg = new WorkspaceConfig({ version: '3.0', env: { environment: 'PROD', apiUrl: 'https://descix.net' } }, wsRoot);
  cfg.registerApp('egpt', 'egpt-frqtl', { kbId: 'General' });
  await cfg.save(wsRoot);
  const reloaded = await WorkspaceConfig.load(wsRoot);
  assert.equal(reloaded.getAppByAppId('egpt-frqtl').communityId, 'egpt');
  assert.throws(
    () => reloaded.registerApp('egpt', 'egpt-other', { kbId: 'General' }),
    /single-app|already holds/i,
    'a v3 workspace holds exactly one app'
  );
  // Re-registering the SAME app is idempotent, not an error (app init re-run).
  reloaded.registerApp('egpt', 'egpt-frqtl', { kbId: 'General' });
});

test('setStaticSite / setMicroservicePort operate on env.app and persist', async (t) => {
  const wsRoot = await tmpdir(t, 'descix-v3-setters-');
  await writeWorkspace(wsRoot, V3);
  const cfg = await WorkspaceConfig.load(wsRoot);
  await cfg.setMicroservicePort('egpt-frqtl', 4321);
  await cfg.setStaticSite('egpt-frqtl', { static: 'dist' });
  const raw = JSON.parse(await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8'));
  assert.equal(raw.env.app.microservice.port, 4321);
  assert.equal(raw.env.app.site.static, 'dist');
  const cfg2 = await WorkspaceConfig.load(wsRoot);
  await assert.rejects(
    async () => cfg2.setMicroservicePort('not-this-app', 5000),
    /not-this-app/,
    'setters refuse an id that is not THE app'
  );
});

test('assertNoParentWorkspace: a workspace at an ANCESTOR refuses app init in a nested dir', async (t) => {
  const parent = await tmpdir(t, 'descix-v3-parent-');
  await writeWorkspace(parent, V3);
  const nested = path.join(parent, 'checkouts', 'my-new-app');
  await fs.mkdir(nested, { recursive: true });
  await assert.rejects(
    () => assertNoParentWorkspace(nested),
    (err) => {
      assert.match(err.message, /nested/i, 'names the nesting trap');
      assert.ok(err.message.includes(parent), 'names the parent workspace root');
      return true;
    }
  );
  // At the workspace root itself there is no PARENT workspace — allowed (re-init case).
  await assertNoParentWorkspace(parent);
  // And a clean standalone dir passes.
  const clean = await tmpdir(t, 'descix-v3-clean-');
  await assertNoParentWorkspace(clean);
});

test('tryLoad THROWS on a RETIRED format (v1, v2.1-multi) — retired is not ABSENT', async (t) => {
  // Measured 2026-10-10 (CEO-COMMS, five app repos): a v2.1 file under cli 2.0.0 printed
  // "env: prod (default — no workspace config)" — the refusal threw a PLAIN Error, tryLoad
  // swallowed it to null, and a stale-but-present workspace silently resolved to the DEFAULT
  // origin. "There is no workspace here" and "the workspace here is in a retired format" are
  // different answers, and only the first is a soft no — same doctrine as UNREADABLE.
  const wsRoot = await tmpdir(t, 'descix-v3-tryload21-');
  await writeWorkspace(wsRoot, {
    version: '2.1',
    env: { environment: 'PROD', apiUrl: 'https://descix.net', products: [{ appId: 'egpt-frqtl', localPath: '.' }] },
  });
  await assert.rejects(() => WorkspaceConfig.tryLoad(wsRoot), /v2\.1 multi-app workspace format is not supported/i);

  const v1Root = await tmpdir(t, 'descix-v3-tryload1-');
  await writeWorkspace(v1Root, { communities: { egpt: {} } });
  await assert.rejects(() => WorkspaceConfig.tryLoad(v1Root), /v1 workspace format is not supported/i);

  // Genuinely ABSENT stays a soft null.
  const empty = await tmpdir(t, 'descix-v3-tryloadnone-');
  assert.equal(await WorkspaceConfig.tryLoad(empty), null);
});
