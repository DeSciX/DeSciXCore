/**
 * GATE: a deep link that needs a signed-in user survives sign-in and resumes exactly once
 * (device login and MCP connect links; the Powch offer link).
 *
 * THE DEFECT: the shell held the /device user_code in memory (AppData.deviceUserCode), stripped the URL
 * that carried it, and completed only from a widget's mount or button. Signing in from any other surface,
 * a reload, or SESSION_EXPIRED (AppData.reset + navigate to /) lost it, and the CLI polled forever.
 *
 * Measured at the global fetch seam (the commands that actually leave the browser) and at sessionStorage
 * (the intent's one home). AppContext.jsx is real JSX and does not load under node, so its two call sites
 * (capture at SDK_CHECKED, resume on CONNECTED) are pinned by a source check.
 *
 * Run: node --test tests/pending-intent.test.js
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');
const ORIGIN = 'https://shell.example.invalid';

globalThis.__VITE_ENV__ = { VITE_DEBUG_PROXY: '', MODE: 'test' };
const assigned = [];
const loc = { search: '', pathname: '/', origin: ORIGIN, assign: (u) => assigned.push(u) };
globalThis.window = { location: loc };
Object.defineProperty(globalThis, 'location', { configurable: true, writable: true, value: loc });

function mapStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: mapStorage() });
const session = mapStorage();
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, writable: true, value: session });

registerHooks({
  load(url, context, nextLoad) {
    if (!url.includes('/descix-app-sdk/src/')) return nextLoad(url, context);
    const r = nextLoad(url, { ...context, format: 'module' });
    let src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    src = src.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    return { ...r, source: src };
  },
});

// The server, at the fetch seam. expires_at is a Firestore Timestamp as it crosses the wire.
const sent = [];
const FUTURE_S = Math.floor(Date.now() / 1000) + 600;
let completeReply = { status: 'OK', message: { status: 'complete', user_code: 'VJW-847' } };
const replies = {
  device_validate: () => ({ status: 'OK', message: { user_code: 'VJW-847', status: 'pending', expires_at: { _seconds: FUTURE_S, _nanoseconds: 0 } } }),
  device_complete: () => completeReply,
  complete_connect_ceremony: () => ({ status: 'OK', message: { redirect_url: 'https://claude.ai/api/mcp/auth_callback?code=c1' } }),
};
globalThis.fetch = async (_url, init) => {
  const body = JSON.parse(init.body);
  sent.push(body);
  const reply = replies[body.command]?.() ?? { status: 'ERROR', message: `unmocked ${body.command}` };
  return { ok: true, status: 200, json: async () => reply, text: async () => JSON.stringify(reply), headers: { get: () => 'application/json' } };
};

const PI = await import(join(SRC, 'util', 'pendingIntent.js'));
const { captureShellIntentFromLocation, SHELL_INTENT_HANDLERS, deviceLoginExpiresAt } = await import(join(SRC, 'util', 'shellIntents.js'));
const { AppData } = await import(join(SRC, 'util', 'AppData.jsx'));
const { PENDING_INTENT_KINDS: K, PENDING_INTENT_STATUS: S } = PI;

// Powch hands the shell the session alone: no email on it.
const SIGNED_IN = { id: 'user-123', access_token: 'tok' };
const commands = (name) => sent.filter((b) => b.command === name);

beforeEach(() => {
  session.clear();
  sent.length = 0;
  assigned.length = 0;
  AppData.sessionInfo = null;
  completeReply = { status: 'OK', message: { status: 'complete', user_code: 'VJW-847' } };
});

// ── (a) the defect's own sequence ──────────────────────────────────────────────────────────────

test('(a) /device?code captured signed out, then sign-in: device login completes exactly once, by user_code', async () => {
  const { intent, carried } = await captureShellIntentFromLocation({ pathname: '/device', search: '?code=VJW-847' });
  assert.equal(carried, true, 'the URL carried the intent, so the shell strips it');
  assert.deepEqual(intent.payload, { userCode: 'VJW-847' });
  assert.equal(intent.expiresAt, FUTURE_S * 1000, 'the bound is the server\'s own expires_at');
  assert.equal(commands('device_complete').length, 0, 'nothing completes while signed out');

  AppData.sessionInfo = SIGNED_IN; // signed in through any surface: TopNavBar, the Powch sidebar, the widget
  const states = [];
  const resume = PI.createIntentResumer(SHELL_INTENT_HANDLERS, { onState: (s) => states.push(s.status) });
  const r = await resume();

  assert.equal(r.status, S.COMPLETED, JSON.stringify(r));
  const calls = commands('device_complete');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].params.user_code, 'VJW-847');
  assert.equal('device_code' in calls[0].params, false);
  assert.deepEqual(states, [S.RESUMING, S.COMPLETED]);
  assert.equal(PI.peek(), null, 'a completed intent is gone');
});

test('(a) SESSION_EXPIRED between capture and sign-in (AppData.reset) does not lose the device login', async () => {
  await captureShellIntentFromLocation({ pathname: '/device', search: '?code=VJW-847' });
  AppData.reset(); // what SESSION_EXPIRED runs before navigating to origin + '/'
  AppData.sessionInfo = SIGNED_IN;
  const r = await PI.createIntentResumer(SHELL_INTENT_HANDLERS)();
  assert.equal(r?.status, S.COMPLETED);
  assert.equal(commands('device_complete').length, 1);
});

test('(a) /connect?ceremony captured, then sign-in: the ceremony completes once and follows its redirect', async () => {
  const { intent, carried } = await captureShellIntentFromLocation({ pathname: '/connect', search: '?ceremony=cer-1' });
  assert.equal(carried, true);
  assert.equal(intent.kind, K.MCP_CONNECT);
  assert.equal(intent.expiresAt - intent.capturedAt, PI.PENDING_INTENT_MAX_AGE_MS);
  AppData.sessionInfo = SIGNED_IN;
  const r = await PI.createIntentResumer(SHELL_INTENT_HANDLERS)();
  assert.equal(r.status, S.COMPLETED);
  assert.equal(commands('complete_connect_ceremony').length, 1);
  assert.equal(commands('complete_connect_ceremony')[0].params.ceremony_id, 'cer-1');
  assert.deepEqual(assigned, ['https://claude.ai/api/mcp/auth_callback?code=c1']);
});

test('(a) a session that carries no email completes the device login; the bag is { user_code, tos_accepted }', async () => {
  await captureShellIntentFromLocation({ pathname: '/device', search: '?code=VJW-847' });
  AppData.sessionInfo = { id: 'user-123', access_token: 'tok' };
  const r = await PI.createIntentResumer(SHELL_INTENT_HANDLERS)();
  assert.equal(r?.status, S.COMPLETED, `device login did not complete for a session with no email: ${JSON.stringify(r)}`);
  const calls = commands('device_complete');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, { user_code: 'VJW-847', tos_accepted: true });
});

// ── (b) once ───────────────────────────────────────────────────────────────────────────────────

test('(b) a second sign-in event (sequential or concurrent) does not resume twice', async () => {
  await captureShellIntentFromLocation({ pathname: '/device', search: '?code=VJW-847' });
  AppData.sessionInfo = SIGNED_IN;
  const resume = PI.createIntentResumer(SHELL_INTENT_HANDLERS);
  const [first, second] = await Promise.all([resume(), resume()]);
  const third = await resume();
  assert.equal(first.status, S.COMPLETED);
  assert.equal(second, null);
  assert.equal(third, null);
  assert.equal(commands('device_complete').length, 1);
});

test('(b) a failed completion is kept for one retry, and the retry completes once', async () => {
  await captureShellIntentFromLocation({ pathname: '/device', search: '?code=VJW-847' });
  AppData.sessionInfo = SIGNED_IN;
  completeReply = { status: 'ERROR', message: 'transient' };
  const resume = PI.createIntentResumer(SHELL_INTENT_HANDLERS);
  const failed = await resume();
  assert.equal(failed.status, S.FAILED);
  assert.equal(failed.retryable, true);
  assert.match(failed.error.message, /transient/);
  assert.equal(PI.peek()?.payload.userCode, 'VJW-847', 'the intent is back in its slot');
  completeReply = { status: 'OK', message: { status: 'complete' } };
  assert.equal((await resume()).status, S.COMPLETED);
  assert.equal(await resume(), null);
  assert.equal(commands('device_complete').length, 2);
});

test('(b) a resumer leaves another resumer\'s kind in place (the Powch offer on a shell-mounting origin)', async () => {
  PI.capture({ kind: K.POWCH_OFFER, payload: { offerId: 'egpt-0123' } });
  assert.equal(await PI.createIntentResumer(SHELL_INTENT_HANDLERS)(), null);
  assert.equal(PI.peek()?.kind, K.POWCH_OFFER);
  const offers = [];
  const r = await PI.createIntentResumer({ [K.POWCH_OFFER]: async (i) => offers.push(i.payload.offerId) })();
  assert.equal(r.status, S.COMPLETED);
  assert.deepEqual(offers, ['egpt-0123']);
});

// ── (c) unknown kind ───────────────────────────────────────────────────────────────────────────

test('(c) capture refuses an unknown kind, and a payload field the kind does not carry', () => {
  assert.throws(() => PI.capture({ kind: 'oauth-callback', payload: { code: 'x' } }), /unknown kind "oauth-callback"; the kinds are device-login, mcp-connect, powch-offer/);
  assert.throws(() => PI.capture({ kind: K.DEVICE_LOGIN, payload: { userCode: 'A', device_code: 'secret' } }), /carries payload.userCode only; refused device_code/);
  assert.throws(() => PI.capture({ kind: K.DEVICE_LOGIN, payload: {} }), /needs payload.userCode/);
  assert.equal(session.getItem(PI.PENDING_INTENT_STORAGE_KEY), null, 'nothing was stored');
  assert.throws(() => PI.createIntentResumer({ 'oauth-callback': async () => {} }), /unknown kind "oauth-callback"/);
});

// ── (d) stale ──────────────────────────────────────────────────────────────────────────────────

test('(d) a stale intent is dropped with a console.error naming it, and is never resumed', async () => {
  PI.capture({ kind: K.DEVICE_LOGIN, payload: { userCode: 'OLD-111' }, expiresAt: Date.now() + 1000 });
  const stored = JSON.parse(session.getItem(PI.PENDING_INTENT_STORAGE_KEY));
  stored.expiresAt = Date.now() - 1;
  session.setItem(PI.PENDING_INTENT_STORAGE_KEY, JSON.stringify(stored));

  const errors = [];
  const orig = console.error;
  console.error = (...a) => errors.push(a.join(' '));
  let r;
  try {
    AppData.sessionInfo = SIGNED_IN;
    r = await PI.createIntentResumer(SHELL_INTENT_HANDLERS)();
  } finally {
    console.error = orig;
  }
  assert.equal(r, null);
  assert.equal(commands('device_complete').length, 0);
  assert.equal(session.getItem(PI.PENDING_INTENT_STORAGE_KEY), null, 'dropped from storage');
  assert.ok(errors.some((e) => /stale device-login intent \(userCode=OLD-111\)/.test(e)), `no named error: ${JSON.stringify(errors)}`);
});

test('(d) capture refuses an already-expired bound, and an unreadable server expiry is refused by name', async () => {
  assert.throws(() => PI.capture({ kind: K.DEVICE_LOGIN, payload: { userCode: 'A' }, expiresAt: Date.now() - 5 }), /expired at/);
  assert.equal(deviceLoginExpiresAt('2030-01-01T00:00:00.000Z'), Date.parse('2030-01-01T00:00:00.000Z'));
  assert.equal(deviceLoginExpiresAt({ seconds: 10 }), 10000);
  assert.throws(() => deviceLoginExpiresAt(undefined), /expires_at this shell cannot read: undefined/);
});

test('(d) sessionStorage unavailable: capture and peek fail loud, with no in-memory fallback', () => {
  const saved = globalThis.sessionStorage;
  try {
    globalThis.sessionStorage = undefined;
    assert.throws(() => PI.capture({ kind: K.MCP_CONNECT, payload: { ceremonyId: 'c' } }), /sessionStorage is unavailable/);
    assert.throws(() => PI.peek(), /sessionStorage is unavailable/);
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    assert.throws(() => PI.consume(), /sessionStorage is not accessible \(SecurityError\)/);
  } finally {
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, writable: true, value: saved });
  }
});

test('(d) a corrupt stored intent is dropped and reported, never parsed around', () => {
  session.setItem(PI.PENDING_INTENT_STORAGE_KEY, '{not json');
  assert.throws(() => PI.peek(), /not JSON and was dropped/);
  assert.equal(session.getItem(PI.PENDING_INTENT_STORAGE_KEY), null);
});

test('consume returns the intent once', () => {
  const i = PI.capture({ kind: K.POWCH_OFFER, payload: { offerId: 'o-1' } });
  assert.deepEqual(PI.peek(), i);
  assert.deepEqual(PI.consume(), i);
  assert.equal(PI.consume(), null);
  assert.equal(i.origin, ORIGIN);
});

// ── (e) the old path is gone ───────────────────────────────────────────────────────────────────

test('(e) the in-memory holder is deleted: AppData.deviceUserCode and refType DEVICE/CONNECT fail loud', () => {
  assert.throws(() => AppData.deviceUserCode, /AppData.deviceUserCode is deleted.*pendingIntentState/);
  assert.throws(() => { AppData.deviceUserCode = 'X'; }, /AppData.deviceUserCode is deleted/);
  assert.throws(() => { AppData.refType = 'DEVICE'; }, /pending intent/);
  assert.throws(() => { AppData.refType = 'CONNECT'; }, /pending intent/);
  AppData.refType = 'REFERRAL';
  AppData.refType = null;
});

test('(e) AppContext captures through shellIntents and resumes in ONE effect on CONNECTED, with no clear-before-use', () => {
  const src = readFileSync(join(SRC, 'AppContext.jsx'), 'utf8');
  assert.doesNotMatch(src, /deviceUserCode/, 'the in-memory holder is gone from AppContext');
  assert.doesNotMatch(src, /refType\s*=\s*'(DEVICE|CONNECT)'/);
  assert.equal(src.match(/captureShellIntentFromLocation\(/g)?.length, 1, 'one capture site');
  assert.equal(src.match(/createIntentResumer\(/g)?.length, 1, 'one resumer');
  assert.equal(src.match(/resumePendingIntent\(\)/g)?.length, 1, 'one resume call');
  assert.match(
    src,
    /useEffect\(\(\) => \{\s*if \(appState !== AppContextState\.READY \|\| loginStatus !== LoginStatus\.CONNECTED\) return;\s*runPendingIntent\(\);\s*\}, \[appState, loginStatus, runPendingIntent\]\)/,
    'the resume trigger is the loginStatus/appState effect',
  );
  const shell = readFileSync(join(SRC, 'util', 'shellIntents.js'), 'utf8');
  assert.doesNotMatch(shell, /device_code/);
});

// ── the export another origin imports (the Powch site, for powch-offer) ───────────────────────

test('@descix/app-sdk/pending-intent resolves to this module, and the module imports nothing (no React, AppData or network)', async () => {
  const viaExport = await import('@descix/app-sdk/pending-intent');
  assert.equal(viaExport.capture, PI.capture);
  assert.deepEqual(Object.keys(viaExport).sort(), [
    'PENDING_INTENT_KINDS', 'PENDING_INTENT_MAX_AGE_MS', 'PENDING_INTENT_PAYLOAD_FIELDS', 'PENDING_INTENT_STATUS',
    'PENDING_INTENT_STORAGE_KEY', 'capture', 'consume', 'createIntentResumer', 'peek',
  ]);
  assert.doesNotMatch(readFileSync(join(SRC, 'util', 'pendingIntent.js'), 'utf8'), /^\s*import\s/m);
});
