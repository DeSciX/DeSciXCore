/**
 * Conformance: `-a <appId>` in a GATEWAY workspace resolves the app's REPO ROOT from the gateway's
 * own entries (env.gateway.shell, env.gateway.appRepos[]), never the caller's cwd.
 *
 * The owner is WorkspaceConfig.resolveAppRepo(appId). It reads each entry with
 * @descix/app-sdk/dev resolveWorkspaceAppsFrom (the rule the gateway itself serves the entry by), and
 * the entry whose own workspace.json names env.app.appId === appId is the repo. `site upload` reads
 * its site manifest (<repo>/.descix/manifests/site.json), runs its buildCommand and walks its sources
 * from THAT repo; env, apiUrl and credential stay with the gateway workspace.
 *
 *  - no entry names the app → refusal naming the appId and every entry searched (never `./site`);
 *  - an entry with no workspace.json / no env.app is SKIPPED and named, with its reason, in a refusal;
 *  - a single-app workspace keeps its behaviour: its own app is its root, any other id is null.
 *
 * Run: `node --test tests/site-upload-gateway-app-repo.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { loadSiteManifest } from '../lib/core/ManifestLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');

function writeWs(dir, ws) {
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(ws, null, 2));
}

function writeSiteManifest(dir) {
  fs.mkdirSync(path.join(dir, '.descix', 'manifests'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.descix', 'manifests', 'site.json'),
    JSON.stringify({ version: '1.0', buildCommand: 'npm run build --prefix site', sources: [{ path: 'site/dist', include: ['**/*'] }] })
  );
}

const appWs = (appId, communityId = appId) => ({
  version: '3.0', type: 'workspace',
  env: { apiUrl: 'https://dev.descix.net', app: { appId, communityId, kbId: 'General' } },
});

/**
 * One temp tree laid out like a gateway checkout:
 *   gw/                       gateway workspace (no env.app): shell 'shell-repo', appRepos below
 *   gw/shell-repo/            v3 app 'shell-app'  (+ site manifest)
 *   gw/repos/auth-repo/       v3 app 'auth-app'   (+ site manifest)
 *   gw/repos/bare-repo/       v3 app 'bare-app'   (NO site manifest)
 *   gw/repos/no-ws/           no .descix/workspace.json at all
 *   gw/repos/no-app/          workspace.json without env.app
 *   gw/site/                  a decoy `./site` the old fallback would have read
 *   single/                   v3 single-app workspace 'solo-app' (+ site manifest)
 */
