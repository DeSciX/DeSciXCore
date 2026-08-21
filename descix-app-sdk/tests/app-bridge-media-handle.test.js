/**
 * Conformance: an EMBEDDED app can hand the model something to look at.
 *
 * What this closes (ws-c3-bridge-media-handle): every piece of the media lane
 * already existed — mediaContribution built the bag, ChatWidget.contribute was THE
 * ingress, collectTurnMedia pooled it, ask_question_to_app carried it — and
 * CodeSiteWidget's deliverToChat reached all of it FROM THE SHELL ONLY. Nothing
 * published that reach to the app in the iframe. These tests pin the door open, and
 * pin it to the ONE existing lane: a media contribution must still be an ordinary
 * staged contribution carrying `media`, not a second pipe.
 *
 * Run: `node --test tests/app-bridge-media-handle.test.js` from descix-app-sdk/.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BRIDGE_READY_EVENT, publishBridgeMember, retractBridgeMember, getBridge } from '../src/util/appBridge.js';
import { publishChatApi, retractChatApi } from '../src/util/appChat.js';
import { publishViewApi, subscribeView, resetView, viewAvailable, VIEW_MODES } from '../src/util/appView.js';
import { collectTurnMedia } from '../src/util/chatIngress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const SCAFFOLD_SDK = path.resolve(
  SDK_ROOT, '..', 'descix-cli', 'templates', 'scaffolds', 'site', 'DeSciXAppSDK.js'
);

/** Minimal same-origin-ish window pair: a shell window and the app's view of it. */
function makeShellWindow() {
  const listeners = new Map();
  return {
    addEventListener: (t, fn) => {
      if (!listeners.has(t)) listeners.set(t, new Set());
      listeners.get(t).add(fn);
    },
    removeEventListener: (t, fn) => listeners.get(t)?.delete(fn),
    dispatchEvent: (evt) => {
      for (const fn of listeners.get(evt.type) || []) fn(evt);
      return true;
    },
  };
}

/** A fake ChatWidget ingress that records what it was handed. */
function makeIngress() {
  const got = [];
  return { got, contribute: async (bag) => { got.push(bag); return bag; } };
}

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUg==';

beforeEach(() => {
  delete globalThis.window;
  resetView();
});

// ───────────────────────────────────────────────────── the readiness contract

test('the bus announces itself, so an EARLY app never has to poll', () => {
  globalThis.window = makeShellWindow();
  const heard = [];
  window.addEventListener(BRIDGE_READY_EVENT, (e) => heard.push(e.detail));

  publishBridgeMember('view', { set: () => {} });

  assert.equal(heard.length, 1, 'publication must announce');
  assert.equal(heard[0].member, 'view');
  assert.deepEqual(heard[0].members, ['view']);
});

test('a LATE app reads the marker synchronously instead of waiting for an event it missed', () => {
  globalThis.window = makeShellWindow();
  publishBridgeMember('view', { set: () => {} });

  const bridge = getBridge().bridge;
  assert.equal(bridge.ready, true);
  assert.equal(bridge.has('view'), true);
  assert.equal(bridge.has('chat'), false, 'an unpublished member must report absent, not throw');
  assert.equal(typeof bridge.version, 'number', 'RT-5 asked for a version marker on the bus');
});

test('publishing does not clobber members another publisher already put on the bus', () => {
  globalThis.window = makeShellWindow();
  window.DeSciX = { powch: { login: () => 'kept' }, config: { env: 'test' } };

  publishViewApi();
  publishChatApi({ deliver: async () => {}, isAvailable: () => true });

  assert.equal(window.DeSciX.powch.login(), 'kept');
  assert.equal(window.DeSciX.config.env, 'test');
  assert.equal(typeof window.DeSciX.view.set, 'function');
  assert.equal(typeof window.DeSciX.chat.sendMedia, 'function');
});

test('retracting a member removes it rather than leaving a handle to a dead host', () => {
  globalThis.window = makeShellWindow();
  publishChatApi({ deliver: async () => {}, isAvailable: () => true });
  assert.equal(typeof window.DeSciX.chat, 'object');

  retractChatApi();
  assert.equal(window.DeSciX.chat, undefined,
    'a stale handle whose backing component unmounted is how "succeeded and did nothing" bugs start');
});

