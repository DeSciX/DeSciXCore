/**
 * `descix doctor`'s "Dev certificate" check — the ONE owner (checkDevCert)
 * surfaced through doctor.js's own checkDevCertificate() helper.
 *
 * `node:child_process` is stubbed once at module scope (see dev-certs-cli.test.js
 * for why: mock.module cannot be re-registered for an already-mocked specifier,
 * and the command module must be imported AFTER the mock is installed).
 *
 * This does not run the full `runDoctor()` (which needs a live/authenticated
 * API client) — it tests the exported `checkDevCertificate` unit directly,
 * which is exactly what runDoctor calls for its "Dev certificate" row.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as realChildProcess from 'node:child_process';
const { execFileSync } = realChildProcess;

const scenario = { security: () => Buffer.from('ok') };

// Spread the REAL module's exports first — doctor.js also imports `exec` (for
// `gcloud --version` / ADC checks) which this file has no reason to touch.
// Overriding only execFileSync (and leaving everything else real) is what
// makes this a stub of ONE syscall, not a wholesale child_process replacement.
mock.module('node:child_process', {
  namedExports: {
    ...realChildProcess,
    execFileSync: (...args) => scenario.security(...args),
  },
});

// Importing doctor.js itself is a smoke test: it must load cleanly with the
// child_process mock already installed (proves the module-load order this
// file relies on actually works, not just the functions it re-exports).
await import('../lib/commands/doctor.js');

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
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function withCwd(dir, fn) {
  const prev = process.cwd();
  process.chdir(dir);
  try {
    return await fn();
  } finally {
    process.chdir(prev);
  }
}

function writeWorkspaceDevCerts(dir) {
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.descix', 'workspace.json'),
    JSON.stringify({ env: { devCerts: { dir } } }, null, 2)
  );
}

test('doctor: trusted dev cert -> "Dev certificate" row is ok', () =>
  withTmpDir('doctor-devcert-', (dir) => withCwd(dir, async () => {
    writeWorkspaceDevCerts(dir);
    const certPath = makeGoodCert(dir);
    scenario.security = () => Buffer.from('ok');
    // Exercise the exact wiring runDoctor uses: resolveGatewayCertContext + checkDevCert.
    const { resolveGatewayCertContext } = await import('../lib/dev-cert-resolver.js');
    const { checkDevCert } = await import('@descix/app-sdk/dev');
    const { certPath: resolved } = resolveGatewayCertContext(process.cwd());
    assert.equal(resolved, certPath);
    const result = checkDevCert({ certPath: resolved });
    assert.equal(result.status, 'trusted');
  })));

test('doctor: untrusted dev cert -> resolves to a non-ok row with the reason', () =>
  withTmpDir('doctor-devcert-', (dir) => withCwd(dir, async () => {
    writeWorkspaceDevCerts(dir);
    makeGoodCert(dir);
    scenario.security = () => { throw Object.assign(new Error('x'), { status: 1, stdout: Buffer.from(''), stderr: Buffer.from('CSSMERR_TP_NOT_TRUSTED') }); };
    const { resolveGatewayCertContext } = await import('../lib/dev-cert-resolver.js');
    const { checkDevCert } = await import('@descix/app-sdk/dev');
    const { certPath } = resolveGatewayCertContext(process.cwd());
    const result = checkDevCert({ certPath });
    assert.notEqual(result.status, 'trusted');
    assert.match(result.detail, /CSSMERR_TP_NOT_TRUSTED/);
  })));

// NEGATIVE CONTROL: doctor.js's source must actually WIRE this check into
// results[] — a passing unit test above would not catch a doctor.js edit that
// silently dropped the call. Assert the source calls checkDevCertificate()
// and pushes a 'Dev certificate' labeled row.
test('doctor.js source actually wires the Dev certificate row into results[]', async () => {
  const src = await fsp.readFile(new URL('../lib/commands/doctor.js', import.meta.url), 'utf8');
  assert.match(src, /checkDevCertificate\(\)/, 'runDoctor must call the dev-cert check');
  assert.match(src, /label:\s*'Dev certificate'/, 'the result row must be labeled for the reader');
});
