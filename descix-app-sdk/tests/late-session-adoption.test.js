/**
 * GATE: an answer sent under a session that has since ended (sign-out) or been replaced (another
 * account) never signs the shell back in.
 *
 * THE DEFECT (measured by a Powch reviewer): makeCommandRequestJSON adopted the `sessionInfo` of ANY
 * successful answer whenever it arrived, and PowchBridgeClient handed the session of ANY successful
 * POWCH_RESPONSE / POWCH_STATE_UPDATE to the shell. User A's sign-in or ToS call in flight, the user
 * signs out (or account B signs in), A's answer lands late: the shell is signed in as A again.
 *
 * THE RULE (util/sessionGeneration.js): a request takes a send ticket when it is sent. Every session
 * end (sign-out, SESSION_EXPIRED dispatched, Powch's POWCH_SIGNED_OUT) ends the tickets taken before
 * it; a refresh of an account is adopted only while that account is held; of two sign-ins in flight
 * the one SENT last wins. A stale answer still resolves its caller, but writes and announces nothing.
 *
 * Measured at the real seams: the real makeCommandRequestJSON over a controllable global fetch, the
 * real AppData, the real PowchBridgeClient over a fake iframe, and a window.DeSciX whose
 * loginWithSessionToken is the shell's own (AppData.adoptHandedSession, as AppContext wires it).
 *
 * Run: node --test tests/late-session-adoption.test.js
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');
const POWCH = 'https://powch.test';

globalThis.__VITE_ENV__ = { VITE_DEBUG_PROXY: '', MODE: 'test' };

// localStorage that records every write, so "nothing is written" is measured, not assumed.
const writes = [];
function recordingStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { writes.push([k, String(v)]); m.set(k, String(v)); },
    removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    clear: () => m.clear(),
  };
}
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: recordingStorage() });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, writable: true, value: recordingStorage() });

let messageListeners = [];
globalThis.window = {
  location: { search: '', pathname: '/', origin: 'https://shell.test', href: 'https://shell.test/' },
  addEventListener: (type, fn) => { if (type === 'message') messageListeners.push(fn); },
  removeEventListener: (type, fn) => { messageListeners = messageListeners.filter((l) => l !== fn); },
};
globalThis.window.self = globalThis.window;
globalThis.window.top = globalThis.window;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

registerHooks({
  load(url, context, nextLoad) {
    if (!url.includes('/descix-app-sdk/src/')) return nextLoad(url, context);
    const r = nextLoad(url, { ...context, format: 'module' });
    let src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    src = src.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    return { ...r, source: src };
  },
});

// The server, at the fetch seam: each call waits until the test answers it.
const inFlight = [];
globalThis.fetch = (url, init) => new Promise((resolve) => {
  const body = JSON.parse(init.body);
  inFlight.push({
    command: body.command,
    sentToken: body.access_token,
    answer(status, reply) {
      resolve({ ok: status < 400, status, text: async () => JSON.stringify(reply), json: async () => reply });
    },
  });
});
const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));
async function nextInFlight() {
  for (let i = 0; i < 500 && inFlight.length === 0; i += 1) await tick(1);
  const req = inFlight.shift();
  assert.ok(req, 'a request reached the fetch seam');
  return req;
}

const { AppData, AppContextEvent, LoginStatus, makeCommandRequestJSON, registerAppEventDispatcher, clearSessionAndDispatchExpiry } =
  await import(join(SRC, 'util', 'AppData.jsx'));
const { PowchBridgeClient, MAX_REQUEST_TICKETS } = await import(join(SRC, 'util', 'PowchBridgeClient.js'));
const { takeSendTicket } = await import(join(SRC, 'util', 'sessionGeneration.js'));
const { createSetAppEvent } = await import(join(SRC, 'util', 'appEvent.js'));

const A1 = { id: 'user-A', access_token: 'tok-A1', custodial_balance: 7 };
const A2 = { id: 'user-A', access_token: 'tok-A2', custodial_balance: 8 };
const A3 = { id: 'user-A', access_token: 'tok-A3' };
const B1 = { id: 'user-B', access_token: 'tok-B1' };
const ok = (sessionInfo, extra = {}) => ({ status: 'OK', message: { sessionInfo }, auth_status: LoginStatus.CONNECTED, ...extra });

const events = [];
// The shell as AppContext wires it: loginWithSessionToken is AppData.adoptHandedSession, and
// setAppEvent is the real one (util/appEvent.js) over a state setter that records each event type.
// (The state machine that then handles SESSION_EXPIRED is util/sessionExpiry.js, gated by
// session-expired-framed.test.js.)
const setAppEvent = createSetAppEvent((update) => { events.push(update({ id: 0 }).type); });
function installShell() {
  globalThis.window.DeSciX = {
    AppData,
    loginWithSessionToken: (sessionData) => AppData.adoptHandedSession(sessionData) !== null,
    AppContext: { setAppEvent },
  };
}

beforeEach(() => {
  AppData.reset();
  inFlight.length = 0;
  events.length = 0;
  writes.length = 0;
  registerAppEventDispatcher(setAppEvent);
  installShell();
});

const sessionWrites = () => writes.filter(([k]) => ['sessionInfo', 'loginStatus', 'custodialBalance', 'userRoles'].includes(k));

// ---------------------------------------------------------------- /apifront answers

test('a sign-in answer that lands after a sign-out is not adopted; its caller still gets the body', async () => {
  AppData.sessionInfo = A1;
  const call = makeCommandRequestJSON('descix_accept_tos', {});
  const req = await nextInFlight();
  AppData.sessionInfo = null; // the user signs out (AppContext.setSessionInfo(null), TopNavBar logout)
  writes.length = 0;
  events.length = 0;
  req.answer(200, ok(A2));
  const body = await call;
  assert.equal(body.message.sessionInfo.access_token, 'tok-A2', 'the caller still receives the answer');
  assert.equal(AppData.sessionInfo, null, 'the shell stays signed out');
  assert.deepEqual(sessionWrites(), [], 'nothing derived from the stale answer is written');
  assert.deepEqual(events, [], 'no event follows a stale answer');
});

test('the same, when the session ended through the expiry path (AppData.reset)', async () => {
  AppData.sessionInfo = A1;
  const call = makeCommandRequestJSON('descix_accept_tos', {});
  const req = await nextInFlight();
  AppData.reset();
  writes.length = 0;
  req.answer(200, ok(A2));
  await call;
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(sessionWrites(), []);
});

test("A's late answer does not replace B, who signed in meanwhile", async () => {
  AppData.sessionInfo = A1;
  const call = makeCommandRequestJSON('descix_accept_tos', {});
  const req = await nextInFlight();
  assert.ok(window.DeSciX.loginWithSessionToken(B1), 'B is handed to the shell first-hand and adopted');
  writes.length = 0;
  req.answer(200, ok(A2));
  await call;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1', 'B is still the session');
  assert.deepEqual(sessionWrites(), []);
});

test('two sign-ins in flight, answered in send order: the one SENT last is held', async () => {
  const c1 = makeCommandRequestJSON('powch_login_finish', {});
  const r1 = await nextInFlight();
  const c2 = makeCommandRequestJSON('powch_login_finish', {});
  const r2 = await nextInFlight();
  r1.answer(200, ok(B1));
  await c1;
  r2.answer(200, ok(A1));
  await c2;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1');
});

test('two sign-ins in flight, answered in REVERSE send order: the one SENT last is still held', async () => {
  const c1 = makeCommandRequestJSON('powch_login_finish', {});
  const r1 = await nextInFlight();
  const c2 = makeCommandRequestJSON('powch_login_finish', {});
  const r2 = await nextInFlight();
  r2.answer(200, ok(A1));
  await c2;
  writes.length = 0;
  r1.answer(200, ok(B1));
  const body = await c1;
  assert.equal(body.message.sessionInfo.access_token, 'tok-B1', 'the caller still gets its answer');
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1', 'the sign-in sent first does not replace the one sent last');
  assert.deepEqual(sessionWrites(), []);
});

test("a sign-in to B sent before a refresh of A: B is held whichever answers first", async () => {
  for (const order of [['refresh', 'signin'], ['signin', 'refresh']]) {
    AppData.reset();
    AppData.sessionInfo = A1;
    const signIn = makeCommandRequestJSON('powch_login_finish', {});
    const rs = await nextInFlight();
    const refresh = makeCommandRequestJSON('fetch_my_purchases', {});
    const rr = await nextInFlight();
    for (const which of order) {
      if (which === 'signin') { rs.answer(200, ok(B1)); await signIn; } else { rr.answer(200, ok(A2)); await refresh; }
    }
    assert.equal(AppData.sessionInfo.access_token, 'tok-B1', `B is held (answers: ${order.join(' then ')})`);
  }
});

test('a normal sign-in answer is adopted (storage written, status and balance set)', async () => {
  const call = makeCommandRequestJSON('powch_login_finish', {});
  const req = await nextInFlight();
  req.answer(200, ok(A1));
  await call;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1');
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED);
  assert.equal(AppData.custodialBalance, 7);
  assert.ok(sessionWrites().some(([k, v]) => k === 'sessionInfo' && v.includes('tok-A1')), 'sessionInfo persisted');
});

test('a token refresh for the signed-in account is adopted, also from concurrent answers', async () => {
  AppData.sessionInfo = A1;
  const c1 = makeCommandRequestJSON('fetch_my_purchases', {});
  const r1 = await nextInFlight();
  const c2 = makeCommandRequestJSON('fetch_my_purchases', {});
  const r2 = await nextInFlight();
  r1.answer(200, ok(A2));
  await c1;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A2');
  r2.answer(200, ok(A3));
  await c2;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A3', 'the same account refreshing never advances the generation');
});

test('re-login after a sign-out adopts the new session', async () => {
  AppData.sessionInfo = A1;
  AppData.sessionInfo = null;
  const call = makeCommandRequestJSON('powch_login_finish', {});
  const req = await nextInFlight();
  req.answer(200, ok(A2));
  await call;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A2');
});

test('expiry handling still clears: a 401 for the current session resets it and fires SESSION_EXPIRED', async () => {
  AppData.sessionInfo = A1;
  const call = makeCommandRequestJSON('fetch_my_purchases', {});
  const req = await nextInFlight();
  req.answer(401, { status: 'ERROR', message: 'Unauthorized' });
  await assert.rejects(call, (e) => e.status === 401);
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(events, [AppContextEvent.SESSION_EXPIRED]);
});

test("a 401 sent under A's session does not sign B out", async () => {
  AppData.sessionInfo = A1;
  const call = makeCommandRequestJSON('fetch_my_purchases', {});
  const req = await nextInFlight();
  window.DeSciX.loginWithSessionToken(B1);
  events.length = 0;
  req.answer(401, { status: 'ERROR', message: 'Unauthorized' });
  await assert.rejects(call, (e) => e.status === 401, 'the caller still learns its call failed');
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
  assert.deepEqual(events, []);
});

test('clearSessionAndDispatchExpiry with no stored signature still clears and fires SESSION_EXPIRED', async () => {
  AppData.sessionInfo = A1;
  await clearSessionAndDispatchExpiry();
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(events, [AppContextEvent.SESSION_EXPIRED]);
});

test('clearSessionAndDispatchExpiry: a reconnect answered for the current session is adopted and announced', async () => {
  AppData.sessionInfo = A1;
  localStorage.setItem('pwa_wallet_signature', 'sig');
  try {
    const done = clearSessionAndDispatchExpiry();
    const req = await nextInFlight();
    assert.equal(req.command, 'authenticate_by_signature');
    req.answer(200, ok(A2));
    await done;
    assert.equal(AppData.sessionInfo.access_token, 'tok-A2');
    assert.deepEqual(events, [AppContextEvent.LOGIN_SUCCESS]);
  } finally {
    localStorage.removeItem('pwa_wallet_signature');
  }
});

test('clearSessionAndDispatchExpiry: B signing in while the reconnect runs keeps B (no clear, no event)', async () => {
  AppData.sessionInfo = A1;
  localStorage.setItem('pwa_wallet_signature', 'sig');
  try {
    const done = clearSessionAndDispatchExpiry();
    const req = await nextInFlight();
    window.DeSciX.loginWithSessionToken(B1);
    events.length = 0;
    req.answer(200, ok(A2));
    await done;
    assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
    assert.deepEqual(events, []);
  } finally {
    localStorage.removeItem('pwa_wallet_signature');
  }
});

// ---------------------------------------------------------------- Powch bridge answers

function makeBridge(opts = {}) {
  messageListeners = [];
  const posted = [];
  const iframe = { contentWindow: { postMessage: (m) => posted.push(m) } };
  // A short request timeout: a request posted after destroy() must not hold the test process open.
  const bridge = new PowchBridgeClient({ bridgeUrl: POWCH, requestTimeoutMs: 300, ...opts });
  bridge.activate();
  bridge.registerIframe(iframe);
  const fromPowch = (data) => { for (const fn of messageListeners) fn({ origin: POWCH, source: iframe.contentWindow, data }); };
  fromPowch({ type: 'POWCH_READY' });
  const nextPosted = async (type) => {
    for (let i = 0; i < 500; i += 1) {
      const m = posted.find((p) => p.type === type && !p.taken);
      if (m) { m.taken = true; return m; }
      await tick(1);
    }
    throw new Error(`${type} was never posted`);
  };
  return { bridge, fromPowch, nextPosted };
}

test('bridge: a sign-in answered after a sign-out is not adopted, not announced, and the host page cannot adopt it either', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  AppData.sessionInfo = null; // sign-out
  events.length = 0;
  writes.length = 0;
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  const result = await login;
  assert.equal(result.sessionInfo.access_token, 'tok-A1', 'the caller still gets the answer');
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(events, [], 'no LOGIN_SUCCESS');
  // The Cloud shell then calls window.DeSciX.loginWithSessionToken(result) itself (util/powchSignIn.js).
  assert.equal(window.DeSciX.loginWithSessionToken(result), false, 'the stale answer is refused there too');
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(sessionWrites(), []);
  bridge.destroy();
});

test('bridge: a normal sign-in in Powch\'s order (response, then the state update echoing its requestId) is adopted, the address released, the host re-adoption idempotent', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  // Powch (FlowRunner): resolveAction posts POWCH_RESPONSE, then LOGIN_SUCCESS posts the state update.
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  const result = await login;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1', 'adopted from the response');
  const seen = [];
  bridge.on('state_update', (p) => seen.push(p));
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: req.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(seen.length, 1, 'the state update after its response is applied');
  bridge.auth.setSession(AppData.sessionInfo); // the shell's session feed (useDeSciXBridge)
  assert.equal(bridge.auth.current.address, '0xA', 'the released address is published');
  assert.equal(window.DeSciX.loginWithSessionToken(result), true, "the host page's own adoption of the same answer succeeds");
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1');
  assert.ok(events.includes('LOGIN_SUCCESS'));
  bridge.destroy();
});

test('bridge: a state update naming a current request it sent is applied (also before its response)', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const seen = [];
  bridge.on('state_update', (p) => seen.push(p));
  bridge.login().catch(() => {});
  const req = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: req.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1');
  assert.equal(seen.length, 1);
  assert.deepEqual(events, ['LOGIN_SUCCESS']);
  bridge.destroy();
});

for (const [label, idOf] of [
  ['no requestId (an older Powch site)', () => undefined],
  ['a requestId this bridge never sent', () => 'req_999_forged'],
]) {
  test(`bridge: a state update with ${label} is dropped whole, even while a request is outstanding`, async () => {
    const { bridge, fromPowch, nextPosted } = makeBridge();
    const seen = [];
    bridge.on('state_update', (p) => seen.push(p));
    bridge.login().catch(() => {});
    await nextPosted('POWCH_LOGIN');
    const warned = [];
    const warn = console.warn;
    console.warn = (...a) => warned.push(a.join(' '));
    try {
      fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: idOf(), payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
    } finally {
      console.warn = warn;
    }
    assert.equal(AppData.sessionInfo, null, 'no session');
    assert.deepEqual(seen, [], 'no state_update event');
    assert.deepEqual(events, [], 'no LOGIN_SUCCESS');
    bridge.auth.setSession(B1);
    assert.equal(bridge.auth.current.address, null, 'no released address');
    assert.ok(warned.some((w) => /POWCH_STATE_UPDATE .*dropped/.test(w)), 'a console line names why');
    bridge.destroy();
  });
}

test('bridge: a state update for a sign-in sent before the one the shell adopted is dropped (last sent wins)', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const seen = [];
  bridge.on('state_update', (p) => seen.push(p));
  bridge.login().catch(() => {});
  const first = await nextPosted('POWCH_LOGIN');
  bridge.login().catch(() => {});
  const second = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: second.requestId, payload: { isAuthenticated: true, displayAddress: '0xB', sessionInfo: B1 } });
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: first.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
  assert.equal(seen.length, 1);
  bridge.auth.setSession(AppData.sessionInfo);
  assert.equal(bridge.auth.current.address, '0xB');
  bridge.destroy();
});

test('bridge: an answer arriving after its request timed out is still adopted when nothing ended the session', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 20 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  await assert.rejects(login, /Timeout waiting for POWCH_LOGIN/);
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1');
  assert.deepEqual(events, ['LOGIN_SUCCESS']);
  bridge.destroy();
});

test('bridge: an answer arriving after its request timed out AND a sign-out is not adopted', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 20 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  await assert.rejects(login, /Timeout/);
  AppData.sessionInfo = null;
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(events, []);
  bridge.destroy();
});

test('bridge: a state update arriving after a sign-out is dropped whole (no session, no address, no event)', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const seen = [];
  bridge.on('state_update', (p) => seen.push(p));
  bridge.login().catch(() => {});
  const req = await nextPosted('POWCH_LOGIN');
  AppData.sessionInfo = null;
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: req.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(seen, []);
  bridge.auth.setSession({ id: 'user-B', access_token: 'tok-B9' }); // the next account signs in
  assert.equal(bridge.auth.current.address, null, "A's released address does not carry over to the next account");
  assert.deepEqual(events, []);
  bridge.destroy();
});

test('bridge.logout() ends the answers in flight: a sign-in answered after it is not adopted', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  bridge.logout().catch(() => {});
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  await login;
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(events, []);
  bridge.destroy();
});

test('bridge: a POWCH_RESPONSE answering no request this bridge sent is not adopted', async () => {
  const { bridge, fromPowch } = makeBridge();
  fromPowch({ type: 'POWCH_RESPONSE', requestId: 'req_999_forged', success: true, payload: { sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(events, []);
  bridge.destroy();
});

test('a session handed first-hand (Powch adopting the session its own flow created) is adopted', () => {
  // A fresh object, as Powch's flow hands over: the shared fixtures above were stamped by bridge answers.
  assert.equal(window.DeSciX.loginWithSessionToken({ ...A1 }), true);
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1');
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED);
});

// ---------------------------------------------------------------- POWCH_SIGNED_OUT

test('POWCH_SIGNED_OUT from the bound Powch frame ends the answers in flight and clears the host session (SESSION_EXPIRED)', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  AppData.sessionInfo = A1;
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  events.length = 0;
  fromPowch({ type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' });
  assert.deepEqual(events, [AppContextEvent.SESSION_EXPIRED], 'the shell is told through its one session-end event');
  AppData.reset(); // what the state machine's SESSION_EXPIRED handler does (util/sessionExpiry.js)
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A2 } });
  await login;
  assert.equal(AppData.sessionInfo, null, 'an answer sent before the sign-out is not adopted');
  assert.deepEqual(events, [AppContextEvent.SESSION_EXPIRED], 'no LOGIN_SUCCESS follows it');
  bridge.destroy();
});

test('POWCH_SIGNED_OUT ends the answers in flight even before the shell has reset (the bump is synchronous)', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  AppData.sessionInfo = A1;
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' });
  writes.length = 0;
  // The state machine has not handled SESSION_EXPIRED yet; a sign-in answer for another account lands.
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: B1 } });
  await login;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1', 'B (sent before the sign-out) is not adopted');
  assert.deepEqual(sessionWrites(), []);
  bridge.destroy();
});

test('a state update queued before a sign-out and delivered after POWCH_SIGNED_OUT is dropped', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  const seen = [];
  bridge.on('state_update', (p) => seen.push(p));
  bridge.login().catch(() => {});
  const req = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' });
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: req.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(seen, []);
  assert.deepEqual(events, [], 'no LOGIN_SUCCESS (and no SESSION_EXPIRED: no session was held)');
  bridge.destroy();
});

for (const [label, from] of [
  ['another frame of the Powch origin', (bridge) => ({ origin: POWCH, source: { postMessage() {} } })],
  ['another origin', (bridge) => ({ origin: 'https://evil.test', source: bridge.iframe.contentWindow })],
]) {
  test(`POWCH_SIGNED_OUT from ${label} is ignored`, async () => {
    const { bridge, fromPowch, nextPosted } = makeBridge();
    AppData.sessionInfo = A1;
    const login = bridge.login();
    const req = await nextPosted('POWCH_LOGIN');
    events.length = 0;
    const { origin, source } = from(bridge);
    for (const fn of messageListeners) fn({ origin, source, data: { type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' } });
    assert.deepEqual(events, [], 'no SESSION_EXPIRED');
    fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A2 } });
    await login;
    assert.equal(AppData.sessionInfo.access_token, 'tok-A2', 'the answers in flight were not ended');
    bridge.destroy();
  });
}

test('POWCH_SIGNED_OUT with no host session held dispatches nothing (no reload of a signed-out host)', () => {
  const { bridge, fromPowch } = makeBridge();
  fromPowch({ type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' });
  assert.deepEqual(events, []);
  bridge.destroy();
});

test('POWCH_SIGNED_OUT on a host with no App Shell event dispatcher fails loud', () => {
  const { bridge, fromPowch } = makeBridge();
  AppData.sessionInfo = A1;
  delete window.DeSciX.AppContext;
  const errors = [];
  const error = console.error;
  console.error = (...a) => errors.push(a.join(' '));
  try {
    fromPowch({ type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' });
  } finally {
    console.error = error;
  }
  assert.ok(errors.some((e) => /session was not cleared/.test(e)), 'a console error names what was not cleared');
  bridge.destroy();
});

test("host logout in Powch's order (POWCH_SIGNED_OUT, then the POWCH_LOGOUT response) clears once and resolves", async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge();
  AppData.sessionInfo = A1;
  events.length = 0;
  const out = bridge.logout();
  const req = await nextPosted('POWCH_LOGOUT');
  fromPowch({ type: 'POWCH_SIGNED_OUT', at: '2026-11-13T00:00:00.000Z' });
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { success: true } });
  assert.deepEqual(await out, { success: true });
  assert.deepEqual(events, [AppContextEvent.SESSION_EXPIRED]);
  bridge.destroy();
});

// ---------------------------------------------------------------- SESSION_EXPIRED dispatched (Powch's own document)

test("a command answer sent before SESSION_EXPIRED was dispatched is not adopted, even before the shell's reset runs", async () => {
  // Powch's flows/signOut.js: shell.AppContext.setAppEvent('SESSION_EXPIRED'); the state machine resets later.
  AppData.sessionInfo = A1;
  const call = makeCommandRequestJSON('powch_login_finish', {});
  const req = await nextInFlight();
  window.DeSciX.AppContext.setAppEvent('SESSION_EXPIRED');
  writes.length = 0;
  req.answer(200, ok(B1));
  await call;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1', 'B is not adopted (A is cleared when the reset runs)');
  assert.deepEqual(sessionWrites(), []);
});

test('a command sent AFTER SESSION_EXPIRED was dispatched is adopted (the dispatch ends only earlier tickets)', async () => {
  AppData.sessionInfo = A1;
  window.DeSciX.AppContext.setAppEvent('SESSION_EXPIRED');
  AppData.reset();
  const call = makeCommandRequestJSON('powch_login_finish', {});
  const req = await nextInFlight();
  req.answer(200, ok(B1));
  await call;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
});

test('AppContext dispatches every event through createSetAppEvent (the SESSION_EXPIRED bump has one home)', async () => {
  const { readFileSync } = await import('node:fs');
  const ctx = readFileSync(join(SRC, 'AppContext.jsx'), 'utf8');
  assert.match(ctx, /const setAppEvent = useMemo\(\(\) => createSetAppEvent\(_setAppEvent\), \[\]\);/);
  assert.equal((ctx.match(/_setAppEvent\(/g) || []).length, 0, 'no other writer of the appEvent state');
});

// ---------------------------------------------------------------- loginStatus from an answer with no session

test('a stale answer (sent before a sign-out) reporting a HIGHER auth_status does not raise loginStatus', async () => {
  AppData.sessionInfo = A1;
  AppData.loginStatus = LoginStatus.CONNECTED;
  const c = makeCommandRequestJSON('get_store', {});
  const r = await nextInFlight();
  AppData.reset(); // sign-out
  assert.equal(AppData.loginStatus, LoginStatus.GUEST);
  writes.length = 0;
  r.answer(200, { status: 'OK', auth_status: LoginStatus.CONNECTED, message: {} });
  await c;
  assert.equal(AppData.loginStatus, LoginStatus.GUEST);
  assert.deepEqual(sessionWrites().filter(([k]) => k === 'loginStatus'), []);
});

test("a stale answer (sent under A, B signed in since) reporting a LOWER auth_status does not lower B's loginStatus", async () => {
  AppData.sessionInfo = A1;
  AppData.loginStatus = LoginStatus.CONNECTED;
  const c = makeCommandRequestJSON('get_store', {});
  const r = await nextInFlight();
  assert.ok(window.DeSciX.loginWithSessionToken({ sessionInfo: B1, auth_status: LoginStatus.CONNECTED }));
  r.answer(200, { status: 'OK', auth_status: LoginStatus.GUEST, message: {} });
  await c;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED);
});

test('P4 a current answer reporting a LOWER auth_status does not lower loginStatus', async () => {
  AppData.sessionInfo = A1;
  AppData.loginStatus = LoginStatus.CONNECTED;
  const c = makeCommandRequestJSON('get_store', {});
  (await nextInFlight()).answer(200, { status: 'OK', auth_status: LoginStatus.AUTHENTICATED, message: {} });
  await c;
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED);
});

test('P4b a current answer RAISING auth_status raises loginStatus', async () => {
  AppData.sessionInfo = A1;
  AppData.loginStatus = LoginStatus.AUTHENTICATED;
  const c = makeCommandRequestJSON('get_store', {});
  (await nextInFlight()).answer(200, { status: 'OK', auth_status: LoginStatus.CONNECTED, message: {} });
  await c;
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED);
});

// ---------------------------------------------------------------- two refreshes of one account in flight

test('two refreshes of A in flight, answered in send order: the one SENT last is held', async () => {
  AppData.sessionInfo = A1;
  const c1 = makeCommandRequestJSON('reconnect_by_wallet', {});
  const r1 = await nextInFlight();
  const c2 = makeCommandRequestJSON('reconnect_by_wallet', {});
  const r2 = await nextInFlight();
  r1.answer(200, ok(A2)); await c1;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A2');
  r2.answer(200, ok(A3)); await c2;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A3');
});

test('two refreshes of A in flight, answered in REVERSE send order: the older does not overwrite the newer token', async () => {
  AppData.sessionInfo = A1;
  const c1 = makeCommandRequestJSON('reconnect_by_wallet', {});
  const r1 = await nextInFlight();
  const c2 = makeCommandRequestJSON('reconnect_by_wallet', {});
  const r2 = await nextInFlight();
  r2.answer(200, ok(A3)); await c2;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A3');
  writes.length = 0;
  r1.answer(200, ok(A2));
  const body = await c1;
  assert.equal(body.message.sessionInfo.access_token, 'tok-A2', 'the caller still gets its answer');
  assert.equal(AppData.sessionInfo.access_token, 'tok-A3', 'the newer token is kept');
  assert.deepEqual(sessionWrites(), []);
});

test('two refreshes of A over the Powch bridge, answered in reverse send order: the newer token is kept', async () => {
  AppData.sessionInfo = A1;
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const p1 = bridge.login();
  const q1 = await nextPosted('POWCH_LOGIN');
  const p2 = bridge.login();
  const q2 = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_RESPONSE', requestId: q2.requestId, success: true, payload: { sessionInfo: A3 } });
  await p2;
  fromPowch({ type: 'POWCH_RESPONSE', requestId: q1.requestId, success: true, payload: { sessionInfo: A2 } });
  const older = await p1;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A3');
  assert.equal(window.DeSciX.loginWithSessionToken(older), false, 'the host page cannot adopt the older one either');
  assert.equal(AppData.sessionInfo.access_token, 'tok-A3');
  bridge.destroy();
});

// ---------------------------------------------------------------- the held identity is read through the getter

test('fresh page, session only in localStorage: the first ticket records the stored account', () => {
  localStorage.setItem('sessionInfo', JSON.stringify(A1));
  AppData._sessionInfo = null; // fresh page: nothing read into memory yet
  assert.equal(takeSendTicket().identity, 'user-A');
});

test("fresh page, session only in localStorage, the first act a Powch request: B set meanwhile is not replaced by that request's answer for A", async () => {
  localStorage.setItem('sessionInfo', JSON.stringify(A1));
  AppData._sessionInfo = null;
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const p = bridge.login(); // its ticket is the page's first read of the session
  const q = await nextPosted('POWCH_LOGIN');
  AppData.sessionInfo = B1; // account switch set directly
  fromPowch({ type: 'POWCH_RESPONSE', requestId: q.requestId, success: true, payload: { sessionInfo: A2 } });
  const res = await p;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1', "A's refresh, sent while A was held, does not replace B");
  assert.equal(window.DeSciX.loginWithSessionToken(res), false);
  bridge.destroy();
});

// ---------------------------------------------------------------- reviewer probes

const guestOk = { status: 'OK', auth_status: LoginStatus.GUEST, message: { items: [] } };

test('P1 guest commands sent AFTER the sign-in request and answered first do not make the sign-in lose', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  const calls = [1, 2, 3].map((i) => makeCommandRequestJSON('get_store', { i }, true));
  const reqs = [await nextInFlight(), await nextInFlight(), await nextInFlight()];
  for (const r of reqs) r.answer(200, guestOk);
  await Promise.all(calls);
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  const result = await login;
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1', 'sign-in adopted');
  assert.ok(events.includes('LOGIN_SUCCESS'));
  const seen = [];
  bridge.on('state_update', (p) => seen.push(p));
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: req.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(seen.length, 1);
  bridge.auth.setSession(AppData.sessionInfo);
  assert.equal(bridge.auth.current.address, '0xA');
  assert.equal(window.DeSciX.loginWithSessionToken(result), true, 'Cloud signInWithPowch re-adoption');
  bridge.destroy();
});

test('P1b guest commands sent after the sign-in request, answered AFTER it was adopted (GUEST status, a 401) neither downgrade nor clear', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  const c1 = makeCommandRequestJSON('get_store', {}, true);
  const c2 = makeCommandRequestJSON('get_store', {}, true).catch((e) => e);
  const r1 = await nextInFlight(); const r2 = await nextInFlight();
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1, auth_status: LoginStatus.CONNECTED } });
  await login;
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED);
  events.length = 0;
  r1.answer(200, guestOk);
  r2.answer(401, { status: 'ERROR', auth_status: LoginStatus.GUEST, message: 'User session invalid' });
  await c1; await c2;
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1', 'A kept');
  assert.equal(AppData.loginStatus, LoginStatus.CONNECTED, 'not downgraded');
  assert.deepEqual(events, [], 'no SESSION_EXPIRED');
  bridge.destroy();
});

test("P2 page reload: a stored session (localStorage only) is the held one for the first ticket; an account switch keeps B against A's 401", async () => {
  localStorage.setItem('sessionInfo', JSON.stringify(A1));
  AppData._sessionInfo = null;
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  AppData._sessionInfo = null;
  const c = makeCommandRequestJSON('get_store', {}).catch((e) => e);
  const r = await nextInFlight();
  assert.equal(r.sentToken, 'tok-A1', 'the reloaded shell sends A');
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: B1 } });
  await login;
  assert.equal(AppData.sessionInfo?.access_token, 'tok-B1');
  events.length = 0;
  r.answer(401, { status: 'ERROR', message: 'User session invalid' });
  await c;
  assert.equal(AppData.sessionInfo?.access_token, 'tok-B1', "A's late 401 does not sign B out");
  assert.deepEqual(events, []);
  bridge.destroy();
});

test('P2b page reload: a refresh of the stored account is adopted, and a 401 for it clears', async () => {
  localStorage.setItem('sessionInfo', JSON.stringify(A1));
  AppData._sessionInfo = null;
  const c = makeCommandRequestJSON('reconnect_by_wallet', {});
  (await nextInFlight()).answer(200, ok(A2));
  await c;
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A2');
  const d = makeCommandRequestJSON('get_store', {}).catch((e) => e);
  (await nextInFlight()).answer(401, { status: 'ERROR', message: 'User session invalid' });
  await d;
  assert.equal(AppData.sessionInfo, null);
  assert.ok(events.includes('SESSION_EXPIRED'));
});

test("P3 Powch's own document: an unstamped handover is adopted over a held account, and that account's late refresh is refused", async () => {
  AppData.sessionInfo = B1;
  const c = makeCommandRequestJSON('reconnect_by_wallet', {});
  const r = await nextInFlight();
  assert.ok(window.DeSciX.loginWithSessionToken({ ...A1 }), 'handover adopted');
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1');
  r.answer(200, ok({ id: 'user-B', access_token: 'tok-B2' }));
  await c;
  assert.equal(AppData.sessionInfo.access_token, 'tok-A1');
});

test('P3b a first sign-in handed over unstamped right after a sign-out with answers in flight is adopted', async () => {
  AppData.sessionInfo = A1;
  const c = makeCommandRequestJSON('get_store', {});
  const r = await nextInFlight();
  AppData.sessionInfo = null;
  assert.ok(window.DeSciX.loginWithSessionToken({ sessionInfo: B1, auth_status: LoginStatus.CONNECTED }));
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
  r.answer(200, guestOk); await c;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
});

test('P5 an older Powch (state update without requestId): the sign-in still lands via POWCH_RESPONSE; the address is not released', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  const result = await login;
  fromPowch({ type: 'POWCH_STATE_UPDATE', payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1');
  assert.equal(window.DeSciX.loginWithSessionToken(result), true);
  bridge.auth.setSession(AppData.sessionInfo);
  assert.equal(bridge.auth.current.address, null, 'no released address with an older Powch');
  bridge.destroy();
});

test('P6 a sign-in answered after the request timed out and after later guest traffic is adopted', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 20 });
  const login = bridge.login().catch((e) => e);
  const req = await nextPosted('POWCH_LOGIN');
  const err = await login;
  assert.ok(err instanceof Error, 'timed out');
  const c = makeCommandRequestJSON('get_store', {}, true);
  (await nextInFlight()).answer(200, guestOk); await c;
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1');
  assert.ok(events.includes('LOGIN_SUCCESS'));
  bridge.destroy();
});

test("P7 an account switch via Powch while A is held: B adopted; A's in-flight refresh refused", async () => {
  AppData.sessionInfo = A1;
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const c = makeCommandRequestJSON('reconnect_by_wallet', {});
  const r = await nextInFlight();
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: B1 } });
  await login;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
  r.answer(200, ok(A2)); await c;
  assert.equal(AppData.sessionInfo.access_token, 'tok-B1');
  bridge.destroy();
});

// ---------------------------------------------------------------- the bridge's ticket map is bounded

async function postedCount(bridgeParts, type, n) {
  for (let i = 0; i < 2000; i += 1) {
    const got = bridgeParts.posted().filter((p) => p.type === type).length;
    if (got >= n) return got;
    await tick(1);
  }
  throw new Error(`fewer than ${n} ${type} were posted`);
}
function makeCountingBridge() {
  messageListeners = [];
  const posted = [];
  const iframe = { contentWindow: { postMessage: (m) => posted.push(m) } };
  const bridge = new PowchBridgeClient({ bridgeUrl: POWCH, requestTimeoutMs: 5000 });
  bridge.activate();
  bridge.registerIframe(iframe);
  const fromPowch = (data) => { for (const fn of messageListeners) fn({ origin: POWCH, source: iframe.contentWindow, data }); };
  fromPowch({ type: 'POWCH_READY' });
  return { bridge, fromPowch, posted: () => posted };
}

test('a sign-out prunes the tickets it ended; the host page still cannot adopt a pruned request\'s answer', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  assert.equal(bridge._requestTickets.has(req.requestId), true);
  fromPowch({ type: 'POWCH_SIGNED_OUT' });
  assert.equal(bridge._requestTickets.size, 0, 'the ended ticket is deleted in the session-end path');
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  const result = await login;
  assert.equal(AppData.sessionInfo, null);
  assert.equal(window.DeSciX.loginWithSessionToken(result), false, 'stamped refused, not handed over as new');
  fromPowch({ type: 'POWCH_STATE_UPDATE', requestId: req.requestId, payload: { isAuthenticated: true, displayAddress: '0xA', sessionInfo: A1 } });
  assert.equal(AppData.sessionInfo, null, 'its state update is dropped as unknown');
  bridge.destroy();
});

test('bridge.logout() prunes the tickets it ended: a pruned sign-in answer is refused by the host page too', async () => {
  const { bridge, fromPowch, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  const login = bridge.login();
  const req = await nextPosted('POWCH_LOGIN');
  bridge.logout().catch(() => {});
  assert.equal(bridge._requestTickets.has(req.requestId), false);
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { sessionInfo: A1 } });
  const result = await login;
  assert.equal(window.DeSciX.loginWithSessionToken(result), false);
  assert.equal(AppData.sessionInfo, null);
  bridge.destroy();
});

test('an end elsewhere (AppData.reset) is pruned on the next send', async () => {
  const { bridge, nextPosted } = makeBridge({ requestTimeoutMs: 5000 });
  bridge.login().catch(() => {});
  const q1 = await nextPosted('POWCH_LOGIN');
  AppData.reset();
  assert.equal(bridge._requestTickets.has(q1.requestId), true, 'not yet: the bridge did not see that end');
  bridge.login().catch(() => {});
  const q2 = await nextPosted('POWCH_LOGIN');
  assert.deepEqual([...bridge._requestTickets.keys()], [q2.requestId]);
  bridge.destroy();
});

test(`under the cap (${MAX_REQUEST_TICKETS}), pruning never drops a request still waiting for its answer`, async () => {
  const parts = makeCountingBridge();
  const { bridge, fromPowch } = parts;
  const login = bridge.login();
  await postedCount(parts, 'POWCH_LOGIN', 1);
  const loginId = parts.posted().find((p) => p.type === 'POWCH_LOGIN').requestId;
  for (let i = 0; i < MAX_REQUEST_TICKETS - 1; i += 1) bridge.setTab('cards');
  await postedCount(parts, 'POWCH_SET_TAB', MAX_REQUEST_TICKETS - 1);
  assert.equal(bridge._requestTickets.size, MAX_REQUEST_TICKETS);
  assert.equal(bridge._requestTickets.has(loginId), true);
  fromPowch({ type: 'POWCH_RESPONSE', requestId: loginId, success: true, payload: { sessionInfo: A1 } });
  await login;
  assert.equal(AppData.sessionInfo?.access_token, 'tok-A1');
  bridge.destroy();
});

test(`above the cap the OLDEST ticket is dropped with a warning; its answer resolves but is not adopted`, async () => {
  const warned = [];
  const realWarn = console.warn;
  console.warn = (...a) => { warned.push(a.join(' ')); };
  try {
    const parts = makeCountingBridge();
    const { bridge, fromPowch } = parts;
    const login = bridge.login();
    await postedCount(parts, 'POWCH_LOGIN', 1);
    const loginId = parts.posted().find((p) => p.type === 'POWCH_LOGIN').requestId;
    for (let i = 0; i < MAX_REQUEST_TICKETS; i += 1) bridge.setTab('cards');
    await postedCount(parts, 'POWCH_SET_TAB', MAX_REQUEST_TICKETS);
    assert.equal(bridge._requestTickets.size, MAX_REQUEST_TICKETS);
    assert.equal(bridge._requestTickets.has(loginId), false);
    assert.equal(warned.filter((w) => w.includes(`the ticket of ${loginId}, the oldest, was dropped`)).length, 1, warned.join('\n'));
    fromPowch({ type: 'POWCH_RESPONSE', requestId: loginId, success: true, payload: { sessionInfo: A1 } });
    const result = await login;
    assert.equal(result.sessionInfo.access_token, 'tok-A1', 'the caller still gets its answer');
    assert.equal(AppData.sessionInfo, null);
    assert.equal(window.DeSciX.loginWithSessionToken(result), false);
    bridge.destroy();
  } finally {
    console.warn = realWarn;
  }
});