test('publishing is a no-op without a DOM (SSR / node)', () => {
  delete globalThis.window;
  assert.doesNotThrow(() => publishViewApi());
  assert.doesNotThrow(() => retractBridgeMember('view'));
  assert.equal(getBridge(), null);
});

// ──────────────────────────────────────── ready is not capable (RT-1's lesson)

test('view.available() reports SUBSCRIBERS, not mere publication', () => {
  globalThis.window = makeShellWindow();
  publishViewApi();

  assert.equal(viewAvailable(), false,
    'published but unsubscribed is the standalone host: set() would succeed and change nothing');
  assert.equal(window.DeSciX.view.available(), false);

  const off = subscribeView(() => {});
  assert.equal(window.DeSciX.view.available(), true, 'a listening host is the only honest "yes"');
  off();
  assert.equal(window.DeSciX.view.available(), false, 'capability is LIVE, not a boot-time fact');
});

test('chat.available() tracks the ingress moment-to-moment', () => {
  globalThis.window = makeShellWindow();
  let mounted = false;
  publishChatApi({ deliver: async () => {}, isAvailable: () => mounted });

  assert.equal(window.DeSciX.chat.available(), false, 'chat pane closed');
  mounted = true;
  assert.equal(window.DeSciX.chat.available(), true, 'user opened the chat pane after boot');
});

// ─────────────────────────────────────────────────────── the media handle itself

test('an embedded app hands an image across, and it rides the ONE existing lane', async () => {
  globalThis.window = makeShellWindow();
  const ingress = makeIngress();
  publishChatApi({
    deliver: (bag) => ingress.contribute(bag),
    isAvailable: () => true,
  });

  // The real call shape: the app reaches its PARENT's bus.
  const appFrame = { top: globalThis.window };
  const res = await appFrame.top.DeSciX.chat.sendMedia(
    { mime_type: 'image/png', data: PNG_B64, label: 'flyby' },
    { note: 'what do you see?' }
  );

  assert.equal(res.delivered, true);
  assert.equal(ingress.got.length, 1);

  const bag = ingress.got[0];
  assert.equal(bag.kind, 'media_attachment');
  assert.equal(bag.disposition, 'stage', 'an attachment rides into the NEXT turn by default');
  assert.equal(bag.media.length, 1);
  assert.equal(bag.media[0].mime_type, 'image/png');
  assert.equal(bag.media[0].data, PNG_B64);
  assert.match(bag.text, /flyby/, 'the transcript must show the attachment');
  assert.match(bag.text, /what do you see\?/, 'the note must reach the model');

  // The bytes must be poolable by the transport exactly like any other contribution.
  assert.deepEqual(collectTurnMedia([bag]), [bag.media[0]],
    'ChatWidget hands this straight to the `media` param — no repackaging');
});

test('an asset_ref attachment is carried too, not just inline bytes', async () => {
  globalThis.window = makeShellWindow();
  const ingress = makeIngress();
  publishChatApi({ deliver: (b) => ingress.contribute(b), isAvailable: () => true });

  const res = await window.DeSciX.chat.sendMedia({
    mime_type: 'video/mp4', asset_ref: 'captures/flyby.mp4', label: 'flyby',
  });

  assert.equal(res.delivered, true);
  assert.equal(ingress.got[0].media[0].asset_ref, 'captures/flyby.mp4');
  assert.match(ingress.got[0].text, /from app assets/);
});

test("disposition 'send' is available for an app that wants the model to react now", async () => {
  globalThis.window = makeShellWindow();
  const ingress = makeIngress();
  publishChatApi({ deliver: (b) => ingress.contribute(b), isAvailable: () => true });

  await window.DeSciX.chat.sendMedia(
    { mime_type: 'image/png', data: PNG_B64, label: 'now' },
    { disposition: 'send' }
  );
  assert.equal(ingress.got[0].disposition, 'send');
});

