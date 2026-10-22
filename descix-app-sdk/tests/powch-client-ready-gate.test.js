/**
 * PowchClient standalone mode must not post to the iframe before POWCH_READY.
 *
 * THE BUG: _sendRequest posted to iframe.contentWindow immediately. An auth() made
 * before the iframe armed its listener posted into the void and died in the 120 s
 * timeout. The fake iframe below models exactly that: a post is DELIVERED only if it
 * arrives after READY; earlier posts are lost, as in a browser.
 *
 * Run: `node --test tests/powch-client-ready-gate.test.js` from descix-app-sdk/.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { PowchClient } from '../src/powch/PowchClient.js';

const ORIGIN = 'https://powch.test';
let listeners;
let iframe;

function installDom() {
  listeners = [];
  iframe = {
    style: {},
    armed: false,
    delivered: [],
    lost: [],
    contentWindow: {
      postMessage(msg) { (iframe.armed ? iframe.delivered : iframe.lost).push(msg); },
    },
  };
  globalThis.window = {
    location: { origin: 'https://host.test' },
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
  };
  globalThis.window.parent = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.document = {
    body: { appendChild() {} },
    createElement: () => iframe,
  };
}

function fromIframe(data) {
  for (const fn of listeners) fn({ origin: ORIGIN, source: iframe.contentWindow, data });
}

/** the iframe finishes loading: it arms its listener, THEN announces READY */
function iframeBecomesReady() {
  iframe.armed = true;
  fromIframe({ type: 'POWCH_READY' });
}

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));

beforeEach(installDom);
afterEach(() => { delete globalThis.window; delete globalThis.document; });

test('auth() before READY posts nothing into the void; it is delivered once READY arrives', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN });
  const result = client.auth();
  await tick();

  assert.equal(iframe.lost.length, 0, 'nothing may be posted before POWCH_READY (it would be lost)');

  iframeBecomesReady();
  await tick();
  assert.equal(iframe.delivered.length, 1, 'the queued request is flushed on READY');
  const [req] = iframe.delivered;
  assert.equal(req.type, 'POWCH_AUTH');

  fromIframe({ requestId: req.requestId, success: true, payload: { email: 'a@b.test', powchToken: 't' } });
  assert.equal((await result).email, 'a@b.test');
});

test('queued requests flush in call order, none dropped', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN });
  const all = Promise.all([
    client.signMessage({ message: 'one' }),
    client.signMessage({ message: 'two' }),
    client.logout(),
  ]);
  await tick();
  assert.equal(iframe.lost.length, 0);

  iframeBecomesReady();
  await tick();
  assert.deepEqual(iframe.delivered.map((m) => m.type), ['POWCH_SIGN_MESSAGE', 'POWCH_SIGN_MESSAGE', 'POWCH_LOGOUT']);
  assert.deepEqual(iframe.delivered.slice(0, 2).map((m) => m.payload.message), ['one', 'two']);
  for (const m of iframe.delivered) fromIframe({ requestId: m.requestId, success: true, payload: {} });
  await all; // every queued request settles; none was dropped
});

test('the request timeout starts when the request is POSTED, not when it was queued', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN, requestTimeoutMs: 120 });
  const result = client.auth();
  result.catch(() => {});
  await tick(200); // longer than the request timeout, still pre-READY
  iframeBecomesReady();
  await tick(60);  // inside the post-READY window
  const [req] = iframe.delivered;
  assert.ok(req, 'request was flushed');
  fromIframe({ requestId: req.requestId, success: true, payload: { email: 'late@b.test' } });
  assert.equal((await result).email, 'late@b.test', 'queue wait must not eat the request budget');
});

test('a READY that never arrives fails loud at the ready bound, naming the cause', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN, readyTimeoutMs: 50 });
  await assert.rejects(client.auth(), /POWCH_READY.*50ms/);
  assert.equal(iframe.lost.length, 0);
  assert.equal(client.pendingRequests.size, 0);
  assert.equal(client._readyGate.queuedCount, 0, 'the queue does not retain the failed request');
  // and a late READY must not post the already-failed request
  iframeBecomesReady();
  await tick();
  assert.equal(iframe.delivered.length, 0);
});

test('after READY, requests post immediately (no queueing)', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN });
  iframeBecomesReady();
  const result = client.auth();
  assert.equal(iframe.delivered.length, 1);
  fromIframe({ requestId: iframe.delivered[0].requestId, success: true, payload: {} });
  await result;
});

test('EMBEDDED mode is untouched: delegates to the shell bridge, no iframe, no queue', { timeout: 3000 }, async () => {
  const calls = [];
  const bridge = { login: async (o) => { calls.push(['login', o]); return { email: 'e@b.test' }; } };
  globalThis.window.DeSciX = { powch: bridge, bridge: { version: 1, ready: true } };
  const client = new PowchClient({});
  assert.equal(client.shellBridge, bridge);
  assert.equal(client.isReady, true);
  assert.equal(client.iframe, undefined);
  assert.equal(client._readyGate, undefined);
  assert.equal((await client.auth()).email, 'e@b.test');
  assert.equal(calls.length, 1);
  assert.equal(iframe.lost.length + iframe.delivered.length, 0);
});

test('a posted request that gets no reply still times out (request timeout unchanged)', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN, requestTimeoutMs: 40 });
  const result = client.auth();
  iframeBecomesReady();
  await assert.rejects(result, /Timeout waiting for POWCH_AUTH response/);
  assert.equal(client.pendingRequests.size, 0);
});
