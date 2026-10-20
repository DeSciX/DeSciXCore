/**
 * default_view — the view an app STARTS in.
 *
 * One fact, one path: the app's site declares `default_view` in share.json (util/share.js), the
 * binding carries it as `defaultView` (util/appBinding.js standaloneBinding; producers: `descix
 * serve` here and the edge worker), and the shell seeds its view from it with initialViewFor
 * (util/appView.js) BEFORE the app surface first renders (AppContext, SDK_READY).
 *
 * THE DEFECT (measured on PROD, signed out, 2026-10-19): an app face painted SplitView ("No app
 * selected / Sign in to chat") for 0.44-0.68 s on desktop before the app asked for CodeSite,
 * because the shell's view started at the module default whatever the app wanted.
 *
 * Run: node --test tests/default-view.test.js
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';

import {
  VIEW_MODES, DEFAULT_VIEW, initialViewFor, seedView, resetView, setView, getView,
} from '../src/util/appView.js';
import { useDeSciXView } from '../src/hooks/useDeSciXView.js';
import { APP_BINDING_CONTRACT, STANDALONE_MODE, standaloneBinding, fetchAppBinding } from '../src/util/appBinding.js';
import { resolveServeBinding, servedShareJsonFile, bindableApps } from '../src/dev/serveBinding.js';
import { withV3Tree } from './support/v3Tree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const PORT = 5599;

beforeEach(() => { seedView(null); });

// ── initialViewFor: the one owner of "which view first" ────────────────────────────────────

test('initialViewFor(binding with CodeSite) is CodeSite', () => {
  assert.equal(initialViewFor({ appId: 'egpt', defaultView: 'CodeSite' }), VIEW_MODES.CODESITE);
});

test('initialViewFor without a defaultView is SplitView (DEFAULT_VIEW): no binding, no field, null', () => {
  assert.equal(DEFAULT_VIEW, VIEW_MODES.SPLITVIEW);
  for (const b of [null, undefined, { appId: 'egpt' }, { appId: 'egpt', defaultView: null }]) {
    assert.equal(initialViewFor(b), VIEW_MODES.SPLITVIEW, JSON.stringify(b));
  }
});

test('NEGATIVE: initialViewFor refuses a view outside VIEW_MODES by name', () => {
  assert.throws(() => initialViewFor({ defaultView: 'FullScreen' }), /"FullScreen" is not a view/);
});

test('seedView sets the view; resetView returns to the SEEDED view, not DEFAULT_VIEW', () => {
  assert.equal(seedView({ defaultView: 'CodeSite' }), 'CodeSite');
  assert.equal(getView(), 'CodeSite');
  setView('Chat');
  resetView();
  assert.equal(getView(), 'CodeSite', 'resetView must use initialViewFor(binding), not DEFAULT_VIEW');
});

test('NEGATIVE control: with nothing seeded (the store), resetView is DEFAULT_VIEW', () => {
  setView('NoChrome');
  resetView();
  assert.equal(getView(), DEFAULT_VIEW);
});

// ── first paint ─────────────────────────────────────────────────────────────────────────────

/** The shell's surface hook, rendered once: what the FIRST paint shows. */
function firstRender() {
  const Surface = () => React.createElement('main', { 'data-view': useDeSciXView() });
  return renderToString(React.createElement(Surface)).match(/data-view="([^"]+)"/)[1];
}

test('FIRST RENDER: a CodeSite binding seeded at SDK_READY paints CodeSite (no chat pane) on the first render', () => {
  seedView({ appId: 'egpt', defaultView: 'CodeSite' });
  const view = firstRender();
  assert.equal(view, 'CodeSite');
  assert.notEqual(view, VIEW_MODES.SPLITVIEW, 'SplitView is the only app view with a chat pane beside the app');
});

test('NEGATIVE control: the old boot (no seed before render) paints SplitView first, whatever the binding said', () => {
  // The old AppContext stored { appId, url } and never touched the view store.
  const view = firstRender();
  assert.equal(view, VIEW_MODES.SPLITVIEW);
});

/**
 * Gate on the real boot code: in AppContext's STANDALONE_APP branch, seedView(...) runs BEFORE
 * setAppState(READY) (ShellContent shows LoadingWidget until READY, so the surface cannot render
 * before the seed), and the config it seeds from carries defaultView.
 */
function seedsBeforeReady(src) {
  const start = src.indexOf("payload?.mode === 'STANDALONE_APP'");
  if (start < 0) return 'no STANDALONE_APP branch';
  const branch = src.slice(start, src.indexOf('return;', start));
  const seed = branch.indexOf('seedView(AppData.appModeConfig)');
  const ready = branch.indexOf('setAppState(AppContextState.READY)');
  if (ready < 0) return 'no READY in the branch';
  if (seed < 0) return 'the branch never seeds the view';
  if (seed > ready) return 'the view is seeded after READY';
  if (!/defaultView:\s*payload\.defaultView/.test(branch)) return 'appModeConfig does not carry defaultView';
  return null;
}

test('AppContext seeds the view from the binding BEFORE READY', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'AppContext.jsx'), 'utf8');
  assert.equal(seedsBeforeReady(src), null);
  const init = fs.readFileSync(path.join(SDK_ROOT, 'src', 'util', 'SdkInitializer.jsx'), 'utf8');
  assert.match(init, /defaultView:\s*servedBinding\?\.defaultView \?\? null/, 'SdkInitializer must hand the served defaultView to SDK_READY');
});

