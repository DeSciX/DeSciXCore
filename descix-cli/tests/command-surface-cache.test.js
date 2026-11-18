/**
 * lib/command-surface-cache.js — the one owner of ~/.descix/command-surface-cache.json.
 *
 * Read: offline, per API base. Anything but a valid current-version entry for THIS base is no
 * surface; a file that exists but cannot be used also carries one `problem` line naming it. Write: refreshCommandSurface (login/whoami) fetches `get_command_surface` on the
 * client's session and merges its origin in. A failed refresh says one line and never throws.
 *
 * Run: `node --test tests/command-surface-cache.test.js` from descix-cli/.
 */
import { test, beforeEach, afterEach, mock } from 'node:test';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  readCommandSurface,
  refreshCommandSurface,
  refreshCommandSurfaceOrSay,
  commandSurfaceCachePath,
  commandSurfaceCacheKey,
  COMMAND_SURFACE_CACHE_VERSION,
  COMMAND_SURFACE_CACHE_MAX_BYTES,
} from '../lib/command-surface-cache.js';

let home;
let savedHome;
beforeEach(() => {
  savedHome = process.env.HOME;
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-surface-cache-'));
  process.env.HOME = home;
});
afterEach(() => {
  process.env.HOME = savedHome;
  fs.rmSync(home, { recursive: true, force: true });
});

const write = (v) => {
  fs.mkdirSync(path.dirname(commandSurfaceCachePath()), { recursive: true });
  fs.writeFileSync(commandSurfaceCachePath(), typeof v === 'string' ? v : JSON.stringify(v));
};
/** The surface alone (asserting no problem line), for the cases about a usable file. */
const surfaceOf = (base) => { const r = readCommandSurface(base); assert.equal(r.problem, null, r.problem); return r.surface; };
const entry = (commands = { grant_credits: 'admin', tell_me_how: 'public' }) => ({ fetchedAt: '2026-11-18T00:00:00.000Z', manifest_hash: 'h', commands });

function client({ baseUrl = 'https://descix.net/', answer, fail } = {}) {
  const calls = [];
  return {
    calls,
    baseUrl,
    async ensureInitialized() { calls.push('init'); },
    async invoke(cmd, params, opts) {
      calls.push({ cmd, opts });
      if (fail) throw new Error(fail);
      return answer ?? { status: 'OK', message: { service: 'daita', manifest_hash: 'h1', commands: { grant_credits: 'admin' } } };
    },
  };
}

test('the file lives at ~/.descix/command-surface-cache.json under the current HOME', () => {
  assert.equal(commandSurfaceCachePath(), path.join(home, '.descix', 'command-surface-cache.json'));
});

