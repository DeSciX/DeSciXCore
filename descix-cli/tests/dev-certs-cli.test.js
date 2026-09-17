/**
 * `descix dev-certs check` / `descix dev-certs trust` — CLI wiring.
 *
 * `node:child_process` is stubbed ONCE at module scope via `mock.module`
 * (Node's built-in module mocker, `--experimental-test-module-mocks`, wired
 * into this package's `test` script) — BEFORE the command module is
 * dynamically imported, so `checkDevCert` (inside @descix/app-sdk) and this
 * file's own `execSync` calls both bind to the stub. Individual tests switch
 * behavior through the mutable `scenario` object rather than re-registering
 * the mock (mock.module refuses a second registration for an already-mocked
 * specifier without an intervening `.restore()`, and restoring would also
 * un-bind the already-imported command module).
 *
 * Never touches the real keychain: `execSync` here is 100% stubbed, so
 * `dev-certs trust` never runs the real `security add-trusted-cert`.
 *
 * Run: `node --experimental-test-module-mocks --test tests/dev-certs-cli.test.js`
 * (wired into `npm test` via package.json).
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// One mutable scenario, read by the stubbed child_process calls at CALL TIME.
const scenario = {
  security: () => Buffer.from('ok'),          // execFileSync('security', ...)
  execSyncCalls: [],
};

mock.module('node:child_process', {
  namedExports: {
    execFileSync: (...args) => scenario.security(...args),
    execSync: (...args) => {
      scenario.execSyncCalls.push(args);
      return Buffer.from('');
    },
  },
});

const { runDevCertsCheck, runDevCertsTrust } = await import('../lib/commands/dev-certs.js');

/**
 * Point a workspace's env.devCerts at `dir` — otherwise resolveGatewayCertContext
 * finds no workspace and falls back to the SHIPPED pair, which is a different
 * cert than the one these tests generate. This mirrors `descix config
 * set-dev-certs --dir <dir>`.
 */
function writeWorkspaceDevCerts(dir) {
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.descix', 'workspace.json'),
    JSON.stringify({ env: { devCerts: { dir } } }, null, 2)
  );
}

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

/** Run `fn` with process.cwd() set to `dir`, restoring afterward even on throw. */
async function withCwd(dir, fn) {
  const prev = process.cwd();
  process.chdir(dir);
  try {
    return await fn();
  } finally {
    process.chdir(prev);
  }
}

/**
 * Save/restore process.exitCode around a call — commands under test SET it,
 * never exit(). Returns the exitCode fn left behind; a throw from fn still
 * propagates (finally only restores the AMBIENT exitCode, it must never
 * swallow the call's own exception the way `return` inside finally would).
 */
async function withExitCode(fn) {
  const prev = process.exitCode;
  process.exitCode = undefined;
  try {
    await fn();
    return process.exitCode;
  } finally {
    process.exitCode = prev;
  }
}

function silenceConsole(fn) {
  const log = console.log; const err = console.error;
  console.log = () => {}; console.error = () => {};
  try { return fn(); } finally { console.log = log; console.error = err; }
}

// -------------------------------------------------------------------- check

test('dev-certs check: trusted cert -> exit 0, json includes resolved certPath', () =>
  withTmpDir('devcerts-cli-', (dir) =>
    withCwd(dir, async () => {
      writeWorkspaceDevCerts(dir);
      const certPath = makeGoodCert(dir);
      scenario.security = () => Buffer.from('ok');
      let printed = '';
      const origLog = console.log;
      console.log = (s) => { printed += s; };
      let exitCode;
      try {
        exitCode = await withExitCode(async () => {
          await runDevCertsCheck({ json: true });
        });
      } finally {
        console.log = origLog;
      }
      assert.equal(exitCode, 0);
      const parsed = JSON.parse(printed);
      assert.equal(parsed.certPath, certPath);
      assert.equal(parsed.status, 'trusted');
    })));

test('dev-certs check: untrusted cert -> exit 1, prints resolved cert path (text mode)', () =>
  withTmpDir('devcerts-cli-', (dir) =>
    withCwd(dir, async () => {
      writeWorkspaceDevCerts(dir);
      const certPath = makeGoodCert(dir);
      scenario.security = () => { throw Object.assign(new Error('x'), { status: 1, stdout: Buffer.from('a'), stderr: Buffer.from('CSSMERR_TP_NOT_TRUSTED') }); };
      let printed = '';
      const origLog = console.log;
      console.log = (s) => { printed += s + '\n'; };
      let exitCode;
      try {
        exitCode = await withExitCode(async () => {
          await runDevCertsCheck({});
        });
      } finally {
        console.log = origLog;
      }
      assert.equal(exitCode, 1);
      assert.match(printed, new RegExp(certPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(printed, /untrusted/);
    })));

test('dev-certs check: expired cert -> exit non-zero, reason names the expiry', () =>
  withTmpDir('devcerts-cli-', (dir) => withCwd(dir, async () => {
    writeWorkspaceDevCerts(dir);
    const certPath = path.join(dir, 'cert.pem');
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1',
      '-keyout', path.join(dir, 'key.pem'), '-out', certPath,
      '-nodes', '-subj', '/O=DeSciX Dev/CN=localhost',
      '-not_before', '20200101000000Z', '-not_after', '20200102000000Z',
      '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1',
    ], { stdio: 'ignore' });

    let printed = '';
    const origLog = console.log;
    console.log = (s) => { printed += s + '\n'; };
    let exitCode;
    try {
      exitCode = await withExitCode(async () => { await runDevCertsCheck({ json: true }); });
    } finally {
      console.log = origLog;
    }
    assert.notEqual(exitCode, 0);
    const parsed = JSON.parse(printed);
    assert.equal(parsed.status, 'expired');
    assert.match(parsed.detail, /expired on/);
  })));

