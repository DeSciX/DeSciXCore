/**
 * Conformance: the SDK detects its own window level, so no app ever writes `window.`
 *
 * The CEO's ruling (2026-08-21): "the user of that object shouldn't need to call
 * window dot because it internally does the level detection of the window and iframe.
 * So the user doesn't need to know window versus window dot top."
 *
 * The evidence was measured confusion — an app worked around a missing bridge with
 * `window.top`, while the SDK's own docblocks taught `window.parent`. Both are
 * guesses at a DISTANCE; the real question is an IDENTITY ("which window carries the
 * bus?"). These tests pin that identity in the cases where the two old guesses give
 * different answers, which is exactly where the confusion came from.
 *
 * Run: `node --test tests/bridge-resolver.test.js` from descix-app-sdk/.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resolveBridge, BRIDGE_RESOLUTION_MAX_HOPS } from '../src/util/bridgeResolver.js';

/** A window carrying a real, marker-bearing bus (what appBridge.js publishes). */
function shellWindow(members = {}) {
  const w = { DeSciX: { ...members, bridge: { version: 1, ready: true } } };
  w.parent = w; // top of its own chain until nested
  return w;
}

/** A plain frame with no bus. */
function frameWindow() {
  const w = {};
  w.parent = w;
  return w;
}

/** Nest `child` inside `parent` (mutates child's parent link). */
function nest(child, parent) {
  child.parent = parent;
  return child;
}

/**
 * A cross-origin ancestor: reading ANY property throws SecurityError, exactly as a
 * real browser does — except `parent`, which the HTML spec keeps readable across
 * origins. That asymmetry is the whole reason the walk can continue past one.
 */
function crossOriginWindow(parent) {
  const target = {};
  return new Proxy(target, {
    get(_t, prop) {
      if (prop === 'parent') return parent;
      throw new Error(
        'SecurityError: Blocked a frame with origin "https://evil.example" from accessing a cross-origin frame.'
      );
    },
  });
}

beforeEach(() => {
  delete globalThis.window;
});

// ─────────────────────────────────────────────────────────── level detection

test('hop 0 — a page that owns the bus resolves to itself', () => {
  const shell = shellWindow({ view: {} });
  const found = resolveBridge(shell);
  assert.equal(found.mode, 'shell');
  assert.equal(found.hops, 0);
  assert.equal(found.window, shell);
  assert.equal(found.bus, shell.DeSciX);
});

test('hop 1 — the ordinary embedded app finds it on the parent', () => {
  const shell = shellWindow({ view: {}, chat: {} });
  const app = nest(frameWindow(), shell);
  const found = resolveBridge(app);
  assert.equal(found.mode, 'shell');
  assert.equal(found.hops, 1);
  assert.equal(found.bus, shell.DeSciX);
});

test('hop 2 — a NESTED app still finds it, where `window.parent` would not', () => {
  // This is the case the old `window.parent.DeSciX` teaching got wrong: the app's
  // immediate parent is an intermediate frame carrying no bus at all.
  const shell = shellWindow({ view: {} });
  const middle = nest(frameWindow(), shell);
  const app = nest(frameWindow(), middle);

  assert.equal(app.parent.DeSciX, undefined, 'precondition: the parent has no bus');

  const found = resolveBridge(app);
  assert.equal(found.mode, 'shell');
  assert.equal(found.hops, 2);
  assert.equal(found.bus, shell.DeSciX);
});

test('the FIRST bus wins — an inner shell shadows an outer one, where `window.top` would not', () => {
  // The mirror-image case the old `window.top.DeSciX` teaching got wrong: when the
  // shell is itself embedded in some outer page, `top` is the OUTER page.
  const outer = shellWindow({ view: { tag: 'outer' } });
  const inner = nest(shellWindow({ view: { tag: 'inner' } }), outer);
  const app = nest(frameWindow(), inner);

  const found = resolveBridge(app);
  assert.equal(found.hops, 1);
  assert.equal(found.bus.view.tag, 'inner',
    'the nearest enclosing shell owns this app, not whatever sits at the top of the window chain');
});

// ─────────────────────────────────────────────────────────────── no shell

