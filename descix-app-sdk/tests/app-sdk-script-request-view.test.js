/**
 * The plain-script bridge (scaffold/site/DeSciXAppSDK.js, generated) exposes DeSciX.requestView,
 * DeSciX.VIEW_OUTCOMES and DeSciX.VIEW_MODES, inlined from src/util/appView.js (the one owner).
 *
 * Loads the GENERATED file, as a site's <script src> would, into a bare window (node:vm).
 *
 * Run: `node --test tests/app-sdk-script-request-view.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { SITE_SCAFFOLD_BRIDGE } from '../scaffold/index.js';
import { VIEW_MODES, VIEW_OUTCOMES } from '../src/util/appView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = fs.readFileSync(SITE_SCAFFOLD_BRIDGE, 'utf8');

/** A bare top window (self-parented, no shell bus) with the generated script loaded into it. */
function loadInWindow(extra = {}) {
  const win = { console, ...extra };
  win.window = win; win.self = win; win.parent = win; win.top = win;
  vm.createContext(win);
  vm.runInContext(SCRIPT, win, { filename: 'DeSciXAppSDK.js' });
  return win;
}

test('the generated script exposes requestView, VIEW_OUTCOMES and VIEW_MODES on DeSciX', () => {
  const { DeSciX } = loadInWindow();
  assert.equal(typeof DeSciX.requestView, 'function');
  // Same lists as the owner module (deepEqual across realms compares values).
  assert.deepEqual({ ...DeSciX.VIEW_OUTCOMES }, { ...VIEW_OUTCOMES });
  assert.deepEqual({ ...DeSciX.VIEW_MODES }, { ...VIEW_MODES });
  assert.ok(Object.isFrozen(DeSciX.VIEW_OUTCOMES));
});

test('NEGATIVE: DeSciX.requestView("FullScreen") throws "not a view" in a bare window', () => {
  const { DeSciX } = loadInWindow();
  assert.throws(() => DeSciX.requestView('FullScreen'), /"FullScreen" is not a view\. Valid: CodeSite, SplitView, Chat, NoChrome/);
});

test('NEGATIVE: a standalone call returns unoffered, no throw', () => {
  const { DeSciX } = loadInWindow();
  const r = DeSciX.requestView('CodeSite', { fallback: 'SplitView' });
  assert.equal(r.outcome, 'unoffered');
  assert.equal(r.bridge, 'standalone');
  assert.equal(r.mode, null);
  assert.equal(r.requested, 'CodeSite');
});

test('the outcome and mode lists are not restated in the template: they come only from appView.js', () => {
  const template = fs.readFileSync(path.resolve(__dirname, '..', 'templates', 'DeSciXAppSDK.template.js'), 'utf8');
  assert.match(template, /__VIEW_REQUEST__/);
  for (const v of Object.values(VIEW_OUTCOMES)) assert.doesNotMatch(template, new RegExp(`['"]${v}['"]`), v);
  assert.doesNotMatch(template, /Object\.freeze\(\{\s*CODESITE/);
});
