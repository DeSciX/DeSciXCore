/**
 * DeSciX.powch.on('auth', cb) — the app's login callback.
 *
 * The shell's sign-in state as apps see it is `{ signedIn, address }`, owned by the bridge's auth
 * event (src/powch/authEvent.js). `signedIn` follows the shell's session, which the shell feeds
 * (useDeSciXBridge -> bridge.auth.setSession) on every change; `address` is what Powch released
 * to this host in POWCH_STATE_UPDATE. A subscriber is called once at once, then on every change.
 *
 * The sign-in a host never asked for (the user signs in inside the sidebar) sends the host no
 * Powch message at all; it reaches the shell as a session, so these tests feed the session the
 * way the hook does and drive Powch messages through the bridge's real message handler.
 *
 * Run: `node --test tests/powch-auth-event.test.js` from descix-app-sdk/.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PowchBridgeClient } from '../src/util/PowchBridgeClient.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');
const ORIGIN = 'https://powch.test';
const ADDR = '0x1111111111111111111111111111111111111111';
const SESSION = { id: 'user-1', access_token: 'tok-1', auth_status: 'CONNECTED' };

let listeners;
let iframe;

function installDom() {
  listeners = [];
  iframe = { contentWindow: { postMessage() {} } };
  globalThis.window = {
    location: { origin: 'https://host.test' },
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
    removeEventListener: (type, fn) => { listeners = listeners.filter((l) => l !== fn); },
  };
  globalThis.window.parent = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.window.self = globalThis.window;
  globalThis.document = { body: { appendChild() {} }, createElement: () => iframe };
}

function fromPowch(data) {
  for (const fn of listeners) fn({ origin: ORIGIN, source: iframe.contentWindow, data });
}

function newBridge() {
  const bridge = new PowchBridgeClient({ bridgeUrl: ORIGIN });
  bridge.activate();
  bridge.registerIframe(iframe);
  return bridge;
}

/** Record every call a subscriber receives. */
function recorder() {
  const calls = [];
  const cb = (state) => calls.push({ ...state });
  return { calls, cb };
}

beforeEach(installDom);
afterEach(() => { delete globalThis.window; delete globalThis.document; });

// ── NEGATIVE CONTROL: red on a tree without the subscription API ─────────────────────────
test('the shell bridge publishes an auth event with on/off', () => {
  const bridge = newBridge();
  assert.equal(typeof bridge.auth?.on, 'function', 'PowchBridgeClient publishes no auth event (bridge.auth.on)');
  assert.equal(typeof bridge.auth?.off, 'function', 'PowchBridgeClient publishes no auth event (bridge.auth.off)');
});

test('subscribe: called once at once with the current state', () => {
  const bridge = newBridge();
  const r = recorder();
  bridge.auth.on('auth', r.cb);
  assert.deepEqual(r.calls, [{ signedIn: false, address: null }]);

  bridge.auth.setSession(SESSION);
  const late = recorder();
  bridge.auth.on('auth', late.cb);
  assert.deepEqual(late.calls, [{ signedIn: true, address: null }], 'a late subscriber hears the current state at once');
});

test('a sign-in this host requested: STATE_UPDATE releases the address, the session signs in', () => {
  const bridge = newBridge();
  const synced = [];
  window.DeSciX = { loginWithSessionToken: (p) => synced.push(p) };
  const r = recorder();
  bridge.auth.on('auth', r.cb);

  fromPowch({ type: 'POWCH_STATE_UPDATE', payload: { isAuthenticated: true, displayAddress: ADDR, sessionInfo: SESSION } });
  assert.equal(synced.length, 1, 'the bridge still lands the session in the shell');
  assert.deepEqual(r.calls, [{ signedIn: false, address: null }], 'an address alone is not a sign-in');

  bridge.auth.setSession(SESSION); // the shell's session state changed (the hook's feed)
  assert.deepEqual(r.calls.at(-1), { signedIn: true, address: ADDR });
  assert.equal(r.calls.length, 2);
});

