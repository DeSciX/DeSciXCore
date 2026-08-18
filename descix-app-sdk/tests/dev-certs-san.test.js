/**
 * Drift guard: the TRACKED dev certs must keep their subjectAltName.
 *
 * A SAN-less cert is not a cosmetic problem — Chrome ignores the legacy CN,
 * shows an interstitial on every https://localhost origin, and WebAuthn refuses
 * to run, so passkey login (the only DeSciX auth) is impossible for anyone who
 * installs the SDK. This test fails the moment the certs regress.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { X509Certificate, createPrivateKey } from 'node:crypto';
import { execFileSync } from 'node:child_process';

import {
  getViteHttpsConfig,
  certificateSanNames,
  assertCertHasLocalhostSan,
  DEFAULT_CERT_DIR,
  MINT_CERT_COMMAND,
} from '../src/dev/getViteHttpsConfig.js';

const trackedCertPath = path.join(DEFAULT_CERT_DIR, 'cert.pem');
const trackedCert = fs.readFileSync(trackedCertPath);

test('tracked cert carries a subjectAltName covering localhost', () => {
  const names = certificateSanNames(trackedCert);
  assert.ok(names.includes('DNS:localhost'), `SAN missing DNS:localhost — got ${names.join(', ') || 'none'}`);
  assert.ok(names.includes('IP:127.0.0.1'), `SAN missing IP:127.0.0.1 — got ${names.join(', ') || 'none'}`);
});

test('tracked cert is still valid well into the future', () => {
  const cert = new X509Certificate(trackedCert);
  const daysLeft = (Date.parse(cert.validTo) - Date.now()) / 86_400_000;
  assert.ok(daysLeft > 90, `tracked dev cert expires in ${Math.round(daysLeft)} days — re-mint:\n${MINT_CERT_COMMAND}`);
});

test('getViteHttpsConfig loads the tracked pair and the key matches the cert', () => {
  const { https } = getViteHttpsConfig();
  assert.ok(https.cert.includes('BEGIN CERTIFICATE'));
  assert.ok(https.key.includes('PRIVATE KEY'));
  const cert = new X509Certificate(https.cert);
  assert.equal(cert.checkPrivateKey(createPrivateKey(https.key)), true);
});

test('getViteHttpsConfig accepts an override cert dir (bring your own cert)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-certs-'));
  try {
    fs.copyFileSync(trackedCertPath, path.join(dir, 'cert.pem'));
    fs.copyFileSync(path.join(DEFAULT_CERT_DIR, 'key.pem'), path.join(dir, 'key.pem'));
    const { https } = getViteHttpsConfig({ certDir: dir });
    assert.equal(https.cert.toString(), trackedCert.toString());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a missing override cert fails loud with the mint command', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-certs-empty-'));
  try {
    assert.throws(() => getViteHttpsConfig({ certDir: dir }), (err) => {
      assert.match(err.message, /missing/);
      assert.match(err.message, /subjectAltName/);
      return true;
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a SAN-less cert is refused, naming WebAuthn and the fix', () => {
  // Proven against a REAL SAN-less certificate (CN=localhost only) — the exact
  // shape that shipped before this workstream — not a stubbed object.
  assert.throws(() => assertCertHasLocalhostSan(makeSanlessCert(), '/tmp/fake-cert.pem'), (err) => {
    assert.match(err.message, /no subjectAltName for localhost/);
    assert.match(err.message, /WebAuthn/);
    assert.match(err.message, /openssl req -x509/);
    return true;
  });
});

/** Mint a throwaway SAN-less cert in-process. */
function makeSanlessCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-sanless-'));
  try {
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1',
      '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'),
      '-days', '1', '-nodes', '-subj', '/CN=localhost',
    ], { stdio: 'ignore' });
    return fs.readFileSync(path.join(dir, 'cert.pem'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