// -------------------------------------------------------------------- trust

test('dev-certs trust: already trusted -> no execSync call, no keychain touch', () =>
  withTmpDir('devcerts-cli-', (dir) => withCwd(dir, async () => {
    makeGoodCert(dir);
    scenario.security = () => Buffer.from('ok');
    scenario.execSyncCalls = [];
    await silenceConsole(() => runDevCertsTrust());
    assert.equal(scenario.execSyncCalls.length, 0, 'must not touch the keychain when already trusted');
  })));

test('dev-certs trust: untrusted -> runs the EXACT trustCertCommand, then re-checks', () =>
  withTmpDir('devcerts-cli-', (dir) => withCwd(dir, async () => {
    writeWorkspaceDevCerts(dir);
    const certPath = makeGoodCert(dir);
    scenario.execSyncCalls = [];
    let calls = 0;
    scenario.security = () => {
      calls++;
      if (calls === 1) throw Object.assign(new Error('x'), { status: 1, stdout: Buffer.from(''), stderr: Buffer.from('CSSMERR_TP_NOT_TRUSTED') });
      return Buffer.from('ok'); // trusted on the re-check after "trusting"
    };
    await silenceConsole(() => runDevCertsTrust());
    assert.equal(scenario.execSyncCalls.length, 1);
    const [cmd] = scenario.execSyncCalls[0];
    assert.match(cmd, /^security add-trusted-cert -r trustRoot -k /);
    assert.match(cmd, new RegExp(certPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  })));

test('dev-certs trust: a structurally broken cert (expired) refuses, never touches the keychain', () =>
  withTmpDir('devcerts-cli-', (dir) => withCwd(dir, async () => {
    writeWorkspaceDevCerts(dir);
    const certPath = path.join(dir, 'cert.pem');
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1',
      '-keyout', path.join(dir, 'key.pem'), '-out', certPath,
      '-nodes', '-subj', '/O=DeSciX Dev/CN=localhost',
      '-not_before', '20200101000000Z', '-not_after', '20200102000000Z',
      '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1',
    ], { stdio: 'ignore' });
    scenario.execSyncCalls = [];
    let exitCode;
    try {
      exitCode = await withExitCode(async () => { await silenceConsole(() => runDevCertsTrust()); });
    } finally { /* nothing extra */ }
    assert.equal(scenario.execSyncCalls.length, 0, 'must refuse before ever shelling out to security');
    assert.equal(exitCode, 1);
  })));

test('dev-certs trust: non-darwin refuses loud, prints the resolved cert path for manual import, never shells out', () =>
  withTmpDir('devcerts-cli-', (dir) => withCwd(dir, async () => {
    writeWorkspaceDevCerts(dir);
    const certPath = makeGoodCert(dir);
    scenario.execSyncCalls = [];
    // checkDevCert only reaches `security` on darwin — force the non-darwin
    // branch and make the (never-reached-if-correct) security stub throw, so
    // an accidental darwin-path call fails the test loudly rather than
    // silently reporting 'trusted'.
    scenario.security = () => { throw new Error('must not call security on non-darwin'); };
    const platformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    let printed = '';
    const origErr = console.error;
    console.error = (s) => { printed += s + '\n'; };
    let exitCode;
    try {
      exitCode = await withExitCode(async () => { await runDevCertsTrust(); });
    } finally {
      console.error = origErr;
      Object.defineProperty(process, 'platform', platformDesc);
    }
    assert.equal(exitCode, 1);
    assert.equal(scenario.execSyncCalls.length, 0, 'must never shell out on a platform it cannot verify');
    assert.match(printed, /Cannot trust automatically on linux/);
    assert.match(printed, new RegExp(certPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  })));

// ------------------------------------------------------- workspace precedence

test('check/trust act on env.devCerts when the workspace sets one, else the shipped pair', () =>
  withTmpDir('devcerts-cli-ws-', (wsRoot) => withTmpDir('devcerts-cli-fixture-', (fixtureDir) =>
    withCwd(wsRoot, async () => {
      const fixtureCert = makeGoodCert(fixtureDir);
      fs.mkdirSync(path.join(wsRoot, '.descix'), { recursive: true });
      fs.writeFileSync(
        path.join(wsRoot, '.descix', 'workspace.json'),
        JSON.stringify({ env: { devCerts: { dir: fixtureDir } } }, null, 2)
      );
      scenario.security = () => Buffer.from('ok');
      let printed = '';
      const origLog = console.log;
      console.log = (s) => { printed += s; };
      try {
        await withExitCode(async () => { await runDevCertsCheck({ json: true }); });
      } finally {
        console.log = origLog;
      }
      const parsed = JSON.parse(printed);
      assert.equal(parsed.certPath, fixtureCert, 'must resolve the WORKSPACE cert, not the shipped default');
    }))));
