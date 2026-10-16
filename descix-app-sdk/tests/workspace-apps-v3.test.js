/**
 * resolveWorkspaceApps — the ONE owner of "which apps does this workspace serve locally,
 * and from where" under workspace v3 fork (b):
 *
 *  - env.app            → this repo's own app (role 'self', dir = the workspace root)
 *  - env.gateway.shell  → the repo whose app the gateway serves at ROOT (role 'shell')
 *  - env.gateway.appRepos[] → sibling app repos served at /p/{appId} (role 'repo')
 *
 * Each listed path must hold its OWN v3 single-app workspace — that file is the authority
 * on the app's id, site and microservice; the gateway workspace never restates them
 * (restating is the mirror drift the v2.1 registry suffered from).
 *
 * Gates:
 *  - self only: one entry from env.app
 *  - gateway: shell + appRepos each loaded from their OWN workspace.json
 *  - a listed repo with NO workspace → loud refusal naming the path and the remedy
 *  - a listed repo whose workspace holds NO env.app → loud refusal
 *  - duplicate appIds across entries → loud refusal
 *  - absolute appRepos path → loud refusal (portability, same rule as localPath)
 *
 * Run: node --test tests/workspace-apps-v3.test.js  (from descix-app-sdk/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { resolveWorkspaceApps } from '../src/dev/workspaceApps.js';

async function writeWs(dir, env) {
  await fs.mkdir(path.join(dir, '.descix'), { recursive: true });
  await fs.writeFile(
    path.join(dir, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', env }, null, 2)
  );
}

async function tmp(t, prefix) {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rm(d, { recursive: true, force: true }));
  return d;
}

test('self only: env.app yields one entry rooted at the workspace', async (t) => {
  const root = await tmp(t, 'wsapps-self-');
  await writeWs(root, {
    environment: 'PROD', apiUrl: 'https://descix.net',
    app: { appId: 'egpt-frqtl', communityId: 'egpt', site: { static: 'site/dist' }, microservice: { port: 4100 } },
  });
  const bag = resolveWorkspaceApps(root);
  assert.equal(bag.apps.length, 1);
  const a = bag.apps[0];
  assert.equal(a.appId, 'egpt-frqtl');
  assert.equal(a.role, 'self');
  assert.equal(path.resolve(a.dir), path.resolve(root));
  assert.deepEqual(a.site, { static: 'site/dist' });
  assert.deepEqual(a.microservice, { port: 4100 });
  assert.equal(bag.shellApp, null);
});

test('gateway: shell + appRepos load each repo\'s OWN workspace', async (t) => {
  const base = await tmp(t, 'wsapps-gw-');
  const gw = path.join(base, 'gateway'); await fs.mkdir(gw);
  const shellRepo = path.join(base, 'cloud'); await fs.mkdir(shellRepo);
  const powchRepo = path.join(base, 'powch'); await fs.mkdir(powchRepo);
  await writeWs(shellRepo, {
    environment: 'DEV', apiUrl: 'https://dev.descix.net',
    app: { appId: 'daita', communityId: 'daita', site: { port: 5174 }, microservice: { port: 4000 } },
  });
  await writeWs(powchRepo, {
    environment: 'DEV', apiUrl: 'https://dev.descix.net',
    app: { appId: 'powch', communityId: 'powch', site: { port: 5175 }, microservice: { port: 3003 } },
  });
  await writeWs(gw, {
    environment: 'DEV', apiUrl: 'https://dev.descix.net',
    gateway: { port: 5173, shell: '../cloud', appRepos: ['../powch'] },
  });
  const bag = resolveWorkspaceApps(gw);
  assert.ok(bag.shellApp, 'shell resolved');
  assert.equal(bag.shellApp.appId, 'daita');
  assert.equal(bag.shellApp.role, 'shell');
  assert.equal(path.resolve(bag.shellApp.dir), path.resolve(shellRepo));
  assert.equal(bag.shellApp.site.port, 5174);
  assert.equal(bag.shellApp.microservice.port, 4000);
  const powch = bag.apps.find((a) => a.appId === 'powch');
  assert.ok(powch, 'appRepos entry resolved from its own workspace');
  assert.equal(powch.role, 'repo');
  assert.equal(path.resolve(powch.dir), path.resolve(powchRepo));
  // the shell also appears in apps (it IS an app; consumers that exclude it key on role)
  assert.ok(bag.apps.find((a) => a.appId === 'daita' && a.role === 'shell'));
});

test('a listed repo with NO workspace refuses loudly, naming the path and the remedy', async (t) => {
  const base = await tmp(t, 'wsapps-missing-');
  const gw = path.join(base, 'gateway'); await fs.mkdir(gw);
  await fs.mkdir(path.join(base, 'empty'));
  await writeWs(gw, { environment: 'DEV', apiUrl: 'https://dev.descix.net', gateway: { port: 5173, appRepos: ['../empty'] } });
  assert.throws(
    () => resolveWorkspaceApps(gw),
    (err) => {
      assert.match(err.message, /\.\.\/empty/, 'names the entry as written');
      assert.match(err.message, /descix app init/, 'names the remedy');
      return true;
    }
  );
});

test('a listed repo whose workspace holds no env.app refuses loudly', async (t) => {
  const base = await tmp(t, 'wsapps-noapp-');
  const gw = path.join(base, 'gateway'); await fs.mkdir(gw);
  const bare = path.join(base, 'bare'); await fs.mkdir(bare);
  await writeWs(bare, { environment: 'DEV', apiUrl: 'https://dev.descix.net' });
  await writeWs(gw, { environment: 'DEV', apiUrl: 'https://dev.descix.net', gateway: { port: 5173, appRepos: ['../bare'] } });
  assert.throws(() => resolveWorkspaceApps(gw), /env\.app/);
});

test('duplicate appIds across entries refuse loudly', async (t) => {
  const base = await tmp(t, 'wsapps-dup-');
  const gw = path.join(base, 'gateway'); await fs.mkdir(gw);
  const a1 = path.join(base, 'a1'); await fs.mkdir(a1);
  const a2 = path.join(base, 'a2'); await fs.mkdir(a2);
  for (const d of [a1, a2]) {
    await writeWs(d, { environment: 'DEV', apiUrl: 'https://dev.descix.net', app: { appId: 'egpt', communityId: 'egpt' } });
  }
  await writeWs(gw, { environment: 'DEV', apiUrl: 'https://dev.descix.net', gateway: { port: 5173, appRepos: ['../a1', '../a2'] } });
  assert.throws(() => resolveWorkspaceApps(gw), /egpt/);
});

test('an absolute appRepos path refuses loudly (portability)', async (t) => {
  const base = await tmp(t, 'wsapps-abs-');
  const gw = path.join(base, 'gateway'); await fs.mkdir(gw);
  await writeWs(gw, { environment: 'DEV', apiUrl: 'https://dev.descix.net', gateway: { port: 5173, appRepos: ['/abs/path'] } });
  assert.throws(() => resolveWorkspaceApps(gw), /absolute/i);
});

// ── site.static read-side guard: a stored absolute value (an old file, a hand edit) was silently
// re-rooted under the app dir by the gateway's path.join and failed only at request time with
// "Not found: <url>". The one reader refuses it, naming the file, the key and the fix verb.

test('a stored absolute site.static (own app) refuses loudly, naming the file, key and fix', async (t) => {
  const root = await tmp(t, 'wsapps-abs-static-');
  await writeWs(root, { app: { appId: 'abs-app', site: { static: '/abs/site' } } });
  assert.throws(
    () => resolveWorkspaceApps(root),
    (err) => {
      assert.ok(err.message.includes(path.join(root, '.descix', 'workspace.json')), err.message);
      assert.match(err.message, /env\.app\.site\.static takes a path relative to the workspace root/);
      assert.match(err.message, /got "\/abs\/site"/);
      assert.match(err.message, /app set-site -a abs-app --static <relative path>/);
      return true;
    }
  );
});

test('a stored absolute site.static in a gateway-listed repo refuses loudly, naming THAT repo\'s file', async (t) => {
  const gw = await tmp(t, 'wsapps-gw-abs-');
  const repo = path.join(gw, 'apprepo');
  await writeWs(repo, { app: { appId: 'repo-app', site: { static: '/abs/site' } } });
  await writeWs(gw, { gateway: { appRepos: ['apprepo'] } });
  assert.throws(
    () => resolveWorkspaceApps(gw),
    (err) => {
      assert.ok(err.message.includes(path.join(repo, '.descix', 'workspace.json')), err.message);
      assert.match(err.message, /env\.app\.site\.static/);
      return true;
    }
  );
});

test('relative site.static values ("site", ".", "../scratch") are read unchanged (positive control)', async (t) => {
  for (const rel of ['site', '.', '../scratch']) {
    const root = await tmp(t, 'wsapps-rel-static-');
    await writeWs(root, { app: { appId: 'rel-app', site: { static: rel } } });
    assert.equal(resolveWorkspaceApps(root).apps[0].site.static, rel);
  }
});
