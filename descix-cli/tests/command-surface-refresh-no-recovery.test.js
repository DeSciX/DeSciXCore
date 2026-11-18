/**
 * The help listing's cache refresh never enters the client's auth-recovery path.
 *
 * `descix login` and `descix whoami` refresh the command-surface cache right after their own
 * server calls. If that one call is refused (a 401, an expired session), DeSciXApiClient.invoke's
 * recovery would reconnect by wallet and then start an INTERACTIVE device login — a second sign-in
 * inside login, or a surprise browser from whoami. refreshCommandSurface passes noAuthRecovery
 * (and skipSessionCheck); the refusal becomes one plain line and the command carries on.
 *
 * The real api-client runs; axios and the dynamically imported commands/auth.js are mocked.
 *
 * Run: `node --experimental-test-module-mocks --test tests/command-surface-refresh-no-recovery.test.js`
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = [];
const logins = [];

mock.module('axios', {
  defaultExport: {
    post: async (url, body) => {
      posts.push(body.command);
      const err = new Error('Request failed with status code 401');
      err.response = { status: 401, data: { status: 'ERROR', message: 'Session expired' } };
      throw err;
    },
  },
});
mock.module(pathToFileURL(path.join(CLI_ROOT, 'lib', 'commands', 'auth.js')).href, {
  namedExports: { loginDevice: async () => { logins.push('loginDevice'); } },
});

const { DeSciXApiClient } = await import('../lib/api-client.js');
const { refreshCommandSurfaceOrSay, commandSurfaceCachePath } = await import('../lib/command-surface-cache.js');

function signedInClient() {
  const c = new DeSciXApiClient({ baseUrl: 'https://descix.net' });
  c._initialized = true;
  c.baseUrl = 'https://descix.net';
  c.credentials = { userId: 'u', accessToken: 'stale', walletAddress: '0x01', signature: '0xsig', oauth: null };
  const sessions = [];
  c.ensureSession = async () => { sessions.push('ensureSession'); };
  return { c, sessions };
}

test('a 401 from get_command_surface: one line, no reconnect, no second login, cache untouched', async () => {
  const savedHome = process.env.HOME;
  process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-refresh-401-'));
  try {
    posts.length = 0; logins.length = 0;
    const { c, sessions } = signedInClient();
    const lines = [];
    const r = await refreshCommandSurfaceOrSay(c, (l) => lines.push(l));
    assert.equal(r, null);
    assert.equal(lines.length, 1);
    assert.match(lines[0], /^The help listing's command surface was not refreshed: /);
    assert.deepEqual(posts, ['get_command_surface'], 'exactly one request, no retry');
    assert.deepEqual(sessions, [], 'no ensureSession (no OAuth refresh, no reconnect_by_wallet)');
    assert.deepEqual(logins, [], 'no device login');
    assert.equal(fs.existsSync(commandSurfaceCachePath()), false);
  } finally {
    fs.rmSync(process.env.HOME, { recursive: true, force: true });
    process.env.HOME = savedHome;
  }
});

test('NEGATIVE CONTROL: the same 401 WITHOUT noAuthRecovery enters recovery (reconnect, then device login)', async () => {
  posts.length = 0; logins.length = 0;
  const { c, sessions } = signedInClient();
  await assert.rejects(c.invoke('get_command_surface', {}, { allowGuest: false, skipSessionCheck: true }));
  assert.ok(sessions.length >= 1, 'recovery called ensureSession');
  assert.deepEqual(logins, ['loginDevice'], 'recovery started a device login');
});
