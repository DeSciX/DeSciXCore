/**
 * Conformance: the APP chooses its view (AMB-3), and the shell honours it.
 *
 * What this replaces: AppWidget rendered CodeSite with `enableChat={true}`
 * hardcoded whenever an app had a URL. A plain tool that wants its whole surface
 * and a document app that wants chat beside it got the same frame, and nothing an
 * app could say changed it.
 *
 * The mechanism is the existing service bus — window.DeSciX already carries
 * .powch and .config, and an embedded app reads them off its PARENT window. The
 * view API is one more member, reached the same way:
 *   window.parent.DeSciX.view.set('CodeSite')
 * That works because shell and app are same-origin, the property G-1 restored.
 *
 * Run: `node --test tests/app-view-api.test.js` from descix-app-sdk/.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VIEW_MODES, DEFAULT_VIEW, getView, setView, subscribeView, resetView, publishViewApi,
} from '../src/util/appView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');

beforeEach(() => {
  delete globalThis.window;
  resetView();
});

test('the three modes the ruling names, and nothing else', () => {
  assert.deepEqual(Object.values(VIEW_MODES).sort(), ['Chat', 'CodeSite', 'SplitView']);
});

test('the default is SplitView — an app that says nothing gets what it always got', () => {
  assert.equal(DEFAULT_VIEW, VIEW_MODES.SPLITVIEW);
  assert.equal(getView(), VIEW_MODES.SPLITVIEW);
});

test('an app can ask for any of the three', () => {
  for (const mode of Object.values(VIEW_MODES)) {
    assert.equal(setView(mode), mode);
    assert.equal(getView(), mode);
  }
});

test('an unknown view FAILS LOUD and names the valid ones', () => {
  assert.throws(() => setView('splitview'), /not a view[\s\S]*CodeSite, SplitView, Chat/,
    'case matters, and silently ignoring a typo would hand the app the wrong layout');
  assert.throws(() => setView(null), /not a view/);
  assert.throws(() => setView('FullScreen'), /not a view/);
  assert.equal(getView(), DEFAULT_VIEW, 'a rejected request must not change the view');
});

test('the shell is notified, because the app loads AFTER the layout is drawn', () => {
  const seen = [];
  const off = subscribeView((m) => seen.push(m));
  setView(VIEW_MODES.CODESITE);
  setView(VIEW_MODES.CHAT);
  assert.deepEqual(seen, ['CodeSite', 'Chat']);
  off();
  setView(VIEW_MODES.SPLITVIEW);
  assert.deepEqual(seen, ['CodeSite', 'Chat'], 'unsubscribe must actually detach');
});

test('setting the SAME view does not churn subscribers', () => {
  setView(VIEW_MODES.CHAT);
  let calls = 0;
  const off = subscribeView(() => { calls += 1; });
  setView(VIEW_MODES.CHAT);
  assert.equal(calls, 0);
  off();
});

test('one throwing subscriber does not stop the others re-rendering', () => {
  let reached = false;
  const off1 = subscribeView(() => { throw new Error('boom'); });
  const off2 = subscribeView(() => { reached = true; });
  setView(VIEW_MODES.CHAT);
  assert.equal(reached, true);
  off1(); off2();
});

test('publishViewApi puts the API on window.DeSciX WITHOUT clobbering the bus', () => {
  globalThis.window = { DeSciX: { powch: { login: () => 'kept' }, config: { env: 'test' } } };
  publishViewApi();
  assert.equal(typeof window.DeSciX.view.set, 'function');
  assert.equal(typeof window.DeSciX.view.get, 'function');
  assert.equal(typeof window.DeSciX.view.subscribe, 'function');
  assert.deepEqual(window.DeSciX.view.MODES, VIEW_MODES);
  assert.equal(window.DeSciX.view.DEFAULT, DEFAULT_VIEW);
  // the rest of the bus survives
  assert.equal(window.DeSciX.powch.login(), 'kept');
  assert.equal(window.DeSciX.config.env, 'test');
});

test('publishViewApi is idempotent and creates the bus if it is absent', () => {
  globalThis.window = {};
  publishViewApi();
  publishViewApi();
  assert.equal(window.DeSciX.view.get(), DEFAULT_VIEW);
});

test('publishViewApi is a no-op without a window (SSR / node)', () => {
  delete globalThis.window;
  assert.doesNotThrow(() => publishViewApi());
});

test('an embedded app drives it exactly as documented, through window.parent', () => {
  // Simulate the real call shape: the app reaches its PARENT's bus, which is only
  // possible because the frames are same-origin.
  globalThis.window = {};
  publishViewApi();
  const appFrame = { parent: globalThis.window };
  appFrame.parent.DeSciX.view.set('CodeSite');
  assert.equal(getView(), VIEW_MODES.CODESITE);
});

// ------------------------------------------------------- the shell honours it

test('the view API is exported from the SDK entry point', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'index.js'), 'utf8');
  for (const name of ['useDeSciXView', 'VIEW_MODES', 'resetView', 'publishViewApi']) {
    assert.match(src, new RegExp(name), `${name} must be reachable by the shell`);
  }
});

test('the hook subscribes rather than reading once', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'hooks', 'useDeSciXView.js'), 'utf8');
  assert.match(src, /subscribeView/,
    'a one-shot read at mount always misses the app, which loads after the layout');
});