// ───────────────────────────────────────────── caller bugs throw; environment reports

test('a malformed attachment THROWS — that is a bug at the call site', async () => {
  globalThis.window = makeShellWindow();
  publishChatApi({ deliver: async () => {}, isAvailable: () => true });

  await assert.rejects(() => window.DeSciX.chat.sendMedia(null), /requires a media object/);
  await assert.rejects(() => window.DeSciX.chat.sendMedia('image/png'), /requires a media object/);
});

test('a closed chat pane is reported, NOT thrown — a throw would kill a running world', async () => {
  globalThis.window = makeShellWindow();
  const errs = [];
  const realError = console.error;
  console.error = (...a) => errs.push(a.join(' '));
  try {
    publishChatApi({ deliver: async () => { throw new Error('must not be called'); }, isAvailable: () => false });
    const res = await window.DeSciX.chat.sendMedia({ mime_type: 'image/png', data: PNG_B64, label: 'x' });

    assert.equal(res.delivered, false);
    assert.match(res.reason, /chat pane is not mounted/);
    assert.equal(errs.length, 1, 'loud-but-not-fatal: it must still say so');
    assert.match(errs[0], /sendMedia dropped "x"/);
  } finally {
    console.error = realError;
  }
});

test('the handle refuses to publish without a real host wiring', () => {
  globalThis.window = makeShellWindow();
  assert.throws(() => publishChatApi({ deliver: null, isAvailable: () => true }),
    /requires \{ deliver, isAvailable \} functions/);
});

// ───────────────────────────────────────────────────────── no second media path

test('the SDK does NOT duplicate the server-owned media vocabulary', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'util', 'appChat.js'), 'utf8');
  assert.doesNotMatch(src, /image\/jpeg|video\/webm|MAX_MEDIA_BYTES|8 \* 1024/,
    'MIME lists and byte caps are owned by platform-api chatMedia.js; a second copy is mirror drift');
});

test('appView publishes THROUGH the bridge owner, not by touching window.DeSciX itself', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'util', 'appView.js'), 'utf8');
  assert.match(src, /publishBridgeMember/);
  assert.doesNotMatch(src, /window\.DeSciX\s*=\s*window\.DeSciX\s*\|\|/,
    'two derivations of "how a member gets on the bus" is the mirror-drift bug class');
});

test('CodeSiteWidget publishes its EXISTING deliverToChat rather than a new pipe', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'components', 'CodeSiteWidget.jsx'), 'utf8');
  assert.match(src, /publishChatApi\(\{[\s\S]*deliver:\s*deliverToChat/,
    'the app-side door must open onto the same closure the shell already uses');
  assert.match(src, /retractChatApi\(\)/, 'and close when the host unmounts');
});

// ─────────────────────────────────────────────────── the app-side proxy (scaffold)

test('the scaffold SDK exposes view, chat and ready to app authors', () => {
  const src = fs.readFileSync(SCAFFOLD_SDK, 'utf8');
  assert.match(src, /get view\(\)/, 'the .view getter is the app-side face of the view API');
  assert.match(src, /get chat\(\)/, 'the .chat getter is the app-side face of the media handle');
  assert.match(src, /ready\s*[:=]/, 'the readiness contract must be reachable from the app');
  assert.match(src, /window\.top\.DeSciX/, 'it proxies the shell bus over the same-origin hop');
});

test('the placebo suggestPrompt stub is DELETED, not left beside the real handle', () => {
  const src = fs.readFileSync(SCAFFOLD_SDK, 'utf8');
  assert.doesNotMatch(src, /suggestPrompt/,
    'it console.logged "Future: trigger text injection" and returned nothing — a superseded ' +
    'partial path is deleted in the same change (super-DRY), never left as a plausible-looking trap');
});

test('the standalone path RESOLVES readiness instead of hanging forever', () => {
  const src = fs.readFileSync(SCAFFOLD_SDK, 'utf8');
  assert.match(src, /mode: 'standalone', members: \[\]/,
    'an app awaiting a bridge that is never coming is indistinguishable from a broken app');
});
