/**
 * checkDevCert — status mapping.
 *
 * `security` (the darwin trust oracle) is stubbed via `t.mock.module('node:child_process', ...)`
 * — Node's built-in module mocker (`--experimental-test-module-mocks`, wired into this package's
 * `test` script). Each test dynamically imports getViteHttpsConfig.js with a cache-busting query
 * so it binds to THAT test's mock rather than a module instance cached from an earlier test.
 *
 * missing / no_localhost_san / expired are proven against REAL certificates (openssl-generated
 * fixtures), the same discipline dev-certs-san.test.js uses for the shipped pair — not stubbed
 * X509Certificate objects, which could pass while the real parsing path is broken.
 *
 * Run: `npm test` (needs --experimental-test-module-mocks — wired in package.json) or
 * `node --experimental-test-module-mocks --test tests/dev-cert-status.test.js`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const MODULE_URL = pathToFileURL(
  new URL('../src/dev/getViteHttpsConfig.js', import.meta.url).pathname
).href;

let importCounter = 0;
/** A fresh module instance, bound to whatever `t.mock.module` is active right now. */
function freshModule() {
  return import(`${MODULE_URL}?t=${importCounter++}`);
}

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Mint a real cert with a SAN-less subject (CN only) — the exact shape the SDK shipped before SAN enforcement. */
function makeSanlessCert(dir) {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1',
    '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'),
    '-days', '1', '-nodes', '-subj', '/CN=localhost',
  ], { stdio: 'ignore' });
  return path.join(dir, 'cert.pem');
}

/** Mint a real cert whose validity window is entirely in the past. */
function makeExpiredCert(dir) {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1',
    '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'),
    '-nodes', '-subj', '/O=DeSciX Dev/CN=localhost',
    '-not_before', '20200101000000Z', '-not_after', '20200102000000Z',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1',
  ], { stdio: 'ignore' });
  return path.join(dir, 'cert.pem');
}

/** Mint a real, currently-valid cert with a proper localhost SAN. */
function makeGoodCert(dir) {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1',
    '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'),
    '-days', '30', '-nodes', '-subj', '/O=DeSciX Dev/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1',
  ], { stdio: 'ignore' });
  return path.join(dir, 'cert.pem');
}