test('a sign-in Powch never reported to this host (sidebar sign-in, restored session) still fires', () => {
  const bridge = newBridge();
  const r = recorder();
  bridge.auth.on('auth', r.cb);
  bridge.auth.setSession(SESSION);
  assert.deepEqual(r.calls, [{ signedIn: false, address: null }, { signedIn: true, address: null }]);
});

test('change only: the same state twice is reported once', () => {
  const bridge = newBridge();
  const r = recorder();
  bridge.auth.on('auth', r.cb);
  bridge.auth.setSession(SESSION);
  bridge.auth.setSession({ ...SESSION });
  bridge.auth.setReleasedAddress(null);
  assert.equal(r.calls.length, 2);
});

test('sign-out: the session ends -> signed out, and the address does not carry to the next account', () => {
  const bridge = newBridge();
  const r = recorder();
  bridge.auth.on('auth', r.cb);
  bridge.auth.setReleasedAddress(ADDR);
  bridge.auth.setSession(SESSION);
  bridge.auth.setSession(null);
  bridge.auth.setSession({ id: 'user-2', access_token: 'tok-2' });
  assert.deepEqual(r.calls, [
    { signedIn: false, address: null },
    { signedIn: true, address: ADDR },
    { signedIn: false, address: null },
    { signedIn: true, address: null },
  ]);
});

test('off (and the returned unsubscribe) stop delivery', () => {
  const bridge = newBridge();
  const a = recorder();
  const b = recorder();
  bridge.auth.on('auth', a.cb);
  const offB = bridge.auth.on('auth', b.cb);
  bridge.auth.off('auth', a.cb);
  offB();
  bridge.auth.setSession(SESSION);
  assert.equal(a.calls.length, 1);
  assert.equal(b.calls.length, 1);
});

test('a throwing subscriber is reported and the others still run', () => {
  const bridge = newBridge();
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(a);
  try {
    const r = recorder();
    bridge.auth.on('auth', (s) => { if (s.signedIn) throw new Error('boom'); });
    bridge.auth.on('auth', r.cb);
    bridge.auth.setSession(SESSION);
    assert.deepEqual(r.calls.at(-1), { signedIn: true, address: null });
    assert.equal(errors.length, 1);
    assert.match(String(errors[0][0]), /'auth' subscriber threw/);
  } finally {
    console.error = realError;
  }
});

test('an unknown event or a non-function callback fails loud', () => {
  const bridge = newBridge();
  assert.throws(() => bridge.auth.on('login', () => {}), /the only event is 'auth'/);
  assert.throws(() => bridge.auth.off('logout', () => {}), /the only event is 'auth'/);
  assert.throws(() => bridge.auth.on('auth', null), /cb must be a function/);
});

test('DeSciX.powch (createPowchBus): on/off, isAuthenticated() and getAddress() read the one owner', async () => {
  const { createPowchBus } = await import('../src/powch/powchBus.js');
  const bridge = newBridge();
  const bus = createPowchBus(bridge);
  const r = recorder();
  bus.on('auth', r.cb);
  assert.equal(bus.isAuthenticated(), false);
  bridge.auth.setReleasedAddress(ADDR);
  bridge.auth.setSession(SESSION);
  assert.equal(bus.isAuthenticated(), true);
  assert.equal(bus.getAddress(), ADDR);
  bus.off('auth', r.cb);
  bridge.auth.setSession(null);
  assert.equal(bus.isAuthenticated(), false);
  assert.equal(r.calls.length, 2);
});

test('the bridge members the auth event replaced fail loud, naming the replacement', () => {
  const bridge = newBridge();
  assert.throws(() => bridge.isAuthenticated, /removed: read bridge\.auth\.current\.signedIn/);
  assert.throws(() => bridge.displayAddress, /removed: read bridge\.auth\.current\.address/);
  assert.throws(() => bridge.wallet, /removed: read bridge\.auth\.current\.address/);
});

