/**
 * Conformance: a GATEWAY workspace.json (env.gateway.shell, env.gateway.appRepos[]) is written by
 * CLI verbs, never by hand (DeSciXCore#9, "add the gateway verbs"):
 *
 *   descix config gateway set-shell <repo|none>
 *   descix config gateway add-repo <repo>
 *   descix config gateway remove-repo <repo>
 *
 * Fail loud, and a refusal writes NOTHING: a listed repo must carry its own v3 workspace.json with
 * env.app (the rule the gateway reads it with — @descix/app-sdk/dev resolveWorkspaceAppsFrom), a
 * single-app workspace is not a gateway, a duplicate add and an absent remove are refused.
 *
 * Runs the REAL binary against temp sibling checkouts.
 * Run: `node --test tests/config-gateway-verbs.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');

function writeWs(dir, ws) {
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(ws, null, 2));
}

const appWs = (appId) => ({ version: '3.0', type: 'workspace', env: { apiUrl: 'https://dev.descix.net', app: { appId, kbId: 'General' } } });

/**
 * Sibling checkouts under one temp parent:
 *   gateway/  a gateway workspace (no env.app)     shell-repo/, repo-a/, repo-b/  v3 single-app
 *   twin-a/   v3 single-app holding repo-a's id    no-ws/  no workspace.json      no-app/  no env.app
 */
