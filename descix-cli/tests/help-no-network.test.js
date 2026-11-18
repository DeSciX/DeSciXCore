/**
 * HELP AND VERSION ARE OFFLINE.
 *
 * Measured on 5.0.0 content: `descix --env prod tell-me-how --help` read the workspace wallet,
 * refreshed its OAuth token (invalid_grant), called reconnect_by_wallet, and only then printed
 * help. The help-time bootstrap at the tail of bin/descix.js built an API client and fetched the
 * server's command surface before every help render.
 *
 * Contract: an invocation that only asks for help or the version prints and exits with no
 * network attempt, no wallet read and no file write. Three layers:
 *   1. In-process: bin/descix.js imported with a stubbed api-client and auth-guard; a help
 *      invocation must never construct DeSciXApiClient nor call requireAuth.
 *   2. Child process, real binary, with tests/tools/no-network-preload.mjs making net, tls, dns,
 *      http(s), http2 and fetch throw and recording every attempt and every wallet.json read; a
 *      temp HOME and cwd, with and without a wallet-shaped dummy; the trees must be unchanged.
 *   3. Conformance: every verb and group of the LIVE commander tree (scripts/lib/cli-verb-list.mjs,
 *      the one owner of that list), hidden retired-verb stubs included, run as `<path> --help`
 *      under the same preload, so a verb added later is covered without editing this file.
 *   4. The cached command surface (lib/command-surface-cache.js): with a cache for this API base the
 *      server-admin verbs are hidden (from the listing and from commander's "Did you mean"),
 *      `--admin` shows them, a cache for another base is ignored silently, a cache file that
 *      exists but cannot be used is ignored with one stderr line naming it — all with zero
 *      network attempts.
 *
 * Run: `node --experimental-test-module-mocks --test tests/help-no-network.test.js` from descix-cli/.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildCliVerbList } from '../scripts/lib/cli-verb-list.mjs';
import { getVerbInvokeMap } from '../lib/command-visibility.js';
import { COMMAND_SURFACE_CACHE_VERSION } from '../lib/command-surface-cache.js';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(CLI_ROOT, 'bin', 'descix.js');
const PRELOAD = pathToFileURL(path.join(CLI_ROOT, 'tests', 'tools', 'no-network-preload.mjs')).href;

const DUMMY_WALLET = JSON.stringify({
  walletAddress: '0x0000000000000000000000000000000000000001',
  signature: '0xdummy-signature',
  sessionToken: 'dummy-session-token',
  userId: 'dummy-user',
  oauth: { access_token: 'dummy-access', refresh_token: 'dummy-refresh', expires_at: 1 },
});

/** Every file under `root` with its size and mtime: a write anywhere changes this. */
function snapshot(root) {
  const out = {};
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { out[p + '/'] = 'dir'; walk(p); }
      else { const s = fs.statSync(p); out[p] = `${s.size}:${s.mtimeMs}`; }
    }
  })(root);
  return out;
}

function makeSandbox({ wallet, cache }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-help-offline-'));
  const home = path.join(root, 'home');
  const cwd = path.join(root, 'ws');
  fs.mkdirSync(path.join(home, '.descix'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.descix'), { recursive: true });
  if (wallet) {
    fs.writeFileSync(path.join(home, '.descix', 'wallet.json'), DUMMY_WALLET);
    fs.writeFileSync(path.join(cwd, '.descix', 'wallet.json'), DUMMY_WALLET);
  }
  if (cache) fs.writeFileSync(path.join(home, '.descix', 'command-surface-cache.json'), JSON.stringify(cache));
  return { root, home, cwd, log: path.join(root, 'attempts.log') };
}

/** Run the real binary under the no-network preload; resolve with exit, output, attempts, writes. */
function runOffline(args, { wallet, cache }) {
  const box = makeSandbox({ wallet, cache });
  fs.writeFileSync(box.log, '');
  const before = { ...snapshot(box.home), ...snapshot(box.cwd) };
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('DESCIX_')));
  Object.assign(env, { HOME: box.home, DESCIX_TEST_ATTEMPT_LOG: box.log, NO_COLOR: '1', FORCE_COLOR: '0' });
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, ['--import', PRELOAD, BIN, ...args], { cwd: box.cwd, env });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('close', (code) => {
      const attempts = fs.readFileSync(box.log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
      const after = { ...snapshot(box.home), ...snapshot(box.cwd) };
      const changed = Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k]);
      fs.rmSync(box.root, { recursive: true, force: true });
      resolve({ code, stdout, stderr, attempts, changed });
    });
  });
}