test('no shell anywhere — standalone, resolving to SELF rather than hanging or throwing', () => {
  const app = nest(frameWindow(), frameWindow());
  const found = resolveBridge(app);
  assert.equal(found.mode, 'standalone');
  assert.equal(found.bus, null);
  assert.equal(found.hops, -1);
  assert.equal(found.window, app, 'standalone resolves to the starting window');
});

test('a top-level page with no bus is standalone, and terminates on parent === self', () => {
  const found = resolveBridge(frameWindow());
  assert.equal(found.mode, 'standalone');
  assert.equal(found.hops, -1);
});

test('no DOM at all (SSR / node) is standalone, never a throw', () => {
  assert.doesNotThrow(() => resolveBridge());
  const found = resolveBridge();
  assert.equal(found.mode, 'standalone');
  assert.equal(found.window, null);
});

test('the ambient window is used when no start is given', () => {
  const shell = shellWindow({ view: {} });
  globalThis.window = shell;
  assert.equal(resolveBridge().bus, shell.DeSciX);
});

// ───────────────────────────────────────────────────────────── cross-origin

test('a cross-origin ancestor does NOT throw — it reads as "not the shell"', () => {
  // Powch's iframe is cross-origin BY DESIGN. Walking up out of it must be a quiet
  // "standalone", never a SecurityError that takes the app down with it.
  const outer = frameWindow();
  const hostile = crossOriginWindow(outer);
  const app = nest(frameWindow(), hostile);

  let found;
  assert.doesNotThrow(() => { found = resolveBridge(app); });
  assert.equal(found.mode, 'standalone');
  assert.equal(found.bus, null);
});

test('the walk CONTINUES past a cross-origin ancestor to a reachable shell above it', () => {
  // A→B→A nesting: `top` is a direct reference, so a same-origin bus can sit above an
  // unreadable frame. Stopping at the first throw would report standalone and strand
  // an app that genuinely has a shell.
  const shell = shellWindow({ view: {} });
  const hostile = crossOriginWindow(shell);
  const app = nest(frameWindow(), hostile);

  const found = resolveBridge(app);
  assert.equal(found.mode, 'shell');
  assert.equal(found.hops, 2, 'the unreadable frame is counted as a hop, not an endpoint');
  assert.equal(found.bus, shell.DeSciX);
});

// ────────────────────────────────────────────────── the marker discriminates

test('an app-side PROXY at window.DeSciX is not mistaken for the shell bus', () => {
  // DeSciXAppSDK.js installs its own object at `window.DeSciX`. Only the OWNER
  // publishes `bridge.version`, which is why presence of `DeSciX` cannot be the test:
  // an app would otherwise resolve to itself and proxy into an infinite self-reference.
  const shell = shellWindow({ view: {} });
  const app = nest(frameWindow(), shell);
  app.DeSciX = { view: 'I am the app-side proxy', ready: () => {} }; // no `bridge`

  const found = resolveBridge(app);
  assert.equal(found.hops, 1, 'the proxy on self is skipped');
  assert.equal(found.bus, shell.DeSciX);
});

test('a bus without a version marker is not a bus', () => {
  const half = { DeSciX: { view: {}, bridge: { ready: true } } }; // no version
  half.parent = half;
  assert.equal(resolveBridge(half).mode, 'standalone');
});

// ──────────────────────────────────────────────────────────────── the guard

test('a pathological frame chain terminates instead of spinning', () => {
  // Never-ending ancestors: each `parent` is a fresh frame. Without a ceiling this
  // is an infinite loop inside a property getter, which would hang the app.
  const endless = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'parent') return new Proxy({}, this);
      return undefined;
    },
  });

  let found;
  assert.doesNotThrow(() => { found = resolveBridge(endless); });
  assert.equal(found.mode, 'standalone');
  assert.ok(BRIDGE_RESOLUTION_MAX_HOPS > 0);
});

test('a shell sitting just inside the hop ceiling is still found', () => {
  const shell = shellWindow({ view: {} });
  let w = shell;
  for (let i = 0; i < BRIDGE_RESOLUTION_MAX_HOPS; i++) w = nest(frameWindow(), w);
  assert.equal(resolveBridge(w).bus, shell.DeSciX);
});
