/**
 * resolveBridge mode contract — GAP-5.
 *
 * The defect this locks down: "no shell above me" and "a shell is above me but I cannot read
 * it" were reported as the SAME `standalone`. That collapse is why GAP-4 (a code-site URL
 * pinned to the wrong absolute host) survived undetected — the app loaded inside the shell,
 * could not read the cross-origin ancestor, reported `standalone`, and degraded to
 * scripting-window-CLOSED, which looks exactly like correctly running with no shell.
 *
 * `window.top !== window` is readable cross-origin, so the distinction costs nothing.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { resolveBridge, BRIDGE_RESOLUTION_MAX_HOPS } from '../src/util/bridgeResolver.js';

const BUS = { bridge: { version: '1' } };

/** A window that is the top of its own chain. */
function topWindow(extra = {}) { const w = { ...extra }; w.parent = w; w.top = w; return w; }

/** A child framed by `parent`; `top` is the chain's real top. */
function childOf(parent, extra = {}) {
    const w = { ...extra }; w.parent = parent;
    let t = parent; while (t.parent && t.parent !== t) t = t.parent;
    w.top = t; return w;
}

/** An ancestor whose properties throw on read — a cross-origin frame. */
function crossOrigin() {
    const w = {};
    Object.defineProperty(w, 'DeSciX', { get() { throw new Error('SecurityError: Blocked a frame'); } });
    w.parent = w; w.top = w; return w;
}

test('bus on self -> shell at hop 0', () => {
    const w = topWindow({ DeSciX: BUS });
    const r = resolveBridge(w);
    assert.strictEqual(r.mode, 'shell');
    assert.strictEqual(r.hops, 0);
    assert.strictEqual(r.bus, BUS);
});

test('bus on parent -> shell at hop 1', () => {
    const shell = topWindow({ DeSciX: BUS });
    const r = resolveBridge(childOf(shell));
    assert.strictEqual(r.mode, 'shell');
    assert.strictEqual(r.hops, 1);
});

test('top window with no bus -> standalone (and ONLY this case)', () => {
    const r = resolveBridge(topWindow());
    assert.strictEqual(r.mode, 'standalone');
    assert.strictEqual(r.bus, null);
});

test('NEGATIVE CONTROL: framed with no readable ancestor bus is NOT standalone', () => {
    // Pre-fix this returned 'standalone' — the collapse GAP-5 measured.
    const r = resolveBridge(childOf(topWindow()));
    assert.notStrictEqual(r.mode, 'standalone',
        'framed-with-no-bridge must not be reported as standalone: that is the GAP-5 collapse');
    assert.strictEqual(r.mode, 'embedded-no-bridge');
    assert.strictEqual(r.bus, null);
});

test('framed under a CROSS-ORIGIN ancestor -> embedded-no-bridge, never a throw', () => {
    const outer = crossOrigin();
    const r = resolveBridge(childOf(outer));
    assert.strictEqual(r.mode, 'embedded-no-bridge');
    assert.strictEqual(r.bus, null);
});

test('a same-origin bus ABOVE a cross-origin frame is still found (walk continues)', () => {
    // Powch depends on the walk continuing past an unreadable ancestor.
    const shell = topWindow({ DeSciX: BUS });
    const opaque = childOf(shell);
    Object.defineProperty(opaque, 'DeSciX', { get() { throw new Error('SecurityError'); } });
    const r = resolveBridge(childOf(opaque));
    assert.strictEqual(r.mode, 'shell');
});

test('no DOM (SSR) -> standalone, never throws', () => {
    const r = resolveBridge(null);
    assert.strictEqual(r.mode, 'standalone');
    assert.strictEqual(r.window, null);
});

test('a hostile deep chain terminates at the hop ceiling as embedded-no-bridge', () => {
    let w = topWindow();
    for (let i = 0; i < BRIDGE_RESOLUTION_MAX_HOPS + 5; i++) w = childOf(w);
    const r = resolveBridge(w);
    assert.strictEqual(r.mode, 'embedded-no-bridge');
});

test('the three modes are exactly the declared set', () => {
    const seen = new Set([
        resolveBridge(topWindow({ DeSciX: BUS })).mode,
        resolveBridge(topWindow()).mode,
        resolveBridge(childOf(topWindow())).mode,
    ]);
    assert.deepStrictEqual([...seen].sort(), ['embedded-no-bridge', 'shell', 'standalone']);
});