/** Only these are failures: a probe for a wallet's existence is not a read of it, and reading the
 * local command-surface cache is not a network call. */
function offending(attempts) {
  return attempts.filter((a) => !a.kind.startsWith('wallet.probe.') && !a.kind.startsWith('cache.read.'));
}
const cacheReads = (attempts) => attempts.filter((a) => a.kind.startsWith('cache.read.'));

function assertOffline(label, r) {
  assert.deepEqual(offending(r.attempts), [], `${label}: network or wallet-read attempts:\n${JSON.stringify(r.attempts, null, 1)}\nstderr:\n${r.stderr}`);
  assert.deepEqual(r.changed, [], `${label}: files written under HOME or cwd: ${r.changed.join(', ')}`);
}

// ── 2. Representative invocations, real binary, network blocked ──────────────────────────────

const REPRESENTATIVE = [
  { args: ['--help'], code: 0, out: /Usage: descix/ },
  { args: ['-h'], code: 0, out: /Usage: descix/ },
  { args: ['help'], code: 0, out: /Usage: descix/ },
  { args: ['help', 'site'], code: 0, out: /Usage: descix site/ },
  { args: ['tell-me-how', '--help'], code: 0, out: /Usage: descix tell-me-how/ },
  { args: ['--env', 'prod', 'tell-me-how', '--help'], code: 0, out: /Usage: descix tell-me-how/ },
  { args: ['--api-url', 'https://descix.net', 'tell-me-how', '-h'], code: 0, out: /Usage: descix tell-me-how/ },
  { args: ['site', 'upload', '--help'], code: 0, out: /Usage: descix site upload/ },
  { args: ['app', 'media-upload', '--help'], code: 0, out: /Usage: descix app media-upload/ },
  { args: ['app', 'help', 'media-upload'], code: 0, out: /Usage: descix app media-upload/ },
  { args: ['--version'], code: 0, out: /^\d+\.\d+\.\d+/ },
  { args: ['-V'], code: 0, out: /^\d+\.\d+\.\d+/ },
  { args: [], code: 1, out: /Usage: descix/ }, // bare: commander prints help on stderr and exits 1
  { args: ['app'], code: 1, out: /Usage: descix app/ }, // bare group: same
  { args: ['no-such-verb'], code: 1, out: /unknown command 'no-such-verb'/ },
  { args: ['no-such-verb', '--help'], code: 1, out: /unknown command 'no-such-verb'/ },
];

