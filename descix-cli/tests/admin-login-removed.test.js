/**
 * `descix admin-login` IS DELETED, AND REFUSED BY NAME.
 *
 * No API command issues admin credentials: the server command `admin_bootstrap_login` is deleted
 * in Cloud, and with it the CLI verb, its generated invoke-map row, its MCP verb description and
 * its guest allow-list entry in cloud-core. Typing the verb exits non-zero naming the sign-in path,
 * and no private-repo path, through the one retired-verb owner (retired-verbs.js).
 *
 * Runs the REAL binary in a temp dir with no credentials and no workspace. Run:
 *   node --test tests/admin-login-removed.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE_ROOT = path.resolve(PKG_ROOT, '..');
const CLI = path.join(PKG_ROOT, 'bin', 'descix.js');
const SERVER_COMMAND = 'admin_bootstrap_login';

function inTempDir(fn) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'no-admin-login-')));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

function cli(cwd, args) {
  const env = { ...process.env, HOME: cwd };
  delete env.DESCIX_API_URL;
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

function filesUnder(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p)); else out.push(p);
  }
  return out;
}

test('descix admin-login exits non-zero naming the replacement, and writes no wallet', () => {
  inTempDir((dir) => {
    for (const args of [
      ['admin-login'],
      ['admin-login', '--email', 'someone@example.invalid'],
      ['admin-login', '-e', 'someone@example.invalid', '-u', 'https://example.invalid'],
      ['admin-login', '--help'],
    ]) {
      const r = cli(dir, args);
      const where = args.join(' ');
      assert.notEqual(r.code, 0, `${where}: a removed verb must not exit 0`);
      assert.match(r.out, /admin-login.*has been REMOVED/s, `${where}: refusal must name what was typed`);
      assert.match(r.out, /descix login/, `${where}: refusal must name the sign-in path`);
      assert.match(r.out, /platform operator's local bootstrap/, `${where}: refusal must name the operator path`);
      assert.doesNotMatch(r.out, /bootstrap\.js|DeSciX_Cloud|microservice\//, `${where}: refusal must name no private-repo path`);
      const wallets = filesUnder(dir).filter((f) => /wallet/i.test(path.basename(f)));
      assert.deepEqual(wallets, [], `${where}: must write no wallet file`);
    }
  });
});

test('the verb is absent from help, the invoke map and the MCP verb list', () => {
  inTempDir((dir) => {
    const help = cli(dir, ['--help']);
    assert.equal(help.code, 0, help.out);
    assert.match(help.out, /\blogin\b/, 'control: help lists the sign-in verb');
    assert.doesNotMatch(help.out, /admin-login/, 'a removed verb is hidden from help');
  });
  const invokes = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'lib', 'verb-invokes.generated.json'), 'utf8'));
  assert.equal(Object.prototype.hasOwnProperty.call(invokes, 'admin-login'), false, 'verb-invokes row');
  assert.equal(Object.values(invokes).flat().includes(SERVER_COMMAND), false, 'no verb invokes the server command');
  const verbs = JSON.parse(fs.readFileSync(
    path.join(CORE_ROOT, 'descix-platform-api', 'src', 'mcp-tools', 'cli-verbs.generated.json'), 'utf8'));
  assert.equal(verbs.some((v) => v.verbPath === 'admin-login'), false, 'cli-verbs.generated.json row');
});

test('the server command is not on the cloud-core guest allow-list', async () => {
  const { GUEST_ALLOWED_COMMANDS } = await import(path.join(CORE_ROOT, 'descix-cloud-core', 'src', 'config.js'));
  assert.ok(GUEST_ALLOWED_COMMANDS.includes('device_request_login'), 'control: the list is the guest allow-list');
  assert.equal(GUEST_ALLOWED_COMMANDS.includes(SERVER_COMMAND), false, 'guest allow-list entry');
});
