/**
 * GATE: Powch's machine-readable refusal code reaches the caller as `err.code`.
 *
 * Powch's host replies carry `{ type, requestId, success: false, error, code }` (USER_CANCELLED,
 * FLOW_STILL_RUNNING, NETWORK_TIMEOUT, ...; null when none). Both SDK clients dropped `code` and
 * rejected with the text alone, so a host could only branch on wording ("User cancelled").
 * One owner builds the Error (src/powch/requestError.js); the text is unchanged.
 *
 * Run: node --test tests/powch-refusal-code.test.js
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { PowchBridgeClient } from '../src/util/PowchBridgeClient.js';
import { registerHeldIdentityReader } from '../src/util/sessionGeneration.js';

// The shell's session owner (util/AppData.jsx registers this reader in the app); here: no session held.
registerHeldIdentityReader(() => null);
import { PowchClient } from '../src/powch/PowchClient.js';

const ORIGIN = 'https://powch.test';
let listeners;
let iframe;

function installDom() {
  listeners = [];
  iframe = {
    style: {},
    posted: [],
    contentWindow: { postMessage(msg) { iframe.posted.push(msg); } },
  };
  globalThis.window = {
    location: { origin: 'https://host.test' },
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
    removeEventListener: (type, fn) => { listeners = listeners.filter((l) => l !== fn); },
  };
  globalThis.window.parent = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.document = { body: { appendChild() {} }, createElement: () => iframe };
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

function fromPowch(data) {
  for (const fn of listeners) fn({ origin: ORIGIN, source: iframe.contentWindow, data });
}
const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));

async function bridgeRequest() {
  const bridge = new PowchBridgeClient({ bridgeUrl: ORIGIN, requestTimeoutMs: 500 });
  bridge.activate();
  bridge.registerIframe(iframe);
  fromPowch({ type: 'POWCH_READY' });
  const result = bridge.login();
  await tick();
  const req = iframe.posted.find((m) => m.type === 'POWCH_LOGIN');
  assert.ok(req, 'POWCH_LOGIN posted');
  return { bridge, result, req };
}

async function clientRequest() {
  const client = new PowchClient({ bridgeUrl: ORIGIN });
  fromPowch({ type: 'POWCH_READY' });
  const result = client.auth();
  await tick();
  const req = iframe.posted.find((m) => m.type === 'POWCH_AUTH');
  assert.ok(req, 'POWCH_AUTH posted');
  return { result, req };
}

beforeEach(installDom);
afterEach(() => { delete globalThis.window; delete globalThis.document; });

test('PowchBridgeClient: a POWCH_RESPONSE refusal with a code reaches err.code; the text is unchanged', async () => {
  const { bridge, result, req } = await bridgeRequest();
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: false, error: 'User cancelled', code: 'USER_CANCELLED' });
  await assert.rejects(result, (e) => e.message === 'User cancelled' && e.code === 'USER_CANCELLED');
  bridge.destroy();
});

test('PowchBridgeClient: a refusal without a code leaves err.code undefined', async () => {
  const { bridge, result, req } = await bridgeRequest();
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: false, error: 'Wallet connect cancelled', code: null });
  await assert.rejects(result, (e) => e.message === 'Wallet connect cancelled' && e.code === undefined && !('code' in e));
  bridge.destroy();
});

test('PowchBridgeClient: a non-string or empty code is ignored', async () => {
  for (const code of [42, { c: 1 }, '', true]) {
    const { bridge, result, req } = await bridgeRequest();
    fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: false, error: 'x', code });
    await assert.rejects(result, (e) => e.code === undefined);
    bridge.destroy();
    iframe.posted.length = 0;
  }
});

test('PowchBridgeClient: the requestId-echo reply path (not typed POWCH_RESPONSE) carries the code too', async () => {
  const { bridge, result, req } = await bridgeRequest();
  fromPowch({ type: 'POWCH_LOGIN_RESULT', requestId: req.requestId, success: false, error: 'Flow replaced', code: 'FLOW_REPLACED' });
  await assert.rejects(result, (e) => e.message === 'Flow replaced' && e.code === 'FLOW_REPLACED');
  bridge.destroy();
});

test('PowchBridgeClient: a refusal with no text keeps the default message', async () => {
  const { bridge, result, req } = await bridgeRequest();
  fromPowch({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: false, code: 'NETWORK_TIMEOUT' });
  await assert.rejects(result, (e) => e.message === 'Request failed' && e.code === 'NETWORK_TIMEOUT');
  bridge.destroy();
});

test('PowchClient: a refusal with a code reaches err.code; without one err.code is undefined; a non-string is ignored', async () => {
  let r = await clientRequest();
  fromPowch({ requestId: r.req.requestId, success: false, error: 'User cancelled', code: 'USER_CANCELLED' });
  await assert.rejects(r.result, (e) => e.message === 'User cancelled' && e.code === 'USER_CANCELLED');

  iframe.posted.length = 0;
  r = await clientRequest();
  fromPowch({ requestId: r.req.requestId, success: false, error: 'User cancelled', code: null });
  await assert.rejects(r.result, (e) => e.message === 'User cancelled' && e.code === undefined);

  iframe.posted.length = 0;
  r = await clientRequest();
  fromPowch({ requestId: r.req.requestId, success: false, error: 'User cancelled', code: 7 });
  await assert.rejects(r.result, (e) => e.code === undefined);
});
