/**
 * Conformance: the developer never hand-edits .descix/workspace.json (G-6).
 *
 * env.gateway.port, env.devCerts.*, env.powchUrl and env.siteUrl are all read by
 * the gateway and/or the shell build, and NONE of them had a CLI verb — the only
 * way to set them was to open the generated file and type. That is how the shape
 * drifts, and it is the opposite of "the app developer shouldn't need to
 * understand the routing; it should all just work."
 *
 * These run the REAL binary against a temp workspace, because the interesting
 * failures are not in the writer: a validation that throws outside the block that
 * prints exits 1 with no message, which reads to a developer as a crash rather
 * than as "you typed a bad port". That regression is pinned below.
 *
 * Run: `node --test tests/config-workspace-env-verbs.test.js` from descix-cli/.
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

function withWorkspace(fn) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-verbs-')));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.descix', 'workspace.json'),
      JSON.stringify({ version: '2.1', type: 'workspace', env: { apiUrl: 'https://dev.descix.net', products: [] } }, null, 2),
    );
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Run the CLI in `cwd`. Returns {code, out} — never throws on a non-zero exit. */
function cli(cwd, args) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const envOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, '.descix', 'workspace.json'), 'utf8')).env;

// ------------------------------------------------------------ they all write

test('every workspace-level key the redteam listed now has a verb that writes it', () => {
  withWorkspace((dir) => {
    assert.equal(cli(dir, ['config', 'set-gateway-port', '5599']).code, 0);
    assert.equal(cli(dir, ['config', 'set-powch-url', 'https://powch.dev.descix.net']).code, 0);
    assert.equal(cli(dir, ['config', 'set-site-url', 'https://dev.descix.net']).code, 0);
    assert.equal(cli(dir, ['config', 'set-dev-certs', '--dir', './certs/san']).code, 0);

    const env = envOf(dir);
    assert.equal(env.gateway.port, 5599);
    assert.equal(env.powchUrl, 'https://powch.dev.descix.net');
    assert.equal(env.siteUrl, 'https://dev.descix.net');
    assert.equal(env.devCerts.dir, path.resolve(dir, 'certs/san'));
    // pre-existing keys are preserved, not rewritten
    assert.equal(env.apiUrl, 'https://dev.descix.net');
  });
});

test('cert paths are stored ABSOLUTE so they do not depend on where you stood', () => {
  withWorkspace((dir) => {
    cli(dir, ['config', 'set-dev-certs', '--cert', './a/cert.pem', '--key', './b/key.pem']);
    const { devCerts } = envOf(dir);
    assert.ok(path.isAbsolute(devCerts.cert));
    assert.ok(path.isAbsolute(devCerts.key));
  });
});

// -------------------------------------------------- fail LOUD, not just fail

test('a rejected value prints WHY — an exit code with no message reads as a crash', () => {
  withWorkspace((dir) => {
    const port = cli(dir, ['config', 'set-gateway-port', '99999']);
    assert.equal(port.code, 1);
    assert.match(port.out, /Port must be an integer 1-65535/, 'rejected silently: no message reached the developer');

    const url = cli(dir, ['config', 'set-powch-url', 'not-a-url']);
    assert.equal(url.code, 1);
    assert.match(url.out, /must be an absolute URL/);

    const empty = cli(dir, ['config', 'set-dev-certs']);
    assert.equal(empty.code, 1);
    assert.match(empty.out, /Nothing to set/);

    // and nothing was written on any of those
    const env = envOf(dir);
    assert.equal(env.gateway, undefined);
    assert.equal(env.powchUrl, undefined);
    assert.equal(env.devCerts, undefined);
  });
});

test('a non-http scheme is refused — this value decides where passkeys are typed', () => {
  withWorkspace((dir) => {
    const r = cli(dir, ['config', 'set-powch-url', 'ftp://powch.example.com']);
    assert.equal(r.code, 1);
    assert.match(r.out, /must be http\(s\)/);
  });
});

// ------------------------------------------------------------------ removal

test('"none" removes a key and empty parents do not linger in the file', () => {
  withWorkspace((dir) => {
    cli(dir, ['config', 'set-gateway-port', '5599']);
    cli(dir, ['config', 'set-dev-certs', '--dir', './certs']);
    cli(dir, ['config', 'set-site-url', 'https://dev.descix.net']);

    assert.equal(cli(dir, ['config', 'set-site-url', 'none']).code, 0);
    assert.equal(cli(dir, ['config', 'set-gateway-port', 'none']).code, 0);
    assert.equal(cli(dir, ['config', 'set-dev-certs', '--clear']).code, 0);

    const env = envOf(dir);
    assert.equal('siteUrl' in env, false);
    assert.equal('gateway' in env, false, 'an empty gateway:{} left behind is drift');
    assert.equal('devCerts' in env, false, 'an empty devCerts:{} left behind is drift');
  });
});

// ------------------------------------------------------- the allow-list

test('setEnvKey refuses per-app keys and names the verb that owns them', async () => {
  const { WorkspaceConfig } = await import('../lib/workspace-config.js');
  const ws = new WorkspaceConfig({ version: '2.1', env: {} }, '/tmp/nowhere');
  await assert.rejects(() => ws.setEnvKey('products.0.site.port', 5511), /not a workspace-level env key[\s\S]*descix app set-site/);
  await assert.rejects(() => ws.setEnvKey('apiUrl', 'https://x.example'), /not a workspace-level env key/);
});
