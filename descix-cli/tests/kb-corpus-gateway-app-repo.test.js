/**
 * Conformance: the kb verbs that read an app's corpus manifest (`kb corpus sync`, `kb corpus status`,
 * `kb doctor`) resolve `-a <appId>` through the one resolver of "which repo holds this app",
 * WorkspaceConfig.resolveAppRepo — the same owner `site upload` consumes.
 *
 * In a GATEWAY workspace (env.gateway.shell / env.gateway.appRepos[]), `-a <appId>` names the listed
 * repo whose own workspace.json holds that app: its `.descix/manifests/<kbId>.json` is the manifest,
 * its git tree is walked at the manifest ref, its sync-state is read and written, and its own
 * env.app.communityId scopes the KB. Env, origin and credential stay with the gateway workspace the
 * command runs in. An app no listed repo holds is resolveAppRepo's refusal (add-repo, or run from the
 * repo's root) — no -p form, the manifest is required. A single-app workspace keeps its behaviour:
 * its own app, and any other id is the canonical unmapped-app refusal.
 *
 * Drives the REAL binary with the backend mocked (tests/tools/cli-mock-backend.mjs), which refuses
 * get_product_context — so a verb that could not take the community from the app's repo fails here.
 *
 * Run: `node --test tests/kb-corpus-gateway-app-repo.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const MOCK = path.resolve(__dirname, 'tools', 'cli-mock-backend.mjs');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
}

const appWs = (appId, communityId) => ({
  version: '3.0', type: 'workspace',
  env: { apiUrl: 'https://dev.descix.net', app: { appId, communityId, kbId: 'General' } },
});

const generalManifest = { kb_name: 'General', sync_mode: 'local', sources: [{ path: 'docs', tier: 1, doc_type: 'documentation' }] };

function git(cwd, ...args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

/** A git repo on main holding a v3 app, its General corpus manifest and the named docs, committed. */
function appRepo(dir, appId, communityId, docs) {
  write(path.join(dir, '.descix', 'workspace.json'), appWs(appId, communityId));
  write(path.join(dir, '.descix', 'manifests', 'General.json'), generalManifest);
  for (const d of docs) write(path.join(dir, 'docs', d), `# ${d}\n\nCorpus text for ${appId}: ${d}.\n`);
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 'test@test');
  git(dir, 'config', 'user.name', 'test');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'seed');
}

/**
 *   gw/                      gateway workspace (no env.app), its own git repo with a DECOY corpus:
 *                            docs/decoy.md + .descix/manifests/General.json (what a cwd fallback reads)
 *   gw/shell-repo/           git repo, v3 app 'shell-app' (community 'shell-comm'), docs/a.md docs/b.md
 *   gw/repos/auth-repo/      git repo, v3 app 'auth-app'  (community 'auth-comm'),  docs/x.md
 *   gw/repos/no-ws/          no .descix/workspace.json
 *   single/                  git repo, v3 single-app 'solo-app' (community 'solo-comm'), docs/s.md
 */
async function withTree(fn) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kb-gw-app-repo-')));
  try {
    const gw = path.join(parent, 'gw');
    write(path.join(gw, '.descix', 'workspace.json'), {
      version: '3.0', type: 'workspace',
      env: {
        environment: 'DEV', apiUrl: 'https://dev.descix.net',
        gateway: { port: 5599, shell: 'shell-repo', appRepos: ['repos/no-ws', 'repos/auth-repo'] },
      },
    });
    write(path.join(gw, '.descix', 'manifests', 'General.json'), generalManifest);
    write(path.join(gw, 'docs', 'decoy.md'), '# decoy\n\nThe gateway tree, never a corpus source.\n');
    git(gw, 'init', '-q', '-b', 'main');
    git(gw, 'config', 'user.email', 'test@test');
    git(gw, 'config', 'user.name', 'test');
    git(gw, 'add', '.descix', 'docs');
    git(gw, 'commit', '-q', '-m', 'gateway');

    appRepo(path.join(gw, 'shell-repo'), 'shell-app', 'shell-comm', ['a.md', 'b.md']);
    appRepo(path.join(gw, 'repos', 'auth-repo'), 'auth-app', 'auth-comm', ['x.md']);
    fs.mkdirSync(path.join(gw, 'repos', 'no-ws'), { recursive: true });
    const single = path.join(parent, 'single');
    appRepo(single, 'solo-app', 'solo-comm', ['s.md']);
    return await fn({ parent, gw, single });
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

/** The real binary with the backend mocked. */
function cli(cwd, args, home) {
  const env = { ...process.env, HOME: home };
  delete env.DESCIX_API_URL;
  const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', ...args], { cwd, env, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

const SYNC = (appId) => ['kb', 'corpus', 'sync', '-a', appId, '-k', 'General', '--dry-run', '--show-walk'];

/** The relative paths --show-walk printed. */
function walked(out) {
  return [...out.matchAll(/^\s+[0-9a-f]{8}\s+(\S+)$/gm)].map((m) => m[1]).sort();
}

// ── kb corpus sync ───────────────────────────────────────────────────────────────────────────

test('gateway: kb corpus sync -a <shell app> reads the shell repo\'s manifest and walks ITS git tree, scoped to its community', async () => {
  await withTree(async ({ parent, gw }) => {
    const repo = path.join(gw, 'shell-repo');
    const r = cli(gw, SYNC('shell-app'), parent);
    // dry-run exits 1 when it would change something — two new files here
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes(`App repo: ${repo} (gateway shell entry 'shell-repo')`), r.out);
    assert.deepEqual(walked(r.out), ['docs/a.md', 'docs/b.md'], r.out);
    assert.doesNotMatch(r.out, /decoy/);
    assert.match(r.out, /MOCK scope list_knowledge_bases app=shell-app community=shell-comm/);
    assert.match(r.out, /Would upsert: \d+ chunks from 2 file\(s\)/);
    assert.doesNotMatch(r.out, /get_product_context|App not found|not this workspace's app/);
  });
});

test('gateway: kb corpus sync -a <appRepos app> reads that repo', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, SYNC('auth-app'), parent);
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes(`App repo: ${path.join(gw, 'repos', 'auth-repo')} (gateway repo entry 'repos/auth-repo')`), r.out);
    assert.deepEqual(walked(r.out), ['docs/x.md'], r.out);
    assert.match(r.out, /MOCK scope list_knowledge_bases app=auth-app community=auth-comm/);
  });
});

