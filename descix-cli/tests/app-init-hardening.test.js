/**
 * Tests for `app init` hardening (WS-CLI-V2.1-PURGE Batch 2; ported to the v3 single-app format).
 *
 * Coverage:
 *  - hard-fail: a repo that already holds ANOTHER app refuses (no silent re-pointing of env.app)
 *  - hard-fail: a workspace at an ANCESTOR refuses, nothing is written (assertNoParentWorkspace)
 *  - happy path: a fresh repo root becomes the workspace root and registers env.app
 *  - idempotent: re-running init for the app the repo already holds is not an error
 *
 * Design: drives the REAL runAppInit (lib/commands/appInit.js) from a temp repo root with a fake
 * apiClient whose invoke() answers only the two platform calls the existing-app path makes. The
 * old copy of the registration logic is gone: a test that re-implements the action measures the
 * copy. The -p/--path option and the path-exists guard were deleted with it — under v3 the repo
 * root IS the app root, so there is no path to validate.
 *
 * Run: `node --test tests/app-init-hardening.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { runAppInit } from '../lib/commands/appInit.js';

const ORIGINAL_CWD = process.cwd();

/** A platform stub: every app exists in community 'testcomm'; the default KB is created. */
const platformCalls = [];
const apiClient = {
  async invoke(command) {
    platformCalls.push(command);
    if (command === 'get_product_context') return { community_id: 'testcomm' };
    if (command === 'list_knowledge_bases') return { knowledge_bases: [{ name: 'General' }] };
    if (command === 'init_git_mode_kb') return { created: true };
    throw new Error(`unexpected platform call in app-init-hardening: ${command}`);
  },
};

/** Make a temp dir, chdir into `rel` under it, restore cwd and remove the tree afterwards. */
async function repoAt(t, rel = '.') {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'descix-appinit-')));
  const dir = path.join(root, rel);
  await fs.mkdir(dir, { recursive: true });
  process.chdir(dir);
  t.after(async () => {
    process.chdir(ORIGINAL_CWD);
    await fs.rm(root, { recursive: true, force: true });
  });
  return { root, dir };
}

const quiet = (t) => t.mock.method(console, 'log', () => {});

// ─────────────────────────────────────────────────────────────────────────────

test('app init — hard-fail: a repo that already holds another app refuses (no silent re-point)', async (t) => {
  quiet(t);
  const { dir } = await repoAt(t);
  await runAppInit(apiClient, { app: 'egpt' });

  await assert.rejects(
    () => runAppInit(apiClient, { app: 'other-app' }),
    /single-app|already holds/i,
    'a second app id must refuse loudly'
  );

  const reloaded = await WorkspaceConfig.load(dir);
  assert.equal(reloaded.env.app.appId, 'egpt', 'env.app must still be the first app');
});

test('app init — hard-fail: a workspace at an ANCESTOR refuses before anything is written', async (t) => {
  quiet(t);
  const { root, dir } = await repoAt(t, path.join('checkouts', 'nested-app'));
  platformCalls.length = 0;
  await fs.mkdir(path.join(root, '.descix'), { recursive: true });
  const parentWs = JSON.stringify({ version: '3.0', env: { app: { appId: 'parentapp', communityId: 'testcomm' } } });
  await fs.writeFile(path.join(root, '.descix', 'workspace.json'), parentWs);

  await assert.rejects(
    () => runAppInit(apiClient, { app: 'nestedapp' }),
    (err) => {
      assert.match(err.message, /nested inside another DeSciX workspace/);
      assert.ok(err.message.includes(root), 'names the parent workspace root');
      return true;
    }
  );

  assert.deepEqual(platformCalls, [], 'refused BEFORE any server-side call (no half-created platform app)');
  assert.equal(await fs.readFile(path.join(root, '.descix', 'workspace.json'), 'utf8'), parentWs, 'parent untouched');
  await assert.rejects(() => fs.stat(path.join(dir, '.descix')), 'no nested workspace was created');
  await assert.rejects(() => fs.stat(path.join(dir, 'site')), 'no scaffold was written');
});

test('app init — happy path: a fresh repo root becomes the workspace root and registers env.app', async (t) => {
  quiet(t);
  const { dir } = await repoAt(t);

  const result = await runAppInit(apiClient, { app: 'freshapp' });

  assert.equal(result.appId, 'freshapp');
  assert.equal(result.appPath, dir, 'the app root IS the repo root');
  const reloaded = await WorkspaceConfig.load(dir);
  const registered = reloaded.getAppByAppId('freshapp');
  assert.ok(registered, 'new app must be registered in workspace.json after init');
  assert.equal(registered.localPath, '.', 'v3 localPath is implicitly the workspace root');
  assert.equal(registered.absolutePath, dir, 'and resolves to exactly that directory');
  assert.equal(registered.communityId, 'testcomm');
  await fs.stat(path.join(dir, 'site'));
  await fs.stat(path.join(dir, 'microservice'));
});

test('app init — happy path: re-running for the app the repo already holds is idempotent (no error)', async (t) => {
  quiet(t);
  const { dir } = await repoAt(t);
  await runAppInit(apiClient, { app: 'egpt' });

  await assert.doesNotReject(() => runAppInit(apiClient, { app: 'egpt' }), 're-init of the same app must not throw');

  const reloaded = await WorkspaceConfig.load(dir);
  assert.equal(reloaded.env.app.appId, 'egpt');
});

