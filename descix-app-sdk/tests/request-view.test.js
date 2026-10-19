/**
 * requestView(mode, { fallback }) — the app asks whatever shell hosts it for a view and is told,
 * as a VIEW_OUTCOMES value, what actually happened. It throws only for a caller error (a mode or
 * fallback outside VIEW_MODES) or a shell that broke the view contract; never because of WHERE
 * the page runs.
 *
 * Run: `node --test tests/request-view.test.js` from descix-app-sdk/.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  VIEW_MODES, VIEW_OUTCOMES, requestView, getView, resetView, publishViewApi, subscribeView,
} from '../src/util/appView.js';
import * as entry from '../src/util/appView.js';

beforeEach(() => { delete globalThis.window; resetView(); });
afterEach(() => { delete globalThis.window; });

/** A top window (self-parented) whose bus carries the given view member. */
function shellWith(view) {
  const w = { DeSciX: { bridge: { version: 1 }, ...(view === undefined ? {} : { view }) } };
  w.parent = w; w.top = w;
  return w;
}
/** An app frame whose parent is `shell`; it is the ambient window. */
function embedIn(shell) {
  const app = { parent: shell, top: shell };
  globalThis.window = app;
  return app;
}
/** A mocked shell view member: lists `modes`, listening, and records set() calls. */
function mockView({ modes = Object.values(VIEW_MODES), listening = true, set } = {}) {
  const calls = [];
  return {
    calls,
    MODES: Object.fromEntries(modes.map((m) => [m.toUpperCase(), m])),
    available: () => listening,
    set: set || ((m) => { calls.push(m); return m; }),
  };
}

test('VIEW_OUTCOMES is the frozen list of five', () => {
  assert.ok(Object.isFrozen(VIEW_OUTCOMES));
  assert.deepEqual(VIEW_OUTCOMES, {
    REQUESTED: 'requested', FALLBACK: 'fallback', UNOFFERED: 'unoffered',
    VIEW_NO_MODES: 'view-no-modes', SET_THREW: 'set-threw',
  });
  assert.equal(typeof entry.requestView, 'function');
});

// ── Caller errors throw ─────────────────────────────────────────────────────────────────────

test('NEGATIVE: requestView("FullScreen") throws "not a view", with or without a shell', () => {
  assert.throws(() => requestView('FullScreen'), /"FullScreen" is not a view\. Valid: CodeSite, SplitView, Chat, NoChrome/);
  const view = mockView();
  embedIn(shellWith(view));
  assert.throws(() => requestView('FullScreen'), /not a view/);
  assert.deepEqual(view.calls, [], 'a refused request never reaches the shell');
});

test('NEGATIVE: a fallback outside VIEW_MODES, or equal to the mode, throws', () => {
  assert.throws(() => requestView('NoChrome', { fallback: 'Kiosk' }), /"Kiosk" is not a view/);
  assert.throws(() => requestView('NoChrome', { fallback: 'NoChrome' }), /the fallback "NoChrome" is the mode itself/);
});

// ── Where the page runs is an outcome, never a throw ───────────────────────────────────────

test('NEGATIVE: no window at all → UNOFFERED, no throw', () => {
  const r = requestView('CodeSite');
  assert.deepEqual(r, { outcome: 'unoffered', mode: null, requested: 'CodeSite', bridge: 'standalone',
    reason: 'no shell: this page is the top window' });
});

