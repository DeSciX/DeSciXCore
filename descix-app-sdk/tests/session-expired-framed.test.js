/**
 * GATE: a 401 inside a FRAMED shell resets the session in place and does not navigate
 * (found while embedding the shell inside the Powch iframe).
 *
 * THE DEFECT: makeCommandRequestJSON fires SESSION_EXPIRED on a 401 and AppContext's handler set
 * window.location.href = origin + '/'. In the shell inside the Powch iframe that reloads the frame
 * mid-request: the host's pending POWCH_LOGIN never gets a reply and times out instead of the
 * running flow falling back to the tap.
 *
 * Measured on the real 401 path: the real makeCommandRequestJSON, a 401 at the global fetch seam,
 * the real AppData dispatcher, and the real handler (util/sessionExpiry.js). AppContext.jsx is JSX
 * and does not load under node, so its call site is pinned by a source check.
 *
 * Run: node --test tests/session-expired-framed.test.js
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');
const ORIGIN = 'https://shell.example.invalid';

globalThis.__VITE_ENV__ = { VITE_DEBUG_PROXY: '', MODE: 'test' };

function mapStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: mapStorage() });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, writable: true, value: mapStorage() });

// The shell's window. `navigations` records every href assignment: a navigation is the defect.
const navigations = [];
function makeShellWindow({ framed }) {
  const location = {
    search: '', pathname: '/app', origin: ORIGIN,
    get href() { return `${ORIGIN}/app`; },
    set href(v) { navigations.push(v); },
  };
  const w = { location };
  w.self = w;
  w.parent = framed ? { location: { origin: 'https://host.example.invalid' } } : w;
  w.top = framed ? w.parent : w;
  return w;
}
globalThis.window = makeShellWindow({ framed: false });

registerHooks({
  load(url, context, nextLoad) {
    if (!url.includes('/descix-app-sdk/src/')) return nextLoad(url, context);
    const r = nextLoad(url, { ...context, format: 'module' });
    let src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    src = src.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    return { ...r, source: src };
  },
});

// The server, at the fetch seam: every command answers 401.
globalThis.fetch = async () => {
  const reply = { status: 'ERROR', message: 'Unauthorized' };
  return { ok: false, status: 401, json: async () => reply, text: async () => JSON.stringify(reply), headers: { get: () => 'application/json' } };
};

const { AppData, AppContextEvent, makeCommandRequestJSON, registerAppEventDispatcher } =
  await import(join(SRC, 'util', 'AppData.jsx'));

const SIGNED_IN = { id: 'user-123', access_token: 'tok', email: 'owner@example.invalid' };

/**
 * Wire the dispatcher the way AppContext's state machine does, to the real handler, and run a
 * two-step flow: step 1 hits the 401, step 2 is what the flow does next (Powch's tap fallback).
 */
async function runFlowThrough401() {
  const { handleSessionExpired } = await import(join(SRC, 'util', 'sessionExpiry.js'));
  const shell = { sessionInfo: SIGNED_IN, resets: 0, results: [] };
  registerAppEventDispatcher(({ type }) => {
    if (type !== AppContextEvent.SESSION_EXPIRED) return;
    shell.results.push(handleSessionExpired({
      resetShellState: () => { shell.sessionInfo = null; shell.resets += 1; },
    }));
  });
  const steps = [];
  try {
    await makeCommandRequestJSON('powch_session_check', {});
    steps.push('step1-ok');
  } catch (e) {
    steps.push(`step1-${e.status}`);
  }
  steps.push('step2-tap-fallback');
  return { shell, steps };
}

beforeEach(() => {
  navigations.length = 0;
  AppData.sessionInfo = SIGNED_IN;
});

test('(a) framed shell + 401: no navigation, session reset in place, the next flow step runs', async () => {
  globalThis.window = makeShellWindow({ framed: true });
  const { shell, steps } = await runFlowThrough401();
  assert.deepEqual(navigations, [], 'a framed shell must not navigate on SESSION_EXPIRED');
  assert.equal(shell.resets, 1, 'the shell state reset ran exactly once');
  assert.equal(shell.sessionInfo, null);
  assert.equal(AppData.sessionInfo, null, 'AppData session cleared');
  assert.deepEqual(shell.results, [{ navigated: false }]);
  assert.deepEqual(steps, ['step1-401', 'step2-tap-fallback']);
});

test('(b) top-level shell + 401: resets, then navigates to the host root as before', async () => {
  globalThis.window = makeShellWindow({ framed: false });
  const { shell, steps } = await runFlowThrough401();
  assert.deepEqual(navigations, [`${ORIGIN}/`]);
  assert.equal(shell.resets, 1);
  assert.equal(AppData.sessionInfo, null);
  assert.deepEqual(shell.results, [{ navigated: true }]);
  assert.deepEqual(steps, ['step1-401', 'step2-tap-fallback']);
});

test('(a) AppContext routes SESSION_EXPIRED through handleSessionExpired and navigates nowhere itself', () => {
  const src = readFileSync(join(SRC, 'AppContext.jsx'), 'utf8');
  const start = src.indexOf('case AppContextEvent.SESSION_EXPIRED:');
  assert.ok(start > 0, 'SESSION_EXPIRED case present');
  const end = src.indexOf('break;', start);
  const body = src.slice(start, end);
  assert.match(body, /handleSessionExpired\(/, 'the case calls the one handler');
  assert.doesNotMatch(body, /window\.location/, 'the case must not navigate on its own');
  assert.match(src, /import \{ handleSessionExpired \} from '\.\/util\/sessionExpiry\.js';/);
});