for (const wallet of [false, true]) {
  for (const c of REPRESENTATIVE) {
    const label = `descix ${c.args.join(' ') || '(bare)'} [${wallet ? 'dummy wallet present' : 'no wallet'}]`;
    test(`${label}: prints, exits ${c.code}, no network, no wallet read, no write`, async () => {
      const r = await runOffline(c.args, { wallet });
      assertOffline(label, r);
      assert.equal(r.code, c.code, `${label}: exit ${r.code}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
      assert.match(r.stdout + r.stderr, c.out, `${label}: expected output missing`);
    });
  }
}

test('the preload is a working gate: a real command that calls the server is caught', async () => {
  // Negative control for the instrument: `credits balance` needs the server, so the preload must
  // record an attempt (and the dummy wallet read) — otherwise every pass above measures nothing.
  const r = await runOffline(['--api-url', 'https://descix.invalid', 'credits', 'balance'], { wallet: true });
  const kinds = r.attempts.map((a) => a.kind);
  assert.ok(kinds.some((k) => k.startsWith('wallet.read.')), `expected a wallet read; got ${JSON.stringify(kinds)}`);
  assert.ok(kinds.some((k) => !k.startsWith('wallet.')), `expected a blocked network attempt; got ${JSON.stringify(kinds)}`);
});

// ── 3. Conformance: every verb and group of the live tree ───────────────────────────────────

test('every verb and group in the live commander tree, hidden stubs included: `<path> --help` makes no network attempt and reads no wallet', async () => {
  // includeHidden: the `{ hidden: true }` retired-verb stubs are run too.
  const verbs = buildCliVerbList({ includeHidden: true });
  assert.ok(verbs.some((v) => v.hidden), 'the walk must include the hidden retired-verb stubs');
  const paths = new Set();
  // A retired stub refuses by name and exits 1 even for --help (lib/commands/retired-verbs.js);
  // for those only "no network, no wallet read, no write" is asserted, not the exit code.
  const refusing = new Set();
  for (const { verbPath, hidden } of verbs) {
    const tokens = verbPath.split(' ');
    for (let i = 1; i <= tokens.length; i++) {
      const p = tokens.slice(0, i).join(' ');
      paths.add(p);
      if (hidden) refusing.add(p);
    }
  }
  assert.ok(paths.size > 50, `the live tree walk returned only ${paths.size} paths`);

  const failures = [];
  const queue = [...paths].sort();
  const POOL = 4;
  await Promise.all(Array.from({ length: POOL }, async () => {
    while (queue.length) {
      const p = queue.shift();
      const r = await runOffline([...p.split(' '), '--help'], { wallet: true });
      const bad = offending(r.attempts);
      if (bad.length || r.changed.length || (r.code !== 0 && !refusing.has(p))) {
        failures.push(`descix ${p} --help: exit ${r.code}, attempts ${JSON.stringify(bad)}, writes ${JSON.stringify(r.changed)}`);
      }
    }
  }));
  assert.deepEqual(failures, [], `${failures.length} of ${paths.size} help paths are not offline:\n${failures.join('\n')}`);
});

// ── 4. The cached command surface: hiding without the network ───────────────────────────────

const ADMIN_VERBS = ['site delete', 'community create', 'credits grant'];
const ORIGIN = 'https://descix.net';

/** A cache classing every command the ADMIN_VERBS invoke as 'admin', for `origin`. */
function cacheFor(origin) {
  const map = getVerbInvokeMap();
  const commands = {};
  for (const verb of ADMIN_VERBS) {
    assert.ok(map[verb]?.length, `fixture: ${verb} must invoke at least one command`);
    for (const c of map[verb]) commands[c] = 'admin';
  }
  return { version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { [origin]: { fetchedAt: '2026-11-18T00:00:00.000Z', manifest_hash: null, commands } } };
}

/** Is `verb` listed in the help for its parent group? */
async function listed(verb, extra, opts) {
  const [group, name] = verb.split(' ');
  const r = await runOffline([...extra, '--api-url', ORIGIN, group, '--help'], opts);
  assertOffline(`descix ${extra.join(' ')} ${group} --help`, r);
  assert.equal(r.code, 0, r.stderr);
  return new RegExp(`^\\s+${name}\\b`, 'm').test(r.stdout);
}

test('no cache: the admin verbs are listed (static hiding only), with zero network', async () => {
  for (const verb of ADMIN_VERBS) assert.equal(await listed(verb, [], { wallet: true }), true, verb);
});

test('a cache for this origin: the admin verbs are hidden from default help, with zero network and no wallet read', async () => {
  for (const verb of ADMIN_VERBS) assert.equal(await listed(verb, [], { wallet: true, cache: cacheFor(ORIGIN) }), false, verb);
});

test('a cache for this origin: --admin lists them again', async () => {
  for (const verb of ADMIN_VERBS) assert.equal(await listed(verb, ['--admin'], { wallet: true, cache: cacheFor(ORIGIN) }), true, verb);
});

test('a cache for ANOTHER origin is ignored (a DEV surface never hides PROD help)', async () => {
  for (const verb of ADMIN_VERBS) assert.equal(await listed(verb, [], { wallet: true, cache: cacheFor('https://dev.descix.net') }), true, verb);
});

test('a wrong-version, malformed or oversized cache: one stderr line naming the file, stdout as with no cache, exit 0', async () => {
  const none = await runOffline(['--api-url', ORIGIN, 'site', '--help'], { wallet: true });
  assert.equal(none.stderr, '', 'an absent cache file is silent');
  const big = cacheFor(ORIGIN);
  big.padding = 'x'.repeat(1024 * 1024 + 1);
  for (const [cache, why] of [
    [{ ...cacheFor(ORIGIN), version: 0 }, /is not version 1/],
    [{ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: [] }, /has no apiBases map/],
    ['not an object', /is not version 1/], // the sandbox writes JSON.stringify(cache): a JSON string
    [big, /is over 1048576 bytes/],
  ]) {
    const r = await runOffline(['--api-url', ORIGIN, 'site', '--help'], { wallet: true, cache });
    assertOffline('unusable cache', r);
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, none.stdout, 'stdout is exactly the no-cache listing');
    const lines = r.stderr.split('\n').filter(Boolean);
    assert.equal(lines.length, 1, `one stderr line: ${JSON.stringify(lines)}`);
    assert.match(lines[0], why);
    assert.match(lines[0], /\/\.descix\/command-surface-cache\.json /, 'names the file');
    assert.match(lines[0], /admin hiding is off/);
    assert.match(lines[0], /`descix whoami` rewrites it/);
  }
});

test('a cache for another API base on the same host is silent and hides nothing; the matching path hides', async () => {
  const other = await runOffline(['--api-url', 'https://gw.test/team-b', 'site', '--help'], { wallet: true, cache: cacheFor('https://gw.test/team-a') });
  assertOffline('other path', other);
  assert.equal(other.stderr, '');
  assert.match(other.stdout, /^\s+delete\b/m);
  const same = await runOffline(['--api-url', 'https://gw.test/team-a/', 'site', '--help'], { wallet: true, cache: cacheFor('https://gw.test/team-a') });
  assertOffline('same path', same);
  assert.doesNotMatch(same.stdout, /^\s+delete\b/m);
});

// ── commander's "Did you mean" draws on the same visible list ──────────────────────────────────

test('an unknown command near a cache-hidden admin verb: no suggestion names it, exit 1, zero network', async () => {
  const control = await runOffline(['--api-url', ORIGIN, 'site', 'delet'], { wallet: true });
  assertOffline('site delet, no cache', control);
  assert.equal(control.code, 1);
  assert.match(control.stderr, /unknown command 'delet'/);
  assert.match(control.stderr, /Did you mean delete\?/, 'positive control: with no cache commander suggests it');

  const hidden = await runOffline(['--api-url', ORIGIN, 'site', 'delet'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('site delet, cache', hidden);
  assert.equal(hidden.code, 1);
  assert.match(hidden.stderr, /unknown command 'delet'/);
  assert.doesNotMatch(hidden.stderr, /delete\?/, `a hidden admin verb was suggested:\n${hidden.stderr}`);

  const top = await runOffline(['--api-url', ORIGIN, 'credits', 'gran'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('credits gran, cache', top);
  assert.doesNotMatch(top.stderr, /grant\?/, top.stderr);

  const admin = await runOffline(['--admin', '--api-url', ORIGIN, 'site', 'delet'], { wallet: true, cache: cacheFor(ORIGIN) });
  assert.match(admin.stderr, /Did you mean delete\?/, '--admin suggests it again');
});

test('`<group> <unknown> --help`: the help guard does not name a cache-hidden admin verb either', async () => {
  const control = await runOffline(['--api-url', ORIGIN, 'site', 'delet', '--help'], { wallet: true });
  assertOffline('site delet --help, no cache', control);
  assert.equal(control.code, 1);
  assert.match(control.stderr, /'descix site' has: .*\bdelete\b/, 'positive control: with no cache the guard names it');
  const hidden = await runOffline(['--api-url', ORIGIN, 'site', 'delet', '--help'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('site delet --help, cache', hidden);
  assert.equal(hidden.code, 1);
  assert.match(hidden.stderr, /unknown command 'delet'/);
  assert.match(hidden.stderr, /'descix site' has: .*\bupload\b/);
  assert.doesNotMatch(hidden.stderr, /\bdelete\b/, hidden.stderr);
  assert.equal(hidden.stdout, '', 'no help is printed for an unknown command');
});

test('an unknown command still suggests a visible verb when a cache applies', async () => {
  const r = await runOffline(['--api-url', ORIGIN, 'site', 'uplod'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('site uplod', r);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /Did you mean upload\?/);
});

test('the default origin picks the cache too (no --api-url, no workspace)', async () => {
  const r = await runOffline(['site', '--help'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('default-origin cache', r);
  assert.doesNotMatch(r.stdout, /^\s+delete\b/m);
});

// ── 5. Only help reads the cache; origin trouble never fails help or --version ───────────────

test('--env bogus --version prints the version and exits 0 (origin resolution never runs for --version)', async () => {
  const r = await runOffline(['--env', 'bogus', '--version'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('--env bogus --version', r);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^\d+\.\d+\.\d+/);
  assert.deepEqual(cacheReads(r.attempts), [], '--version does not read the cache');
});

test('--env bogus --help prints help, applies no cache, exits 0', async () => {
  const r = await runOffline(['--env', 'bogus', 'site', '--help'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('--env bogus site --help', r);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^\s+delete\b/m, 'an unknown --env is "no cache": site delete stays listed');
  assert.doesNotMatch(r.stderr, /Unknown environment/);
});

test('a help render reads the cache (positive control for the next test)', async () => {
  const r = await runOffline(['site', '--help'], { wallet: true, cache: cacheFor(ORIGIN) });
  assert.ok(cacheReads(r.attempts).length > 0, JSON.stringify(r.attempts));
});

test('a real command path does not read the cache at all', async () => {
  const r = await runOffline(['--api-url', 'https://descix.invalid', 'credits', 'balance'], { wallet: true, cache: cacheFor('https://descix.invalid') });
  assert.ok(r.attempts.some((a) => !a.kind.startsWith('wallet.') && !a.kind.startsWith('cache.')), 'the command did run (it tried the network)');
  assert.deepEqual(cacheReads(r.attempts), [], `an action read the cache: ${JSON.stringify(r.attempts)}`);
});

test('`--env x` after the `--` terminator is not taken as the option', async () => {
  // A raw argv scan would see --env bogus, call it "no cache" and list site delete; commander
  // stops option parsing at `--`, so the default origin's cache applies and it is hidden.
  const r = await runOffline(['site', '--help', '--', '--env', 'bogus'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('site --help -- --env bogus', r);
  assert.equal(r.code, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /^\s+delete\b/m);
});

test('an origin key differing only in case, port or trailing slash finds the same cache', async () => {
  const r = await runOffline(['--api-url', 'HTTPS://Descix.NET:443/', 'site', '--help'], { wallet: true, cache: cacheFor(ORIGIN) });
  assertOffline('mixed-case origin', r);
  assert.doesNotMatch(r.stdout, /^\s+delete\b/m);
});

// ── 1. In-process: the client is never built for help ───────────────────────────────────────

test('in-process: `tell-me-how --help` never constructs DeSciXApiClient nor calls requireAuth', async () => {
  const calls = { construct: 0, requireAuth: 0 };
  class StubClient {
    constructor() { calls.construct++; }
  }
  mock.module(path.join(CLI_ROOT, 'lib', 'api-client.js'), {
    defaultExport: StubClient,
    namedExports: {
      DeSciXApiClient: StubClient,
      createApiClient: () => { calls.construct++; return new StubClient(); },
      resolveEffectiveOrigin: async () => ({ origin: 'https://descix.net', source: 'default', isDefault: true }),
    },
  });
  mock.module(path.join(CLI_ROOT, 'lib', 'auth-guard.js'), {
    namedExports: {
      requireAuth: async () => { calls.requireAuth++; },
      isAuthenticated: async () => { calls.requireAuth++; return false; },
    },
  });

  const savedArgv = process.argv;
  const savedExit = process.exit;
  const savedWrite = process.stdout.write;
  let exitCode;
  let printed = '';
  class Exited extends Error {}
  process.argv = [process.execPath, BIN, 'tell-me-how', '--help'];
  process.exit = (code) => { exitCode = code; throw new Exited(); };
  process.stdout.write = (chunk) => { printed += chunk; return true; };
  try {
    await import(pathToFileURL(BIN).href + '?help-in-process');
  } catch (e) {
    if (!(e instanceof Exited) && e?.code !== 'commander.helpDisplayed') throw e;
  } finally {
    process.argv = savedArgv;
    process.exit = savedExit;
    process.stdout.write = savedWrite;
    mock.reset();
  }
  assert.match(printed, /Usage: descix tell-me-how/);
  assert.equal(exitCode ?? 0, 0);
  assert.deepEqual(calls, { construct: 0, requireAuth: 0 });
});
