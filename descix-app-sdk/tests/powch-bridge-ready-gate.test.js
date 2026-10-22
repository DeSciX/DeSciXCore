/**
 * PowchBridgeClient (the shell's bridge to the Powch sidebar iframe) must not post to
 * the iframe before Powch's POWCH_READY.
 *
 * THE DEFECT (measured on PROD by the DEVX seat, Playwright): registerIframe() marked
 * the bridge ready as soon as the iframe ELEMENT existed. A fast Sign In posted
 * POWCH_LOGIN into a frame that was not listening yet (login sent 9.5 s, Powch ready
 * 9.8 s); the request was lost and the button sat on "Connecting..." until the 120 s
 * "Timeout waiting for POWCH_LOGIN response" (129.5 s).
 *
 * The fake iframe models the browser: a post is DELIVERED only after the frame has armed
 * its listener (which is when it announces POWCH_READY); earlier posts are LOST.
 *
 * Run: `node --test tests/powch-bridge-ready-gate.test.js` from descix-app-sdk/.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PowchBridgeClient } from '../src/util/PowchBridgeClient.js';

const ORIGIN = 'https://powch.test';
let listeners;

function makeIframe() {
  const frame = {
    armed: false,
    delivered: [],
    lost: [],
  };
  frame.contentWindow = {
    postMessage(msg) { (frame.armed ? frame.delivered : frame.lost).push(msg); },
  };
  return frame;
}

let iframe;

function installDom() {
  listeners = [];
  iframe = makeIframe();
  globalThis.window = {
    location: { origin: 'https://host.test' },
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
    removeEventListener: (type, fn) => { listeners = listeners.filter((l) => l !== fn); },
  };
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

function post(data, { origin = ORIGIN, source = iframe.contentWindow } = {}) {
  for (const fn of listeners) fn({ origin, source, data });
}

/** the iframe finishes loading: it arms its listener, THEN announces READY */
function iframeBecomesReady(frame = iframe) {
  frame.armed = true;
  post({ type: 'POWCH_READY' }, { source: frame.contentWindow });
}

function newBridge(extra = {}) {
  const bridge = new PowchBridgeClient({ bridgeUrl: ORIGIN, ...extra });
  bridge.activate();
  return bridge;
}

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

beforeEach(installDom);
afterEach(() => { delete globalThis.window; delete globalThis.requestAnimationFrame; });

test('iframe exists but Powch is not ready: login() is delivered after POWCH_READY, not lost', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  bridge.registerIframe(iframe);

  const result = bridge.login();
  await tick();
  assert.deepEqual(iframe.lost.map((m) => m.type), [], 'nothing may be posted before POWCH_READY (it would be lost)');
  assert.equal(bridge.isBridgeReady, false, 'an iframe element existing is not Powch being ready');

  iframeBecomesReady();
  await tick();
  assert.equal(bridge.isBridgeReady, true);
  assert.equal(iframe.delivered.length, 1, 'the queued login is posted once READY arrives');
  const [req] = iframe.delivered;
  assert.equal(req.type, 'POWCH_LOGIN');

  post({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: { ok: 1 } });
  assert.deepEqual(await result, { ok: 1 });
  bridge.destroy();
});

test('queued requests flush in call order, none dropped', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  bridge.registerIframe(iframe);
  const all = Promise.all([bridge.login(), bridge.signMessage('one'), bridge.logout()]);
  await tick();
  iframeBecomesReady();
  await tick();
  assert.equal(iframe.lost.length, 0);
  assert.deepEqual(iframe.delivered.map((m) => m.type), ['POWCH_LOGIN', 'POWCH_SIGN_MESSAGE', 'POWCH_LOGOUT']);
  for (const m of iframe.delivered) post({ type: 'POWCH_RESPONSE', requestId: m.requestId, success: true, payload: {} });
  await all;
  bridge.destroy();
});