test('gateway: kb corpus sync -a <app no entry holds> → resolveAppRepo\'s refusal naming the entries; no -p remedy; nothing reaches the backend', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, SYNC('nope-app'), parent);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /App "nope-app" is not held by any entry of the gateway workspace/);
    for (const entry of ['shell-repo', 'repos/auth-repo', 'repos/no-ws']) assert.ok(r.out.includes(entry), `names ${entry}:\n${r.out}`);
    assert.match(r.out, /descix config gateway add-repo <repo>/);
    assert.match(r.out, /run the command from that repo's root/);
    assert.doesNotMatch(r.out, /-p <built dist>|--path/);
    assert.doesNotMatch(r.out, /MOCK invoke/);
    assert.doesNotMatch(r.out, /decoy/);
  });
});

test('single-app: kb corpus sync -a <its app> is unchanged — its own manifest and tree', async () => {
  await withTree(async ({ parent, single }) => {
    const r = cli(single, SYNC('solo-app'), parent);
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes(`App repo: ${single} (this workspace's app)`), r.out);
    assert.deepEqual(walked(r.out), ['docs/s.md'], r.out);
    assert.match(r.out, /MOCK scope list_knowledge_bases app=solo-app community=solo-comm/);
  });
});

test('single-app: kb corpus sync -a <another app> → the canonical unmapped-app refusal', async () => {
  await withTree(async ({ parent, single }) => {
    const r = cli(single, SYNC('other-app'), parent);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /App "other-app" is not this workspace's app \(workspace\.json env\.app\)/);
    assert.match(r.out, /run commands for another app from ITS repo root/);
    assert.doesNotMatch(r.out, /MOCK invoke/);
  });
});

// ── kb corpus status ─────────────────────────────────────────────────────────────────────────

test('gateway: kb corpus status -a <shell app> walks the shell repo', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, ['kb', 'corpus', 'status', '-a', 'shell-app', '-k', 'General'], parent);
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes(`App repo: ${path.join(gw, 'shell-repo')} (gateway shell entry 'shell-repo')`), r.out);
    assert.match(r.out, /Live file count: 2/);
    assert.match(r.out, /Never synced/);
  });
});

test('gateway: kb corpus status -a <app no entry holds> → the refusal', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, ['kb', 'corpus', 'status', '-a', 'nope-app'], parent);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /App "nope-app" is not held by any entry of the gateway workspace/);
    assert.match(r.out, /descix config gateway add-repo <repo>/);
  });
});

// ── kb doctor ────────────────────────────────────────────────────────────────────────────────

test('gateway: kb doctor -a <shell app> reads the shell repo\'s sync-state', async () => {
  await withTree(async ({ parent, gw }) => {
    const repo = path.join(gw, 'shell-repo');
    const r = cli(gw, ['kb', 'doctor', '-a', 'shell-app', '-k', 'General'], parent);
    // no sync-state yet → exit 2, naming WHERE it looked
    assert.equal(r.code, 2, r.out);
    assert.ok(r.out.includes(`App repo: ${repo} (gateway shell entry 'shell-repo')`), r.out);
    assert.match(r.out, /kb doctor — shell-comm\/shell-app\/General/);
    assert.ok(r.out.includes(` at ${path.join(repo, '.descix', 'sync-state')}`), r.out);
  });
});

test('gateway: kb doctor -a <app no entry holds> → the refusal, nothing reaches the backend', async () => {
  await withTree(async ({ parent, gw }) => {
    const r = cli(gw, ['kb', 'doctor', '-a', 'nope-app', '-k', 'General'], parent);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /App "nope-app" is not held by any entry of the gateway workspace/);
    assert.doesNotMatch(r.out, /MOCK invoke/);
  });
});

test('single-app: kb doctor -a <another app> → the canonical unmapped-app refusal', async () => {
  await withTree(async ({ parent, single }) => {
    const r = cli(single, ['kb', 'doctor', '-a', 'other-app', '-k', 'General'], parent);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /App "other-app" is not this workspace's app \(workspace\.json env\.app\)/);
  });
});