function withSiblings(fn) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gw-verbs-')));
  try {
    writeWs(path.join(parent, 'gateway'), { version: '3.0', type: 'workspace', env: { apiUrl: 'https://dev.descix.net', gateway: { port: 5599 } } });
    writeWs(path.join(parent, 'shell-repo'), appWs('shell-app'));
    writeWs(path.join(parent, 'repo-a'), appWs('app-a'));
    writeWs(path.join(parent, 'repo-b'), appWs('app-b'));
    writeWs(path.join(parent, 'twin-a'), appWs('app-a'));
    fs.mkdirSync(path.join(parent, 'no-ws'));
    writeWs(path.join(parent, 'no-app'), { version: '3.0', type: 'workspace', env: { apiUrl: 'https://dev.descix.net' } });
    return fn(parent, path.join(parent, 'gateway'));
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

function cli(cwd, args) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const fileOf = (dir) => fs.readFileSync(path.join(dir, '.descix', 'workspace.json'), 'utf8');
const envOf = (dir) => JSON.parse(fileOf(dir)).env;

test('set-shell and add-repo write env.gateway; other keys are preserved', () => {
  withSiblings((_, gw) => {
    const s = cli(gw, ['config', 'gateway', 'set-shell', '../shell-repo']);
    assert.equal(s.code, 0, s.out);
    assert.equal(cli(gw, ['config', 'gateway', 'add-repo', '../repo-a']).code, 0);
    assert.equal(cli(gw, ['config', 'gateway', 'add-repo', '../repo-b/']).code, 0);
    const env = envOf(gw);
    assert.equal(env.gateway.shell, '../shell-repo');
    assert.deepEqual(env.gateway.appRepos, ['../repo-a', '../repo-b']);
    assert.equal(env.gateway.port, 5599);
    assert.equal(env.apiUrl, 'https://dev.descix.net');
  });
});

test('a repo with no workspace.json is refused, naming the path and the rule; nothing written', () => {
  withSiblings((parent, gw) => {
    const before = fileOf(gw);
    const r = cli(gw, ['config', 'gateway', 'add-repo', '../no-ws']);
    assert.equal(r.code, 1);
    assert.ok(r.out.includes(path.join(parent, 'no-ws')), r.out);
    assert.match(r.out, /no \.descix\/workspace\.json/);
    assert.match(r.out, /descix app init/);
    assert.equal(fileOf(gw), before);
    const sh = cli(gw, ['config', 'gateway', 'set-shell', '../no-ws']);
    assert.equal(sh.code, 1);
    assert.equal(fileOf(gw), before);
  });
});

test('a repo whose workspace holds no env.app is refused; nothing written', () => {
  withSiblings((_, gw) => {
    const before = fileOf(gw);
    const r = cli(gw, ['config', 'gateway', 'add-repo', '../no-app']);
    assert.equal(r.code, 1);
    assert.match(r.out, /holds no env\.app/);
    assert.equal(fileOf(gw), before);
  });
});

test('an absolute repo path is refused; nothing written', () => {
  withSiblings((parent, gw) => {
    const before = fileOf(gw);
    const r = cli(gw, ['config', 'gateway', 'add-repo', path.join(parent, 'repo-a')]);
    assert.equal(r.code, 1);
    assert.match(r.out, /absolute path/);
    assert.equal(fileOf(gw), before);
  });
});

test('a gateway verb in a single-app workspace is refused, naming the file', () => {
  withSiblings((parent) => {
    const single = path.join(parent, 'repo-a');
    const before = fileOf(single);
    for (const args of [['set-shell', '../shell-repo'], ['add-repo', '../repo-b'], ['remove-repo', '../repo-b']]) {
      const r = cli(single, ['config', 'gateway', ...args]);
      assert.equal(r.code, 1, args.join(' '));
      assert.ok(r.out.includes(path.join(single, '.descix', 'workspace.json')), r.out);
      assert.match(r.out, /single-app workspace/);
    }
    assert.equal(fileOf(single), before);
  });
});

test('add-repo of a repo already listed is refused (any spelling of the same path)', () => {
  withSiblings((_, gw) => {
    assert.equal(cli(gw, ['config', 'gateway', 'add-repo', '../repo-a']).code, 0);
    const before = fileOf(gw);
    for (const spelling of ['../repo-a', '../repo-a/', './../repo-a']) {
      const r = cli(gw, ['config', 'gateway', 'add-repo', spelling]);
      assert.equal(r.code, 1, spelling);
      assert.match(r.out, /already listed/);
    }
    assert.equal(fileOf(gw), before);
  });
});

test('add-repo of the shell repo, or of a second repo holding a listed appId, is refused', () => {
  withSiblings((_, gw) => {
    cli(gw, ['config', 'gateway', 'set-shell', '../shell-repo']);
    cli(gw, ['config', 'gateway', 'add-repo', '../repo-a']);
    const before = fileOf(gw);
    const shell = cli(gw, ['config', 'gateway', 'add-repo', '../shell-repo']);
    assert.equal(shell.code, 1);
    assert.match(shell.out, /env\.gateway\.shell/);
    const twin = cli(gw, ['config', 'gateway', 'add-repo', '../twin-a']);
    assert.equal(twin.code, 1);
    assert.match(twin.out, /app id 'app-a' appears twice/);
    assert.equal(fileOf(gw), before);
  });
});

test('remove-repo removes a listed repo; an absent one is refused; empty appRepos does not linger', () => {
  withSiblings((_, gw) => {
    cli(gw, ['config', 'gateway', 'add-repo', '../repo-a']);
    const before = fileOf(gw);
    const absent = cli(gw, ['config', 'gateway', 'remove-repo', '../repo-b']);
    assert.equal(absent.code, 1);
    assert.match(absent.out, /not listed/);
    assert.equal(fileOf(gw), before);

    const r = cli(gw, ['config', 'gateway', 'remove-repo', '../repo-a/']);
    assert.equal(r.code, 0, r.out);
    const env = envOf(gw);
    assert.equal(env.gateway.appRepos, undefined);
    assert.equal(env.gateway.port, 5599);
  });
});

test('remove-repo still works when the listed repo is gone from disk (the repair case)', () => {
  withSiblings((parent, gw) => {
    cli(gw, ['config', 'gateway', 'add-repo', '../repo-a']);
    cli(gw, ['config', 'gateway', 'add-repo', '../repo-b']);
    fs.rmSync(path.join(parent, 'repo-a'), { recursive: true, force: true });
    const r = cli(gw, ['config', 'gateway', 'remove-repo', '../repo-a']);
    assert.equal(r.code, 0, r.out);
    assert.deepEqual(envOf(gw).gateway.appRepos, ['../repo-b']);
  });
});

test('set-shell none removes env.gateway.shell', () => {
  withSiblings((_, gw) => {
    cli(gw, ['config', 'gateway', 'set-shell', '../shell-repo']);
    const r = cli(gw, ['config', 'gateway', 'set-shell', 'none']);
    assert.equal(r.code, 0, r.out);
    assert.equal(envOf(gw).gateway.shell, undefined);
  });
});

test('config --help and config gateway --help name the verbs', () => {
  withSiblings((_, gw) => {
    assert.match(cli(gw, ['config', '--help']).out, /gateway/);
    const h = cli(gw, ['config', 'gateway', '--help']).out;
    for (const verb of ['set-shell', 'add-repo', 'remove-repo']) assert.match(h, new RegExp(verb));
  });
});
