/**
 * The standalone Powch iframe (PowchClient._initIframe) must let Powch open its own
 * page top-level: New account runs credentials.create() in a popup, and a sandbox
 * without allow-popups blocks that window.open on every standalone host.
 *
 * Run: `node --test tests/powch-client-sandbox-popups.test.js` from descix-app-sdk/.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { PowchClient } from '../src/powch/PowchClient.js';

let iframe;

function installDom() {
  iframe = { style: {}, contentWindow: { postMessage() {} } };
  globalThis.window = {
    location: { origin: 'https://host.test' },
    addEventListener() {},
  };
  globalThis.window.parent = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.document = {
    body: { appendChild() {} },
    createElement: () => iframe,
  };
}

afterEach(() => { delete globalThis.window; delete globalThis.document; });

test('standalone Powch iframe sandbox grants allow-popups and allow-popups-to-escape-sandbox', () => {
  installDom();
  new PowchClient({ bridgeUrl: 'https://powch.test' });
  const tokens = String(iframe.sandbox).split(/\s+/).filter(Boolean);
  assert.ok(tokens.includes('allow-popups'), `allow-popups missing from sandbox: ${tokens.join(' ')}`);
  assert.ok(tokens.includes('allow-popups-to-escape-sandbox'), `allow-popups-to-escape-sandbox missing from sandbox: ${tokens.join(' ')}`);
});
