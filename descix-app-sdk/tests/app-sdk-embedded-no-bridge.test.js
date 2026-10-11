/**
 * The app-side SDK proxy in a framed context whose ancestors expose no readable bus
 * ('embedded-no-bridge': cross-origin non-shell parent, the standalone-app / PowchClient
 * integration). Every accessor must answer from the BUS (null => absent), never from the
 * mode string: busProp once dereferenced `found.bus[name]` for any non-'standalone' mode
 * and threw, so `{...window.DeSciX}` (which evaluates every getter) crashed the host page.
 *
 * Executes the GENERATED scaffold (the artifact apps load), not the template.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { SITE_SCAFFOLD_BRIDGE } from '../scaffold/index.js';

const SRC = fs.readFileSync(SITE_SCAFFOLD_BRIDGE, 'utf8');

/** Run the scaffold in a fake `window` and return that window. */
function load(win) {
  win.console = { error() {}, warn() {}, log() {} };
  win.addEventListener = () => {};
  win.removeEventListener = () => {};
  vm.runInNewContext(SRC, { window: win, console: win.console });
  return win;
}

/** A top window that cannot be read: an ancestor whose DeSciX getter throws (cross-origin). */
function crossOriginTop() {
  const t = {};
  Object.defineProperty(t, 'DeSciX', { get() { throw new Error('SecurityError'); } });
  t.parent = t; t.top = t;
  return t;
}

function framedNoBridge() {
  const top = crossOriginTop();
  const w = { parent: top, top };
  return load(w);
}

test('embedded-no-bridge: the fixture really is that mode', () => {
  const w = framedNoBridge();
  assert.equal(w.DeSciX.mode, 'embedded-no-bridge');
});

test('embedded-no-bridge: spreading window.DeSciX does not throw and yields null-valued props', () => {
  const w = framedNoBridge();
  let spread;
  assert.doesNotThrow(() => { spread = { ...w.DeSciX }; });
  assert.equal(spread.AppData, null);
  assert.equal(spread.AppContext, null);
  assert.equal(spread.view, null);
  assert.equal(spread.chat, null);
  assert.equal(spread.powch, null);
});

test('embedded-no-bridge: ready() resolves (does not reject) with the honest mode', async () => {
  const w = framedNoBridge();
  const r = await w.DeSciX.ready();   // vm-realm object: compare fields, not prototypes
  assert.equal(r.mode, 'embedded-no-bridge');
  assert.equal(r.members.length, 0);
  assert.equal(r.version, null);
});

test('embedded-no-bridge: call() throws the named no-shell error, not a TypeError on null', () => {
  const w = framedNoBridge();
  assert.throws(() => w.DeSciX.call('x', {}), /requires the DeSciX App Shell/);
});

test('shell mode still reads the bus (positive control)', () => {
  const bus = { bridge: { version: 1, ready: true, members: () => ['AppData'] }, AppData: { a: 1 } };
  const top = { DeSciX: bus }; top.parent = top; top.top = top;
  const w = load({ parent: top, top });
  assert.equal(w.DeSciX.mode, 'shell');
  assert.equal({ ...w.DeSciX }.AppData.a, 1);
});

test('standalone (top window, no bus): accessors null, ready() resolves standalone', async () => {
  const top = {}; top.parent = top; top.top = top;
  const w = load(top);
  assert.equal(w.DeSciX.mode, 'standalone');
  assert.equal({ ...w.DeSciX }.AppData, null);
  assert.equal((await w.DeSciX.ready()).mode, 'standalone');
});