// ─────────────────────────────────────────────────────────────────────────────
// MAP-NEVER-CREATES (measured 2026-10-10, EGPT-Evidence migration): mapping the EXISTING
// `egpt` app without --kb CREATED an empty `General` KB on PROD beside its real `Corpus`.
// The existing-app leg ADOPTS what exists and never creates; only the -c CREATE leg may.

function stubWithKbs(kbNames, { community = 'testcomm' } = {}) {
  const calls = [];
  return {
    calls,
    async invoke(command, params) {
      calls.push({ command, params });
      if (command === 'get_product_context') return { community_id: community };
      if (command === 'list_knowledge_bases') {
        return { knowledge_bases: kbNames.map((name) => ({ name })) };
      }
      if (command === 'init_git_mode_kb') return { created: true };
      if (command === 'create_app_for_community') {
        return { app_id: `${community}-${params.app_name}`, community_id: community };
      }
      throw new Error(`unexpected platform call: ${command}`);
    },
  };
}

test('app init (existing app, one KB) ADOPTS it — no --kb needed, NO create call', async (t) => {
  quiet(t);
  const { dir } = await repoAt(t);
  const stub = stubWithKbs(['Corpus']);
  await runAppInit(stub, { app: 'egpt' });
  const ws = await WorkspaceConfig.load(dir);
  assert.equal(ws.env.app.kbId, 'Corpus', 'the single existing KB is adopted');
  assert.ok(!stub.calls.some((c) => c.command === 'init_git_mode_kb'),
    'mapping an existing app must NEVER create a KB');
});

test('app init (existing app, several KBs, no --kb) REFUSES naming them', async (t) => {
  quiet(t);
  await repoAt(t);
  const stub = stubWithKbs(['Corpus', 'Sources']);
  await assert.rejects(
    () => runAppInit(stub, { app: 'egpt' }),
    (err) => {
      assert.match(err.message, /Corpus/); assert.match(err.message, /Sources/);
      assert.match(err.message, /--kb/);
      return true;
    }
  );
  assert.ok(!stub.calls.some((c) => c.command === 'init_git_mode_kb'), 'and creates nothing');
});

test('app init (existing app) --kb must name a KB that EXISTS', async (t) => {
  quiet(t);
  const { dir } = await repoAt(t);
  const stub = stubWithKbs(['Corpus', 'Sources']);
  await assert.rejects(
    () => runAppInit(stub, { app: 'egpt', kb: 'General' }),
    /General.*does not exist|no KB named/i
  );
  await runAppInit(stub, { app: 'egpt', kb: 'Sources' });
  const ws = await WorkspaceConfig.load(dir);
  assert.equal(ws.env.app.kbId, 'Sources');
  assert.ok(!stub.calls.some((c) => c.command === 'init_git_mode_kb'));
});

test('app init CREATE leg (-c) still creates the default KB', async (t) => {
  quiet(t);
  const { dir } = await repoAt(t);
  const stub = stubWithKbs([]); // a just-created app has no KB yet
  // the create leg: get_product_context must MISS first
  stub.invoke = (function (orig) {
    return async function (command, params) {
      if (command === 'get_product_context') { stub.calls.push({ command, params }); throw new Error('not found'); }
      return orig.call(this, command, params);
    };
  })(stub.invoke);
  await runAppInit(stub, { app: 'myapp', community: 'testcomm' });
  assert.ok(stub.calls.some((c) => c.command === 'init_git_mode_kb'),
    'the CREATE leg guarantees the default KB');
  const ws = await WorkspaceConfig.load(dir);
  assert.equal(ws.env.app.appId, 'testcomm-myapp');
});

// Every /apifront door refuses a param the command's published schema does not declare
// with a named error. The create leg must send only what create_app_for_community publishes —
// read from the one owner of that schema, never a hand list here.
test('app init (create leg) sends create_app_for_community only the params its published schema declares', async (t) => {
  quiet(t);
  await repoAt(t);
  const { NATIVE_MCP_TOOLS, validateToolParams, VALIDATION_PHASE } = await import('@descix/platform-api/mcp-tools');
  const stub = stubWithKbs([]);
  stub.invoke = (function (orig) {
    return async function (command, params) {
      if (command === 'get_product_context') { stub.calls.push({ command, params }); throw new Error('not found'); }
      return orig.call(this, command, params);
    };
  })(stub.invoke);
  await runAppInit(stub, { app: 'myapp', community: 'testcomm' });
  const create = stub.calls.find((c) => c.command === 'create_app_for_community');
  assert.ok(create, 'the create leg must have called create_app_for_community');
  const sent = Object.fromEntries(Object.entries(create.params).filter(([, v]) => v !== undefined));
  assert.doesNotThrow(
    () => validateToolParams(NATIVE_MCP_TOOLS, 'create_app_for_community', sent, { surface: 'test', phase: VALIDATION_PHASE.PRE_INJECTION }),
    `app init sent ${JSON.stringify(Object.keys(sent))}`);
});
