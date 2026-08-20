/**
 * Conformance: the gateway and the app dev servers behind it use the SAME cert.
 *
 * The divergence this pins shut (redteam G-7): `env.devCerts` was honoured by
 * the gateway and INVISIBLE to createViteServerConfig — the standardized dev
 * server every SDK app builds with. It forwarded certDir/certFile/keyFile only
 * from its caller's options and never read workspace config. A developer who
 * pointed env.devCerts at their own keychain-trusted pair therefore got it on
 * https://localhost:<gateway> and the SDK-tracked pair on every app behind it.
 *
 * Not cosmetic: WebAuthn/passkey ceremonies are origin-bound and refuse an
 * untrusted cert, so "Powch login works on the gateway but not on my app" was a
 * first-run blocker whose cause was invisible from either file alone.
 *
 * Run: `node --test tests/dev-certs-one-owner.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveDevCertOptions } from '../src/dev/devCerts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function withWorkspace(config, fn) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'devcerts-')));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    if (config) fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(config, null, 2));
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const WS = { env: { devCerts: { dir: 'certs/san' } } };

test('env.devCerts is resolved against the workspace root, not the cwd', () => {
  withWorkspace(WS, (dir) => {
    assert.equal(resolveDevCertOptions(dir).certDir, path.join(dir, 'certs/san'));
  });
});

test('an absolute path in env.devCerts is left alone', () => {
  withWorkspace({ env: { devCerts: { dir: '/etc/descix/certs' } } }, (dir) => {
    assert.equal(resolveDevCertOptions(dir).certDir, '/etc/descix/certs');
  });
});

test('individual cert/key files are honoured, not just the dir', () => {
  withWorkspace({ env: { devCerts: { cert: 'a/cert.pem', key: 'b/key.pem' } } }, (dir) => {
    const got = resolveDevCertOptions(dir);
    assert.equal(got.certFile, path.join(dir, 'a/cert.pem'));
    assert.equal(got.keyFile, path.join(dir, 'b/key.pem'));
    assert.equal(got.certDir, undefined);
  });
});

test('caller options win PER KEY, so one override does not discard the rest', () => {
  withWorkspace({ env: { devCerts: { dir: 'ws/dir', key: 'ws/key.pem' } } }, (dir) => {
    const got = resolveDevCertOptions(dir, { certDir: '/explicit/dir' });
    assert.equal(got.certDir, '/explicit/dir', 'the explicit override must win');
    assert.equal(got.keyFile, path.join(dir, 'ws/key.pem'), 'the workspace key must survive the dir override');
  });
});

test('no workspace opinion returns an EMPTY object, never undefined keys', () => {
  withWorkspace({ env: {} }, (dir) => {
    assert.deepEqual(resolveDevCertOptions(dir), {});
  });
  // Spreading the result must not clobber a default with `undefined`.
  const spread = { certDir: 'default', ...resolveDevCertOptions('/nonexistent') };
  assert.equal(spread.certDir, 'default');
});

test('a missing or malformed workspace is not fatal — an app may run outside one', () => {
  withWorkspace(null, (dir) => {
    assert.deepEqual(resolveDevCertOptions(dir), {});
  });
  withWorkspace(null, (dir) => {
    fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), '{ not json');
    assert.deepEqual(resolveDevCertOptions(dir), {});
  });
});

test('an already-parsed config can be passed in, so the gateway does not re-read the file', () => {
  assert.equal(resolveDevCertOptions('/ws', {}, WS).certDir, path.resolve('/ws', 'certs/san'));
  assert.deepEqual(resolveDevCertOptions('/ws', {}, null), {});
});

// -------------------------------------------------------------- ONE owner

test('NEITHER the gateway NOR createViteServerConfig re-derives certs by hand', () => {
  for (const f of ['gateway.js', 'createViteServerConfig.js']) {
    const src = stripComments(fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', f), 'utf8'));
    assert.match(src, /resolveDevCertOptions\(/, `${f} must consume the one owner`);
    assert.ok(!/env\??\.devCerts/.test(src), `${f} still reads env.devCerts itself`);
  }
});

test('createViteServerConfig actually FEEDS the resolved options to the https config', () => {
  const src = stripComments(fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'createViteServerConfig.js'), 'utf8'));
  assert.match(src, /getViteHttpsConfig\(resolveDevCertOptions\(workspacePath,/,
    'resolving them and then not passing them would be a silent no-op');
});