test('POWCH_READY that never arrives fails loud naming it, not as a POWCH_LOGIN response timeout', { timeout: 3000 }, async () => {
  const bridge = newBridge({ readyTimeoutMs: 50 });
  bridge.registerIframe(iframe);
  await assert.rejects(bridge.login(), /did not send POWCH_READY within 50ms; POWCH_LOGIN was never posted/);
  assert.equal(iframe.lost.length + iframe.delivered.length, 0);
  // a late READY must not post the already-failed request
  iframeBecomesReady();
  await tick();
  assert.equal(iframe.delivered.length, 0);
  bridge.destroy();
});

test('the request timeout starts when the request is POSTED, not when it was queued', { timeout: 3000 }, async () => {
  const bridge = newBridge({ requestTimeoutMs: 120 });
  bridge.registerIframe(iframe);
  const result = bridge.login();
  result.catch(() => {});
  await tick(200); // longer than the request timeout, still pre-READY
  iframeBecomesReady();
  await tick(40);
  const [req] = iframe.delivered;
  assert.ok(req, 'request was flushed');
  post({ type: 'POWCH_RESPONSE', requestId: req.requestId, success: true, payload: 'late' });
  assert.equal(await result, 'late');
  bridge.destroy();
});

test('POWCH_READY is trusted only from the Powch origin (the existing origin check, not widened)', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  bridge.registerIframe(iframe);
  iframe.armed = true;
  post({ type: 'POWCH_READY' }, { origin: 'https://evil.test' });
  post({ type: 'POWCH_READY' }, { origin: 'https://host.test' });
  assert.equal(bridge.isBridgeReady, false);
  post({ type: 'POWCH_READY' });
  assert.equal(bridge.isBridgeReady, true);
  bridge.destroy();
});

test('POWCH_READY that arrives before registerIframe() is applied when the iframe registers', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  iframeBecomesReady(); // no iframe registered yet
  assert.equal(bridge.isBridgeReady, false);
  bridge.registerIframe(iframe);
  assert.equal(bridge.isBridgeReady, true);
  const result = bridge.login();
  await tick();
  assert.equal(iframe.delivered.length, 1);
  post({ type: 'POWCH_RESPONSE', requestId: iframe.delivered[0].requestId, success: true, payload: 1 });
  assert.equal(await result, 1);
  bridge.destroy();
});

test('a NEW iframe element must announce READY again; queued requests go to it', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  bridge.registerIframe(iframe);
  iframeBecomesReady();
  bridge.registerIframe(iframe); // same element re-registered (provider + widget both do it)
  assert.equal(bridge.isBridgeReady, true);

  const second = makeIframe();
  bridge.registerIframe(second);
  assert.equal(bridge.isBridgeReady, false);
  const result = bridge.login();
  await tick();
  assert.equal(second.lost.length, 0);
  iframeBecomesReady(second);
  await tick();
  assert.equal(second.delivered.length, 1);
  post({ type: 'POWCH_RESPONSE', requestId: second.delivered[0].requestId, success: true, payload: 2 },
    { source: second.contentWindow });
  assert.equal(await result, 2);
  bridge.destroy();
});

test('no iframe registered: rejects at once, naming it', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  await assert.rejects(bridge.login(), /no Powch iframe is registered/);
  bridge.destroy();
});

test('destroy() rejects requests still waiting for POWCH_READY instead of leaving them hanging', { timeout: 3000 }, async () => {
  const bridge = newBridge();
  bridge.registerIframe(iframe);
  const result = bridge.login();
  bridge.destroy();
  await assert.rejects(result, /destroyed before Powch sent POWCH_READY; POWCH_LOGIN was never posted/);
});

test('PowchBridgeProvider keeps ONE bridge per Powch iframe: identity is not keyed on the brand object', () => {
  // A re-created bridge would never see the POWCH_READY the iframe already sent. AppShell
  // builds a fresh `brand` object every render, so keying useMemo on it re-created the
  // bridge on every AppShell render.
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/providers/PowchBridgeProvider.jsx'), 'utf8');
  const memo = src.match(/const bridge = useMemo\([\s\S]*?\}, \[([^\]]*)\]\);/);
  assert.ok(memo, 'the bridge useMemo was not found');
  assert.doesNotMatch(memo[1], /config\.brand\b(?!\?\.)/, 'useMemo deps must not include the config.brand object');
});