test('NEGATIVE control: the gate fails on the pre-change AppContext (origin/main before this branch)', (t) => {
  let old;
  try {
    old = execFileSync('git', ['show', '8837e29:descix-app-sdk/src/AppContext.jsx'], { cwd: SDK_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    t.skip('base commit 8837e29 is not in this clone');
    return;
  }
  assert.equal(seedsBeforeReady(old), 'the branch never seeds the view');
  // and a seed moved after READY is caught
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'AppContext.jsx'), 'utf8');
  const moved = src.replace('seedView(AppData.appModeConfig);', '')
    .replace('setAppState(AppContextState.READY);\n            triggerViewChange', 'setAppState(AppContextState.READY);\n            seedView(AppData.appModeConfig);\n            triggerViewChange');
  assert.equal(seedsBeforeReady(moved), 'the view is seeded after READY');
});

// ── the binding contract ───────────────────────────────────────────────────────────────────

test('APP_BINDING_CONTRACT names the five fields, defaultView optional', () => {
  assert.deepEqual(APP_BINDING_CONTRACT.map((f) => f.name), ['mode', 'appId', 'appUrl', 'source', 'defaultView']);
  assert.deepEqual(APP_BINDING_CONTRACT.filter((f) => !f.required).map((f) => f.name), ['defaultView']);
  assert.equal(STANDALONE_MODE, 'standalone');
});

test('standaloneBinding carries defaultView when given and omits the key when absent', () => {
  const base = { appId: 'egpt', appUrl: 'https://egpt.descix.net/prod/egpt/site/index.html', source: 'edge' };
  assert.deepEqual(standaloneBinding({ ...base, defaultView: 'CodeSite' }), { mode: 'standalone', ...base, defaultView: 'CodeSite' });
  assert.ok(!('defaultView' in standaloneBinding(base)));
  assert.ok(!('defaultView' in standaloneBinding({ ...base, defaultView: null })));
});

test('NEGATIVE: standaloneBinding refuses a non-view defaultView and a missing required field, by name', () => {
  const base = { appId: 'egpt', appUrl: 'u', source: 'edge' };
  assert.throws(() => standaloneBinding({ ...base, defaultView: 'FullScreen' }), /defaultView 'FullScreen' is not a view; one of CodeSite, SplitView, Chat, NoChrome/);
  assert.throws(() => standaloneBinding({ ...base, appUrl: undefined }), /appUrl is required/);
});

test('fetchAppBinding passes defaultView through as served', async () => {
  const b = { mode: 'standalone', appId: 'egpt', appUrl: 'u', source: 'edge', defaultView: 'CodeSite' };
  assert.deepEqual(await fetchAppBinding({ fetchImpl: async () => ({ ok: true, json: async () => b }) }), b);
});

// ── descix serve ───────────────────────────────────────────────────────────────────────────

const TREE = {
  gateway: { port: PORT, shell: 'shell', appRepos: ['egpt', 'plain', 'bad', 'devsrv'] },
  repos: {
    shell: { appId: 'daita', site: { port: 5174 } },
    egpt: { appId: 'egpt', site: { static: 'site' } },
    plain: { appId: 'plain', site: { static: 'site' } },
    bad: { appId: 'bad', site: { static: 'site' } },
    devsrv: { appId: 'devsrv', site: { port: 5511 } },
  },
};

function writeShare(dir, obj) {
  fs.mkdirSync(path.join(dir, 'site'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'site', 'share.json'), JSON.stringify(obj));
}

test('serveBinding carries defaultView from the served static site share.json', () => {
  withV3Tree(TREE, ({ dir, repos, config }) => {
    writeShare(repos.egpt, { title: 'EGPT', description: 'D', default_view: 'CodeSite' });
    const b = resolveServeBinding(dir, config, { app: 'egpt', cwd: dir, gatewayPort: PORT });
    assert.equal(b.defaultView, 'CodeSite');
    assert.equal(initialViewFor(b), 'CodeSite');
  });
});

test('NEGATIVE control: a share.json without default_view, or no share.json, gives a binding without defaultView', () => {
  withV3Tree(TREE, ({ dir, repos, config }) => {
    writeShare(repos.plain, { title: 'P', description: 'D' });
    assert.ok(!('defaultView' in resolveServeBinding(dir, config, { app: 'plain', cwd: dir, gatewayPort: PORT })));
    fs.rmSync(path.join(repos.plain, 'site', 'share.json'));
    assert.ok(!('defaultView' in resolveServeBinding(dir, config, { app: 'plain', cwd: dir, gatewayPort: PORT })));
  });
});

test('NEGATIVE: an invalid served share.json refuses the serve, naming the file and the field', () => {
  withV3Tree(TREE, ({ dir, repos, config }) => {
    writeShare(repos.bad, { title: 'B', description: 'D', default_view: 'FullScreen' });
    assert.throws(() => resolveServeBinding(dir, config, { app: 'bad', cwd: dir, gatewayPort: PORT }),
      (e) => e.message.includes(path.join(repos.bad, 'site', 'share.json')) &&
        /default_view 'FullScreen' is not a view/.test(e.message));
  });
});

test('a dev-server site is not read: no defaultView, and the banner reason says why', () => {
  withV3Tree(TREE, ({ dir, repos, config }) => {
    writeShare(repos.devsrv, { title: 'X', description: 'D', default_view: 'CodeSite' });
    const b = resolveServeBinding(dir, config, { app: 'devsrv', cwd: dir, gatewayPort: PORT });
    assert.ok(!('defaultView' in b));
    const where = servedShareJsonFile(bindableApps(dir).find((a) => a.appId === 'devsrv'));
    assert.equal(where.file, null);
    assert.match(where.why, /dev server \(site\.port 5511\)/);
  });
});
