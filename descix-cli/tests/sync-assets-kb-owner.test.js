/**
 * Which KB a command acts on when the caller names none has ONE owner: the server, which resolves
 * the app's own default KB (App.defaultKbName in the Cloud handlers sync_app_assets and
 * ask_question_to_app / ask_multiple_apps). A client-side 'General' substituted for an absent -k
 * let `descix app sync-assets` write system_instructions to a KB that `descix chat` never read,
 * while both reported success.
 *
 *  - app sync-assets: no -k sends no kb_name; -k sends it; the output names the KB the server
 *    reports writing and says whether it is the app's default; an asset not written fails the run.
 *  - chat --apps: a -k the caller gave is sent as given (it used to be dropped when it was 'General').
 *  - app init on an existing app with one KB and no --kb adopts that KB (a commander default of
 *    'General' made that branch unreachable and refused the app).
 *
 * Runs the real binary with the backend mocked (tests/tools/cli-mock-backend.mjs).
 *
 * Run: `node --test tests/sync-assets-kb-owner.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const MOCK = path.resolve(__dirname, 'tools', 'cli-mock-backend.mjs');

function withDir(fn) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kb-owner-')));
  try {
    return fn(parent);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

function run(cwd, home, args, extraEnv) {
  const env = { ...process.env, HOME: home, ...extraEnv };
  delete env.DESCIX_API_URL;
  const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', ...args], { cwd, env, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

/** An app dir with assets/system_instructions.md and assets/app_description.md. */
function appWithAssets(parent) {
  const app = path.join(parent, 'app');
  fs.mkdirSync(path.join(app, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(app, 'assets', 'system_instructions.md'), '# You are the app agent');
  fs.writeFileSync(path.join(app, 'assets', 'app_description.md'), '# The app');
  return app;
}

function params(out, command) {
  const m = out.match(new RegExp(`MOCK params ${command} (.*)`));
  assert.ok(m, `${command} was invoked:\n${out}`);
  return JSON.parse(m[1]);
}

test('sync-assets with no -k sends NO kb_name, and says the server wrote the app default KB', () => {
  withDir((parent) => {
    const app = appWithAssets(parent);
    const r = run(parent, parent, ['app', 'sync-assets', '-a', 'solo-app', '-p', app], { CLI_MOCK_SYNC_ASSETS: 'ok' });
    assert.equal(r.code, 0, r.out);
    const p = params(r.out, 'sync_app_assets');
    assert.equal(p.app_id, 'solo-app');
    assert.ok(!('kb_name' in p), `no kb_name in the request: ${JSON.stringify(p)}`);
    assert.deepEqual(p.assets.sort(), ['app_description', 'system_instructions']);
    assert.ok(r.out.includes(
      "system_instructions: synced (KB: Corpus, this app's default KB (no -k sent; the KB descix chat reads when it names none))"), r.out);
    assert.match(r.out, /app_description: synced/);
    assert.match(r.out, /Asset sync complete\./);
    assert.doesNotMatch(r.out, /General/);
  });
});

test('sync-assets -k <name> sends that kb_name, and the output says it was named', () => {
  withDir((parent) => {
    const app = appWithAssets(parent);
    const r = run(parent, parent, ['app', 'sync-assets', '-a', 'solo-app', '-p', app, '-k', 'Docs'], { CLI_MOCK_SYNC_ASSETS: 'ok' });
    assert.equal(r.code, 0, r.out);
    assert.equal(params(r.out, 'sync_app_assets').kb_name, 'Docs');
    assert.ok(r.out.includes(
      "system_instructions: synced (KB: Docs, named with -k; the server does not report whether it is this app's default KB)"), r.out);
  });
});

test('sync-assets: an asset the server did not write fails the run (exit 1), naming the reason', () => {
  withDir((parent) => {
    const app = appWithAssets(parent);
    const r = run(parent, parent, ['app', 'sync-assets', '-a', 'solo-app', '-p', app, '-k', 'Nope'], { CLI_MOCK_SYNC_ASSETS: 'kb-missing' });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /system_instructions: failed — KB 'Nope' not found/);
    assert.match(r.out, /Asset sync incomplete: 1 of 2 asset\(s\) not written\./);
    assert.doesNotMatch(r.out, /Asset sync complete/);
  });
});

test('sync-assets: an EMPTY icon.png is refused by name before sign-in and before anything is sent', () => {
  withDir((parent) => {
    const app = appWithAssets(parent);
    fs.writeFileSync(path.join(app, 'assets', 'icon.png'), '');
    const r = run(parent, parent, ['app', 'sync-assets', '-a', 'solo-app', '-p', app], { CLI_MOCK_SYNC_ASSETS: 'ok' });
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes(`icon.png is empty (0 bytes): ${path.join(app, 'assets', 'icon.png')}. Replace it with a PNG or delete it, then re-run.`), r.out);
    assert.doesNotMatch(r.out, /MOCK requireAuth|MOCK invoke/);
  });
});

test('sync-assets: fewer results than assets sent fails the run, naming what was sent and what came back', () => {
  withDir((parent) => {
    const app = appWithAssets(parent);
    const r = run(parent, parent, ['app', 'sync-assets', '-a', 'solo-app', '-p', app], { CLI_MOCK_SYNC_ASSETS: 'short' });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /The server returned 1 result\(s\) for 2 asset\(s\) sent \(sent: system_instructions, app_description; results: system_instructions\)\./);
    assert.match(r.out, /Asset sync incomplete: 1 of 2 asset\(s\) not written\./);
  });
});

test('chat --apps: a -k the caller gave is sent as given, General included; none given sends none', () => {
  withDir((parent) => {
    const named = run(parent, parent, ['chat', '--apps', 'a-app,b-app', '-k', 'General', '-q', 'hi'], { CLI_MOCK_ASK_MULTI: '1' });
    assert.equal(named.code, 0, named.out);
    assert.deepEqual(params(named.out, 'ask_multiple_apps'), [
      { app_id: 'a-app', knowledgebase_names: ['General'] }, { app_id: 'b-app', knowledgebase_names: ['General'] },
    ]);
    const none = run(parent, parent, ['chat', '--apps', 'a-app,b-app', '-q', 'hi'], { CLI_MOCK_ASK_MULTI: '1' });
    assert.equal(none.code, 0, none.out);
    assert.deepEqual(params(none.out, 'ask_multiple_apps'), [{ app_id: 'a-app' }, { app_id: 'b-app' }]);
  });
});

test('app init on an existing app with one KB and no --kb adopts that KB', () => {
  withDir((parent) => {
    const repo = path.join(parent, 'repo');
    fs.mkdirSync(repo);
    const r = run(repo, parent, ['app', 'init', '-a', 'mock-comm-app'], { CLI_MOCK_APP_INIT: 'adopt' });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /KB: Corpus — adopted \(existing app; map never creates\)/);
    const ws = JSON.parse(fs.readFileSync(path.join(repo, '.descix', 'workspace.json'), 'utf8'));
    assert.equal(ws.env.app.kbId, 'Corpus');
  });
});