async function withTmpDir(prefix, fn) {
  const dir = tmpDir(prefix);
  try {
    return await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ------------------------------------------------------------------ missing

test('checkDevCert: no certPath at all -> missing, names the mint command', async () => {
  const mod = await freshModule();
  const result = mod.checkDevCert({});
  assert.equal(result.status, 'missing');
  assert.match(result.next, /openssl req -x509/);
});

test('checkDevCert: certPath does not exist -> missing', async () => {
  const mod = await freshModule();
  const result = mod.checkDevCert({ certPath: '/nonexistent/path/cert.pem' });
  assert.equal(result.status, 'missing');
  assert.match(result.detail, /No certificate at/);
});

test('checkDevCert: certPath exists but is not a valid certificate -> missing', () =>
  withTmpDir('devcert-junk-', async (dir) => {
    const certPath = path.join(dir, 'cert.pem');
    fs.writeFileSync(certPath, 'not a certificate');
    const mod = await freshModule();
    const result = mod.checkDevCert({ certPath });
    assert.equal(result.status, 'missing');
  }));

// -------------------------------------------------------------- SAN / expiry

test('checkDevCert: a real SAN-less cert -> no_localhost_san, names WebAuthn-safe next steps', () =>
  withTmpDir('devcert-nosan-', async (dir) => {
    const certPath = makeSanlessCert(dir);
    const mod = await freshModule();
    const result = mod.checkDevCert({ certPath });
    assert.equal(result.status, 'no_localhost_san');
    assert.match(result.detail, /no subjectAltName for localhost/);
    assert.match(result.next, /openssl req -x509/);
    assert.match(result.next, /descix dev-certs trust/);
  }));

test('checkDevCert: a real expired cert -> expired, detail names the expiry date', () =>
  withTmpDir('devcert-expired-', async (dir) => {
    const certPath = makeExpiredCert(dir);
    const mod = await freshModule();
    const result = mod.checkDevCert({ certPath });
    assert.equal(result.status, 'expired');
    assert.match(result.detail, /expired on/);
    assert.match(result.detail, /2020/);
  }));

// The darwin/non-darwin tests below use makeGoodCert() and assert status
// reaches 'trusted'/'untrusted'/'unverifiable' — which is itself the negative
// control for the SAN/expiry gates: a real, currently-valid, SAN-carrying cert
// must NOT be flagged no_localhost_san or expired before it ever reaches the
// platform-trust branch.

// ------------------------------------------------------------- darwin branch

test('checkDevCert: darwin + security succeeds -> trusted', () =>
  withTmpDir('devcert-trusted-', async (dir) => {
    const certPath = makeGoodCert(dir);
    const platformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    try {
      const { mock } = await import('node:test');
      mock.module('node:child_process', { namedExports: { execFileSync: () => Buffer.from('ok') } });
      const mod = await freshModule();
      const result = mod.checkDevCert({ certPath });
      assert.equal(result.status, 'trusted');
      assert.equal(result.next, null);
      mock.restoreAll();
    } finally {
      Object.defineProperty(process, 'platform', platformDesc);
    }
  }));

test('checkDevCert: darwin + security rejects -> untrusted, detail names the verdict, next is `descix dev-certs trust`', () =>
  withTmpDir('devcert-untrusted-', async (dir) => {
    const certPath = makeGoodCert(dir);
    const platformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    try {
      const { mock } = await import('node:test');
      mock.module('node:child_process', {
        namedExports: {
          execFileSync: () => {
            throw Object.assign(new Error('rejected'), {
              status: 1,
              stdout: Buffer.from('...certificate verification failed.\n'),
              stderr: Buffer.from('CSSMERR_TP_NOT_TRUSTED'),
            });
          },
        },
      });
      const mod = await freshModule();
      const result = mod.checkDevCert({ certPath });
      assert.equal(result.status, 'untrusted');
      assert.equal(result.detail, 'not trusted by the macOS keychain for https://localhost (security verify-cert: CSSMERR_TP_NOT_TRUSTED)');
      assert.equal(result.next, 'descix dev-certs trust');
      mock.restoreAll();
    } finally {
      Object.defineProperty(process, 'platform', platformDesc);
    }
  }));

// NEGATIVE CONTROL for the darwin gate itself: on a NON-darwin platform,
// `security` must never be invoked at all — proven by making the stub throw an
// assertion failure if called, not just by asserting the final status.
test('checkDevCert: non-darwin -> unverifiable, and NEVER calls `security`', () =>
  withTmpDir('devcert-unverifiable-', async (dir) => {
    const certPath = makeGoodCert(dir);
    const platformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      const { mock } = await import('node:test');
      mock.module('node:child_process', {
        namedExports: {
          execFileSync: () => {
            throw new Error('checkDevCert must not shell out to `security` on a non-darwin platform');
          },
        },
      });
      const mod = await freshModule();
      const result = mod.checkDevCert({ certPath });
      assert.equal(result.status, 'unverifiable');
      assert.match(result.detail, /linux/);
      assert.equal(result.next, null, 'unverifiable never claims a false fix');
      mock.restoreAll();
    } finally {
      Object.defineProperty(process, 'platform', platformDesc);
    }
  }));

// --------------------------------------------------------- SAN helper reuse

test('certificateSanNames and checkDevCert agree on the same cert (one SAN parser, not two)', () =>
  withTmpDir('devcert-agree-', async (dir) => {
    const certPath = makeSanlessCert(dir);
    const mod = await freshModule();
    const namesFromHelper = mod.certificateSanNames(fs.readFileSync(certPath));
    const result = mod.checkDevCert({ certPath });
    assert.deepEqual(namesFromHelper, []);
    assert.equal(result.status, 'no_localhost_san');
  }));