async function withTree(fn, { appRepos } = {}) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gw-app-repo-')));
  try {
    const gw = path.join(parent, 'gw');
    writeWs(gw, {
      version: '3.0', type: 'workspace',
      env: {
        environment: 'DEV', apiUrl: 'https://dev.descix.net',
        gateway: { port: 5599, shell: 'shell-repo', appRepos: appRepos || ['repos/no-ws', 'repos/no-app', 'repos/auth-repo', 'repos/bare-repo'] },
      },
    });
    writeWs(path.join(gw, 'shell-repo'), appWs('shell-app'));
    writeSiteManifest(path.join(gw, 'shell-repo'));
    writeWs(path.join(gw, 'repos', 'auth-repo'), appWs('auth-app'));
    writeSiteManifest(path.join(gw, 'repos', 'auth-repo'));
    writeWs(path.join(gw, 'repos', 'bare-repo'), appWs('bare-app', 'shell-app'));
    fs.mkdirSync(path.join(gw, 'repos', 'no-ws'), { recursive: true });
    writeWs(path.join(gw, 'repos', 'no-app'), { version: '3.0', type: 'workspace', env: { apiUrl: 'https://dev.descix.net' } });
    fs.mkdirSync(path.join(gw, 'site'), { recursive: true });
    fs.writeFileSync(path.join(gw, 'site', 'index.html'), '<p>decoy</p>');
    const single = path.join(parent, 'single');
    writeWs(single, appWs('solo-app'));
    writeSiteManifest(single);
    return await fn({ parent, gw, single });
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

const load = (dir) => WorkspaceConfig.load(dir);

test('gateway + -a <appRepo app> resolves that repo root, and the site manifest is read from it', async () => {
  await withTree(async ({ gw }) => {
    const ws = await load(gw);
    const repo = ws.resolveAppRepo('auth-app');
    assert.equal(repo.dir, path.join(gw, 'repos', 'auth-repo'));
    assert.equal(repo.role, 'repo');
    assert.equal(repo.entry, 'repos/auth-repo');
    assert.equal(repo.communityId, 'auth-app');
    const manifest = await loadSiteManifest(repo.dir);
    assert.equal(manifest._manifestPath, path.join(gw, 'repos', 'auth-repo', '.descix', 'manifests', 'site.json'));
    assert.equal(manifest._resolvedSources[0].absolutePath, path.join(gw, 'repos', 'auth-repo', 'site', 'dist'));
  });
});

test('gateway + -a <shell app> resolves the shell repo root', async () => {
  await withTree(async ({ gw }) => {
    const repo = (await load(gw)).resolveAppRepo('shell-app');
    assert.equal(repo.dir, path.join(gw, 'shell-repo'));
    assert.equal(repo.role, 'shell');
  });
});

test('gateway + unknown app → refusal naming the appId and every entry searched; never the cwd', async () => {
  await withTree(async ({ gw }) => {
    const ws = await load(gw);
    let err;
    try { ws.resolveAppRepo('nope-app'); } catch (e) { err = e; }
    assert.ok(err, 'an unknown app in a gateway workspace must throw, not resolve');
    assert.match(err.message, /"nope-app"/);
    for (const entry of ['shell-repo', 'repos/auth-repo', 'repos/bare-repo', 'repos/no-ws', 'repos/no-app']) {
      assert.ok(err.message.includes(entry), `refusal must name entry ${entry}:\n${err.message}`);
    }
    assert.ok(err.message.includes(path.join(gw, '.descix', 'workspace.json')), 'refusal names the gateway file');
  });
});

test('an entry with no workspace.json / no env.app / another appId is skipped and named with its reason', async () => {
  await withTree(async ({ gw }) => {
    const ws = await load(gw);
    // skipped entries do not block resolving an app that IS listed
    assert.equal(ws.resolveAppRepo('bare-app').dir, path.join(gw, 'repos', 'bare-repo'));
    let err;
    try { ws.resolveAppRepo('nope-app'); } catch (e) { err = e; }
    assert.ok(err);
    assert.match(err.message, /repos\/no-ws .*skipped.*no \.descix\/workspace\.json/);
    assert.match(err.message, /repos\/no-app .*skipped.*no env\.app/);
    assert.match(err.message, /repos\/auth-repo .*app "auth-app"/);
  });
});

test('one appId listed by two entries → refusal naming both (one app, one repo)', async () => {
  await withTree(async ({ gw }) => {
    writeWs(path.join(gw, 'repos', 'twin'), appWs('auth-app'));
    const ws = new WorkspaceConfig(
      { version: '3.0', env: { gateway: { appRepos: ['repos/auth-repo', 'repos/twin'] } } }, gw
    );
    assert.throws(() => ws.resolveAppRepo('auth-app'), (e) => /auth-app/.test(e.message) && /repos\/auth-repo/.test(e.message) && /repos\/twin/.test(e.message));
  });
});

test('single-app workspace: its own app is the workspace root; another id is null (unchanged)', async () => {
  await withTree(async ({ single }) => {
    const ws = await load(single);
    const repo = ws.resolveAppRepo('solo-app');
    assert.equal(repo.dir, single);
    assert.equal(repo.dir, ws.getAppByAppId('solo-app').absolutePath);
    assert.equal(repo.role, 'self');
    assert.equal(ws.resolveAppRepo('other-app'), null);
  });
});

// ── the real binary ──────────────────────────────────────────────────────────────────────────

function cli(cwd, args, home) {
  const env = { ...process.env, HOME: home };
  delete env.DESCIX_API_URL;
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

test('CLI: site upload -a <unknown> in a gateway refuses by name before auth, never reads ./site', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, ['--env=dev', 'site', 'upload', '-a', 'nope-app', '--dry-run'], parent);
    assert.notEqual(r.code, 0, r.out);
    assert.match(r.out, /"nope-app"/);
    assert.match(r.out, /repos\/auth-repo/);
    assert.doesNotMatch(r.out, /Found \d+ files/);
    assert.doesNotMatch(r.out, /Source:/);
    assert.doesNotMatch(r.out, /Authentication required/);
  });
});

test('CLI: site upload -a <gateway app with no site manifest> and no -p refuses, naming the missing manifest', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, ['--env=dev', 'site', 'upload', '-a', 'bare-app', '--dry-run'], parent);
    assert.notEqual(r.code, 0, r.out);
    assert.ok(r.out.includes(path.join(gw, 'repos', 'bare-repo', '.descix', 'manifests', 'site.json')), r.out);
    assert.doesNotMatch(r.out, /Found \d+ files/);
    assert.doesNotMatch(r.out, /Authentication required/);
  });
});