test('NEGATIVE: a top window with no shell bus → UNOFFERED (standalone), no throw', () => {
  const w = {}; w.parent = w; w.top = w; globalThis.window = w;
  const r = requestView('CodeSite', { fallback: 'SplitView' });
  assert.equal(r.outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.equal(r.bridge, 'standalone');
  assert.equal(r.mode, null);
});

test('NEGATIVE: a cross-origin shell (its bus throws on read) → UNOFFERED (embedded-no-bridge), no throw', () => {
  const shell = {};
  Object.defineProperty(shell, 'DeSciX', { get() { throw new Error('SecurityError: Blocked a frame'); } });
  shell.parent = shell; shell.top = shell;
  embedIn(shell);
  const r = requestView('NoChrome');
  assert.equal(r.outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.equal(r.bridge, 'embedded-no-bridge');
});

test('NEGATIVE: a shell bus without a view member → UNOFFERED', () => {
  embedIn(shellWith(undefined));
  const r = requestView('Chat');
  assert.equal(r.outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.equal(r.bridge, 'shell');
  assert.match(r.reason, /publishes no view member/);
});

test('NEGATIVE: a shell where no host listens → UNOFFERED, and set() is never called', () => {
  const view = mockView({ listening: false });
  embedIn(shellWith(view));
  const r = requestView('Chat');
  assert.equal(r.outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.match(r.reason, /no host is listening/);
  assert.deepEqual(view.calls, []);
});

// ── A shell that lacks the mode ────────────────────────────────────────────────────────────

test('a shell lacking the mode → FALLBACK when a fallback is given, and the fallback is set', () => {
  const view = mockView({ modes: ['CodeSite', 'SplitView', 'Chat'] });
  embedIn(shellWith(view));
  const r = requestView('NoChrome', { fallback: 'CodeSite' });
  assert.equal(r.outcome, VIEW_OUTCOMES.FALLBACK);
  assert.equal(r.mode, 'CodeSite');
  assert.equal(r.requested, 'NoChrome');
  assert.deepEqual(view.calls, ['CodeSite']);
});

test('NEGATIVE: a shell lacking the mode, no fallback → UNOFFERED, nothing set', () => {
  const view = mockView({ modes: ['CodeSite', 'SplitView', 'Chat'] });
  embedIn(shellWith(view));
  const r = requestView('NoChrome');
  assert.equal(r.outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.match(r.reason, /offers neither "NoChrome" \(no fallback given\)/);
  assert.deepEqual(view.calls, []);
});

test('NEGATIVE: a shell lacking both the mode and the fallback → UNOFFERED, nothing set', () => {
  const view = mockView({ modes: ['SplitView'] });
  embedIn(shellWith(view));
  const r = requestView('NoChrome', { fallback: 'CodeSite' });
  assert.equal(r.outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.match(r.reason, /nor the fallback "CodeSite"/);
  assert.deepEqual(view.calls, []);
});

test('NEGATIVE: a fallback with no view.MODES published → VIEW_NO_MODES, nothing set', () => {
  const view = mockView();
  delete view.MODES;
  embedIn(shellWith(view));
  const r = requestView('NoChrome', { fallback: 'CodeSite' });
  assert.equal(r.outcome, VIEW_OUTCOMES.VIEW_NO_MODES);
  assert.deepEqual(view.calls, []);
});

test('no view.MODES and no fallback → the mode is asked for directly', () => {
  const view = mockView();
  delete view.MODES;
  embedIn(shellWith(view));
  assert.equal(requestView('Chat').outcome, VIEW_OUTCOMES.REQUESTED);
  assert.deepEqual(view.calls, ['Chat']);
});

test('NEGATIVE: set() throwing → SET_THREW with its message, no throw', () => {
  const view = mockView({ set: () => { throw new Error('shell is busy'); } });
  embedIn(shellWith(view));
  const r = requestView('CodeSite');
  assert.equal(r.outcome, VIEW_OUTCOMES.SET_THREW);
  assert.equal(r.mode, null);
  assert.match(r.reason, /view\.set\("CodeSite"\) threw: shell is busy/);
});

// ── A shell that breaks the contract fails loud ────────────────────────────────────────────

test('NEGATIVE: a shell whose set() returns another mode, or that lacks set/available, throws VIEW_CONTRACT_VIOLATED', () => {
  embedIn(shellWith(mockView({ set: () => 'SplitView' })));
  assert.throws(() => requestView('CodeSite'), (e) => e.code === 'VIEW_CONTRACT_VIOLATED' && /returned "SplitView"/.test(e.message));
  const noSet = mockView(); delete noSet.set;
  embedIn(shellWith(noSet));
  assert.throws(() => requestView('CodeSite'), (e) => e.code === 'VIEW_CONTRACT_VIOLATED' && /view\.set is undefined/.test(e.message));
  const noAvail = mockView(); delete noAvail.available;
  embedIn(shellWith(noAvail));
  assert.throws(() => requestView('CodeSite'), (e) => e.code === 'VIEW_CONTRACT_VIOLATED' && /view\.available is undefined/.test(e.message));
});

// ── End to end against the SDK's own shell side ────────────────────────────────────────────

test('REQUESTED: against the real published view API with a listening host, the shell view changes', () => {
  const shell = {}; shell.parent = shell; shell.top = shell;
  globalThis.window = shell;
  publishViewApi();
  const off = subscribeView(() => {});
  embedIn(shell);
  const r = requestView('NoChrome', { fallback: 'CodeSite' });
  assert.deepEqual(r, { outcome: 'requested', mode: 'NoChrome', requested: 'NoChrome', bridge: 'shell', reason: 'set "NoChrome"' });
  assert.equal(getView(), 'NoChrome');
  off();
});

test('NEGATIVE: the real published view API with NO listening host → UNOFFERED, and the shell view is untouched', () => {
  const shell = {}; shell.parent = shell; shell.top = shell;
  globalThis.window = shell;
  publishViewApi();
  embedIn(shell);
  assert.equal(requestView('Chat').outcome, VIEW_OUTCOMES.UNOFFERED);
  assert.equal(getView(), 'SplitView');
});