test('the shell feeds its session into the auth event and publishes the bus from createPowchBus', () => {
  const hook = readFileSync(join(SRC, 'hooks', 'useDeSciXBridge.js'), 'utf8');
  const ctx = readFileSync(join(SRC, 'AppContext.jsx'), 'utf8');
  assert.match(hook, /bridge\.auth\.setSession\(sessionInfo\);\s*\}, \[bridge, sessionInfo\]\)/);
  assert.match(hook, /window\.DeSciX\.powch = createPowchBus\(bridge\);/);
  assert.match(ctx, /useDeSciXBridge\(appState, sessionInfo\);/);
  assert.ok(
    ctx.indexOf('useDeSciXBridge(appState, sessionInfo)') > ctx.indexOf('const [sessionInfo, _setSessionInfo]'),
    'the hook must be called after sessionInfo is declared',
  );
});

// ── PowchClient: embedded follows the shell's event; standalone keeps its own auth() ──────
async function embeddedClient(bridge) {
  const { createPowchBus } = await import('../src/powch/powchBus.js');
  const bus = createPowchBus(bridge);
  window.DeSciX = { powch: bus, bridge: { version: 1, ready: true } };
  const { PowchClient } = await import('../src/powch/PowchClient.js');
  return { client: new PowchClient({}), bus };
}

test("PowchClient embedded: a sidebar sign-in the client never requested reaches on('auth'), and the end of the session reaches on('logout')", async () => {
  const bridge = newBridge();
  const { client } = await embeddedClient(bridge);
  const auths = [];
  let logouts = 0;
  client.on('auth', (u) => auths.push(u));
  client.on('logout', () => { logouts++; });
  assert.equal(client.getUser(), null);

  bridge.auth.setReleasedAddress(ADDR);
  bridge.auth.setSession(SESSION);
  assert.deepEqual(auths, [{ email: null, address: ADDR, powchToken: null }]);
  assert.deepEqual(client.getUser(), { email: null, address: ADDR, powchToken: null });

  bridge.auth.setSession(null);
  assert.equal(logouts, 1);
  assert.equal(client.getUser(), null);
});

test("PowchClient embedded: auth() fires 'auth' once, from the shell's event, with what auth() was released", async () => {
  const bridge = newBridge();
  bridge.login = async () => ({ email: 'e@b.test', powchToken: 'pt' });
  const { client } = await embeddedClient(bridge);
  const auths = [];
  client.on('auth', (u) => auths.push(u));
  await client.auth();
  assert.deepEqual(auths, [], 'the shell has no session yet: nothing is signed in');
  bridge.auth.setSession(SESSION);
  assert.deepEqual(auths, [{ email: 'e@b.test', address: null, powchToken: 'pt' }]);
});

test('PowchClient embedded: on(auth) when already signed in is called at once', async () => {
  const bridge = newBridge();
  bridge.auth.setSession(SESSION);
  const { client } = await embeddedClient(bridge);
  const auths = [];
  client.on('auth', (u) => auths.push(u));
  assert.deepEqual(auths, [{ email: null, address: null, powchToken: null }]);
});

test("PowchClient embedded in a shell with no DeSciX.powch.on: sign-in state fails loud; signing still works", async () => {
  window.DeSciX = {
    powch: { signMessage: async () => ({ signature: '0xsig' }), login: async () => ({}) },
    bridge: { version: 1, ready: true },
  };
  const { PowchClient } = await import('../src/powch/PowchClient.js');
  const client = new PowchClient({});
  assert.throws(() => client.on('auth', () => {}), /publishes no DeSciX\.powch\.on\('auth'\)/);
  assert.throws(() => client.getUser(), /publishes no DeSciX\.powch\.on\('auth'\)/);
  await assert.rejects(client.auth(), /publishes no DeSciX\.powch\.on\('auth'\)/);
  assert.deepEqual(await client.signMessage({ message: 'm', address: ADDR }), { signature: '0xsig' });
});