test('read: a valid entry for this API base (trailing slash normalized)', () => {
  write({ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': entry() } });
  assert.deepEqual(readCommandSurface('https://descix.net/'), { surface: { commands: entry().commands, fetchedAt: entry().fetchedAt }, problem: null });
});

test('read: no file, or a valid file with no entry for this base, is no surface and says nothing', () => {
  assert.deepEqual(readCommandSurface('https://descix.net'), { surface: null, problem: null }, 'missing');
  write({ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://dev.descix.net': entry() } });
  assert.deepEqual(readCommandSurface('https://descix.net'), { surface: null, problem: null }, 'another base');
  assert.deepEqual(readCommandSurface(null), { surface: null, problem: null });
});

test('read: a file that exists but cannot be used is no surface AND one problem line naming the file', () => {
  for (const [bad, why] of [
    [{ version: 0, apiBases: { 'https://descix.net': entry() } }, /is not version 1/],
    [{ apiBases: { 'https://descix.net': entry() } }, /is not version 1/],
    ['{not json', /is not JSON/],
    ['null', /is not version 1/],
    [{ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: [] }, /has no apiBases map/],
    [{ version: COMMAND_SURFACE_CACHE_VERSION, origins: { 'https://descix.net': entry() } }, /has no apiBases map/],
    [{ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': { commands: { a: 'admin' } } } }, /malformed entry for https:\/\/descix\.net/],
    [{ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': entry({ a: 'secret' }) } }, /malformed entry/],
    [{ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': { ...entry(), commands: [] } } }, /malformed entry/],
  ]) {
    write(bad);
    const r = readCommandSurface('https://descix.net');
    assert.equal(r.surface, null, JSON.stringify(bad));
    assert.match(r.problem, why, JSON.stringify(bad));
    assert.ok(r.problem.includes(commandSurfaceCachePath()), 'the line names the file');
    assert.match(r.problem, /admin hiding is off/);
    assert.match(r.problem, /`descix whoami` rewrites it/);
    assert.equal(r.problem.split('\n').length, 1, 'one line');
  }
});

/**
 * readCommandSurface in a child process with a deadline: a reader that blocks on a FIFO or reads a
 * device without end is killed at the deadline and reported as such, instead of hanging the suite.
 */
function readInChild(base) {
  const mod = new URL('../lib/command-surface-cache.js', import.meta.url).href;
  const src = `const m = await import(${JSON.stringify(mod)}); process.stdout.write(JSON.stringify(m.readCommandSurface(${JSON.stringify(base)})));`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', src], { env: { ...process.env, HOME: home }, timeout: 5000, maxBuffer: 1024 * 1024, encoding: 'utf8' });
  assert.equal(r.signal, null, `the reader did not finish within 5 s (killed by ${r.signal}): it blocked or ballooned`);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('read: a FIFO at the cache path never blocks: not a regular file, one problem line', { skip: process.platform === 'win32' }, () => {
  fs.mkdirSync(path.dirname(commandSurfaceCachePath()), { recursive: true });
  const made = spawnSync('mkfifo', [commandSurfaceCachePath()]);
  assert.equal(made.status, 0, `mkfifo: ${made.stderr}`);
  const r = readInChild('https://descix.net');
  assert.equal(r.surface, null);
  assert.match(r.problem, /is not a regular file/);
});

test('read: a device (a symlink to /dev/zero) is never read: not a regular file, one problem line', { skip: process.platform === 'win32' }, () => {
  fs.mkdirSync(path.dirname(commandSurfaceCachePath()), { recursive: true });
  fs.symlinkSync('/dev/zero', commandSurfaceCachePath());
  const r = readInChild('https://descix.net');
  assert.equal(r.surface, null);
  assert.match(r.problem, /is not a regular file/);
});

test('read: a directory at the cache path is not a regular file', () => {
  fs.mkdirSync(commandSurfaceCachePath(), { recursive: true });
  const r = readCommandSurface('https://descix.net');
  assert.equal(r.surface, null);
  assert.match(r.problem, /is not a regular file/);
});

test('refresh: fetches get_command_surface on the session (not as a guest) and writes this API base', async () => {
  const c = client();
  const r = await refreshCommandSurface(c);
  assert.equal(r.apiBase, 'https://descix.net');
  assert.equal(r.count, 1);
  assert.deepEqual(c.calls[1], { cmd: 'get_command_surface', opts: { allowGuest: false, skipSessionCheck: true, noAuthRecovery: true } });
  const file = JSON.parse(fs.readFileSync(commandSurfaceCachePath(), 'utf8'));
  assert.equal(file.version, COMMAND_SURFACE_CACHE_VERSION);
  assert.deepEqual(file.apiBases['https://descix.net'].commands, { grant_credits: 'admin' });
  assert.equal(file.apiBases['https://descix.net'].manifest_hash, 'h1');
  assert.deepEqual(surfaceOf('https://descix.net').commands, { grant_credits: 'admin' });
});

test('refresh: keeps other API bases, replaces an invalid file', async () => {
  write({ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://dev.descix.net': entry() } });
  await refreshCommandSurface(client());
  const file = JSON.parse(fs.readFileSync(commandSurfaceCachePath(), 'utf8'));
  assert.deepEqual(Object.keys(file.apiBases).sort(), ['https://descix.net', 'https://dev.descix.net']);
  write('{garbage');
  await refreshCommandSurface(client());
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(commandSurfaceCachePath(), 'utf8')).apiBases), ['https://descix.net']);
});

test('refresh: a wrong-shaped answer throws and writes nothing', async () => {
  await assert.rejects(refreshCommandSurface(client({ answer: { status: 'OK', message: { commands: null } } })), /unexpected shape/);
  await assert.rejects(refreshCommandSurface(client({ answer: { status: 'OK', message: { commands: { a: 'root' } } } })), /unexpected shape/);
  assert.equal(fs.existsSync(commandSurfaceCachePath()), false);
});

test('refreshOrSay: a failure prints ONE plain line and resolves null; the cache is untouched', async () => {
  write({ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': entry() } });
  const lines = [];
  const r = await refreshCommandSurfaceOrSay(client({ fail: 'ECONNREFUSED' }), (l) => lines.push(l));
  assert.equal(r, null);
  assert.deepEqual(lines, ["The help listing's command surface was not refreshed: ECONNREFUSED"]);
  assert.deepEqual(surfaceOf('https://descix.net').commands, entry().commands);
});

test('the two writers are login and whoami, and nothing else calls refresh', () => {
  const cliRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
      if (!p.endsWith('.js') || p.endsWith('command-surface-cache.js')) continue;
      const src = fs.readFileSync(p, 'utf8');
      const n = (src.match(/refreshCommandSurface(OrSay)?\(/g) || []).length;
      if (n) hits.push(`${path.relative(cliRoot, p)}:${n}`);
    }
  })(path.join(cliRoot, 'lib'));
  for (const f of ['bin']) {
    const src = fs.readFileSync(path.join(cliRoot, f, 'descix.js'), 'utf8');
    assert.doesNotMatch(src, /refreshCommandSurface/, 'bin/descix.js only READS the cache');
  }
  assert.deepEqual(hits, ['lib/commands/auth.js:2']);
  const auth = fs.readFileSync(path.join(cliRoot, 'lib', 'commands', 'auth.js'), 'utf8');
  const login = auth.slice(auth.indexOf('export async function loginDevice'), auth.indexOf('export async function loginWallet'));
  const whoami = auth.slice(auth.indexOf('export async function whoami'), auth.indexOf('export async function logout'));
  assert.match(login, /refreshCommandSurfaceOrSay\(apiClient/);
  assert.match(whoami, /refreshCommandSurfaceOrSay\(apiClient/);
});

test('the key is the API base: origin + path without trailing slash, one function for reader and writer; junk is "no cache"', async () => {
  assert.equal(commandSurfaceCacheKey('HTTPS://Descix.NET:443/'), 'https://descix.net');
  assert.equal(commandSurfaceCacheKey('HTTPS://Descix.NET:443/Some/Path//?q=1#h'), 'https://descix.net/Some/Path');
  assert.equal(commandSurfaceCacheKey('https://localhost:4000/'), 'https://localhost:4000');
  assert.equal(commandSurfaceCacheKey('http://x.test:80'), 'http://x.test');
  for (const bad of ['', 'not a url', 'ftp://x.test', null, undefined]) assert.equal(commandSurfaceCacheKey(bad), null, String(bad));
  await refreshCommandSurface(client({ baseUrl: 'HTTPS://Descix.NET:443/' }));
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(commandSurfaceCachePath(), 'utf8')).apiBases), ['https://descix.net']);
  assert.ok(surfaceOf('https://descix.net:443'));
  assert.deepEqual(readCommandSurface('not a url'), { surface: null, problem: null });
  await assert.rejects(refreshCommandSurface(client({ baseUrl: 'nope' })), /not an http\(s\) URL/);
});

test('two gateways on one host under different paths get different entries', async () => {
  await refreshCommandSurface(client({ baseUrl: 'https://gw.test/team-a', answer: { status: 'OK', message: { commands: { grant_credits: 'admin' } } } }));
  await refreshCommandSurface(client({ baseUrl: 'https://gw.test/team-b/', answer: { status: 'OK', message: { commands: { grant_credits: 'public' } } } }));
  const file = JSON.parse(fs.readFileSync(commandSurfaceCachePath(), 'utf8'));
  assert.deepEqual(Object.keys(file.apiBases).sort(), ['https://gw.test/team-a', 'https://gw.test/team-b']);
  assert.deepEqual(surfaceOf('https://gw.test/team-a/').commands, { grant_credits: 'admin' });
  assert.deepEqual(surfaceOf('https://gw.test/team-b').commands, { grant_credits: 'public' });
  assert.equal(surfaceOf('https://gw.test'), null, 'the bare host is a third base, with no entry');
});

test('a file over 1 MiB is not parsed (no cache), and the writer replaces it', async () => {
  const big = { version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': entry() }, padding: 'x'.repeat(COMMAND_SURFACE_CACHE_MAX_BYTES) };
  write(big);
  assert.ok(fs.statSync(commandSurfaceCachePath()).size > COMMAND_SURFACE_CACHE_MAX_BYTES);
  const r = readCommandSurface('https://descix.net');
  assert.equal(r.surface, null);
  assert.match(r.problem, /is over 1048576 bytes/);
  await refreshCommandSurface(client());
  assert.ok(fs.statSync(commandSurfaceCachePath()).size < COMMAND_SURFACE_CACHE_MAX_BYTES);
});

test('the written file is owner-only (0600), and the temp name is random, not derived from the pid', async () => {
  const opened = [];
  const real = fs.openSync;
  mock.method(fs, 'openSync', function (p, flags, mode) { opened.push({ p: String(p), flags, mode }); return real.call(this, p, flags, mode); });
  try {
    await refreshCommandSurface(client());
  } finally {
    mock.restoreAll();
  }
  assert.equal(fs.statSync(commandSurfaceCachePath()).mode & 0o777, 0o600);
  const tmp = opened.filter((o) => o.p.endsWith('.tmp'));
  assert.equal(tmp.length, 1);
  assert.equal(tmp[0].flags, 'wx');
  assert.equal(tmp[0].mode, 0o600);
  assert.match(path.basename(tmp[0].p), /^command-surface-cache\.json\.[0-9a-f]{24}\.tmp$/);
  assert.ok(!tmp[0].p.includes(`.${process.pid}.`), 'the temp name must not be derivable from the pid');
  assert.deepEqual(fs.readdirSync(path.dirname(commandSurfaceCachePath())).filter((f) => f.endsWith('.tmp')), [], 'no temp file is left behind');
});

test('a symlink planted at the old predictable temp name is not followed', async () => {
  const victim = path.join(home, 'victim.txt');
  fs.writeFileSync(victim, 'untouched');
  fs.mkdirSync(path.dirname(commandSurfaceCachePath()), { recursive: true });
  fs.symlinkSync(victim, `${commandSurfaceCachePath()}.${process.pid}.tmp`);
  await refreshCommandSurface(client());
  assert.equal(fs.readFileSync(victim, 'utf8'), 'untouched');
  assert.ok(surfaceOf('https://descix.net'));
});

test('a temp-name collision is retried once with a new name; a second collision throws', async () => {
  const names = [Buffer.alloc(12, 1), Buffer.alloc(12, 2), Buffer.alloc(12, 1), Buffer.alloc(12, 1)];
  const dir = path.dirname(commandSurfaceCachePath());
  fs.mkdirSync(dir, { recursive: true });
  const planted = `${commandSurfaceCachePath()}.${Buffer.alloc(12, 1).toString('hex')}.tmp`;
  fs.writeFileSync(planted, 'occupied');
  let i = 0;
  mock.method(crypto, 'randomBytes', () => names[i++]);
  try {
    await refreshCommandSurface(client());
    assert.equal(i, 2, 'one collision, one retry');
    assert.ok(surfaceOf('https://descix.net'));
    assert.equal(fs.readFileSync(planted, 'utf8'), 'occupied');
    await assert.rejects(refreshCommandSurface(client()), /EEXIST/);
  } finally {
    mock.restoreAll();
  }
});

for (const [step, method] of [['the write', 'writeFileSync'], ['the rename', 'renameSync']]) {
  test(`a failure in ${step} removes the temp file and rethrows; the old cache is untouched`, async () => {
    write({ version: COMMAND_SURFACE_CACHE_VERSION, apiBases: { 'https://descix.net': entry() } });
    mock.method(fs, method, () => { throw Object.assign(new Error(`${method} failed`), { code: 'EIO' }); });
    try {
      await assert.rejects(refreshCommandSurface(client()), new RegExp(`${method} failed`));
    } finally {
      mock.restoreAll();
    }
    assert.deepEqual(fs.readdirSync(path.dirname(commandSurfaceCachePath())).filter((f) => f.endsWith('.tmp')), [], 'no temp file is left behind');
    assert.deepEqual(surfaceOf('https://descix.net').commands, entry().commands);
  });
}
