/**
 * `descix microservice register-delegate` IS DELETED, AND REFUSED BY NAME.
 *
 * CEO-D-2026-06-02-APP-DATA-PLANE: an app microservice writes on the INJECTED CALLER auth
 * (`params._descix`) with per-app_id isolation, never a per-service delegate SERVICE_KEY.
 * CEO 2026-09-29: "There is no per app service account registration for microservices."
 *
 * The verb used to generate a keypair, bind it through `register_delegate`, and write a
 * SERVICE_KEY into dev-overrides.json, and its help told a developer to run it on any HTTP 401.
 * It now exits non-zero naming the caller-auth path, and nothing the package ships recommends it.
 *
 * Runs the REAL binary in a temp dir with no credentials. Run:
 *   node --test tests/register-delegate-removed.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(PKG_ROOT, 'bin', 'descix.js');
const RULING = 'CEO-D-2026-06-02-APP-DATA-PLANE';

function inTempDir(fn) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'no-delegate-')));
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

function assertNamesCallerAuth(out, where) {
  assert.match(out, /params\._descix/, `${where}: must name the injected caller auth`);
  assert.match(out, /createServiceApiClient/, `${where}: must name the outbound developer-credential client`);
  assert.match(out, new RegExp(RULING), `${where}: must name the ruling`);
}

test('microservice register-delegate exits non-zero naming caller auth, and writes no key', () => {
  inTempDir((dir) => {
    for (const args of [
      ['microservice', 'register-delegate'],
      ['microservice', 'register-delegate', '-a', 'x', '-c', 'y', '-s', 'sub_free_tier'],
      ['microservice', 'register-delegate', '--help'],
    ]) {
      const r = cli(dir, args);
      assert.notEqual(r.code, 0, `${args.join(' ')}: a removed verb must not exit 0`);
      assert.match(r.out, /register-delegate/, `${args.join(' ')}: refusal must name what was typed`);
      assertNamesCallerAuth(r.out, args.join(' '));
      assert.doesNotMatch(r.out, /Registering Service Delegate Key/);
      assert.equal(fs.existsSync(path.join(dir, 'dev-overrides.json')), false, 'no SERVICE_KEY file may be written');
    }
  });
});

test('microservice --help no longer lists register-delegate (control: it lists register)', () => {
  inTempDir((dir) => {
    const { out } = cli(dir, ['microservice', '--help']);
    assert.doesNotMatch(out, /register-delegate/);
    assert.match(out, /\bregister\b/, 'control: the help text is being read at all');
  });
});

test('microservice register --help names the caller-auth path for a 401', () => {
  inTempDir((dir) => {
    const { out } = cli(dir, ['microservice', 'register', '--help']);
    assertNamesCallerAuth(out, 'register --help');
    assert.match(out, /401/, 'the 401 troubleshooting lives on the verb a developer actually runs');
    assert.doesNotMatch(out, /register-delegate/);
  });
});

/** The files npm will actually put in the tarball (same authority as retired-verbs-absent-from-pack). */
function packedFiles() {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: PKG_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out.slice(out.indexOf('[')))[0].files.map((f) => f.path);
}

test('nothing the package ships recommends the delegate key', () => {
  const OWNER = 'lib/commands/retired-verbs.js';
  const files = packedFiles();
  assert.ok(files.includes('README.md') && files.includes('bin/descix.js'), 'control: the pack manifest was read');
  const offenders = [];
  for (const rel of files) {
    if (rel === OWNER || !/\.(js|mjs|cjs|md|json|txt)$/.test(rel)) continue;
    const lines = fs.readFileSync(path.join(PKG_ROOT, rel), 'utf8').split('\n');
    lines.forEach((line, i) => {
      // The verb name may appear only in the owner, and in the generated verb map where the
      // refusal registration is recorded with NO invokes.
      if (/register[-_]delegate/.test(line) && !(rel === 'lib/verb-invokes.generated.json' && /"microservice register-delegate": \[\]/.test(line))) {
        offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
      // The key's artifacts may be NAMED only to say they do not exist.
      if (/SERVICE_KEY|X-NFT-ID|DESCIX_NFT_ID|DESCIX_SESSION_KEY/.test(line) && !/\bNO\b/.test(line)) {
        offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `shipped delegate-key recommendations:\n${offenders.join('\n')}`);
  assert.ok(files.includes(OWNER), 'the refusal owner ships');
});
