/**
 * SdkInitializer boots the store ONLY when the origin says "no binding here" (a 404). A transient
 * failure of /__descix/app-binding.json (timeout, network, 502/503/504) is retried once behind the
 * loading screen; any failure that remains shows the shell's error state, inside the shell's frame,
 * with a retry.
 *
 * THE DEFECT: the binding reader turned every failure (a 4xx/5xx, a network error, the 2000 ms abort,
 * an unparseable or wrong-shaped body) into null, and null booted the store — so a broken or slow
 * binding endpoint on an app's host showed the user the store with nothing said anywhere.
 *
 * HOW THIS RUNS THE REAL COMPONENT: this package has no React or DOM in its test tree, so Vite's
 * SSR loader compiles the real SdkInitializer.jsx and resolves `react`, `react/jsx-runtime`,
 * `../AppContext`, `@discord/embedded-app-sdk`, `./ErrorBoundary`, `../components/ShellErrorState.jsx`
 * and `../components/ShellFrame.jsx` to the harness in tests/support/sdk-initializer-harness/ (a
 * tiny hooks runtime and named markers). appBinding.js, AppData.jsx and the rest of the graph are
 * the real modules. Each case renders the component under fake timers, lets its init effect run
 * against a stubbed global fetch, renders again, and reads what it returned and dispatched.
 *
 * Run: cd descix-app-sdk && node --test tests/sdk-initializer-binding.test.js
 */
import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const SDK_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HARNESS = path.join(SDK_ROOT, 'tests', 'support', 'sdk-initializer-harness');
const STUBS = {
  react: 'react.js',
  'react/jsx-runtime': 'jsx-runtime.js',
  'react/jsx-dev-runtime': 'jsx-runtime.js',
  '../AppContext': 'app-context.js',
  '@discord/embedded-app-sdk': 'discord-sdk.js',
  './ErrorBoundary': 'error-boundary.js',
  '../components/ShellErrorState.jsx': 'shell-error-state.js',
  '../components/ShellFrame.jsx': 'shell-frame.js',
};

let server;
let mods;

before(async () => {
  globalThis.window = {
    location: { pathname: '/', href: 'https://egpt.descix.net/', search: '', hash: '' },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };
  server = await createServer({
    configFile: false,
    root: SDK_ROOT,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    // Bare stubs must be inlined, or Vite externalizes them to node_modules and skips resolveId.
    ssr: { noExternal: Object.keys(STUBS).filter((s) => !s.startsWith('.')) },
    plugins: [{
      name: 'sdk-initializer-harness',
      enforce: 'pre',
      resolveId(source) {
        return STUBS[source] ? path.join(HARNESS, STUBS[source]) : null;
      },
    }],
  });
  const load = (p) => server.ssrLoadModule(p);
  mods = {
    SdkInitializer: (await load('/src/util/SdkInitializer.jsx')).default,
    react: await load(path.join(HARNESS, 'react.js')),
    ctx: await load(path.join(HARNESS, 'app-context.js')),
    ShellErrorState: (await load(path.join(HARNESS, 'shell-error-state.js'))).default,
    ShellFrame: (await load(path.join(HARNESS, 'shell-frame.js'))).default,
    ErrorBoundary: (await load(path.join(HARNESS, 'error-boundary.js'))).default,
    AppContextEvent: (await load('/src/util/AppData.jsx')).AppContextEvent,
  };
});

after(async () => {
  await server?.close();
  delete globalThis.window;
});

const json = (status, body) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const text = (status) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } });
const hang = async (_url, { signal }) => new Promise((_, reject) => {
  signal.addEventListener('abort', () => reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })));
});
const offline = async () => { throw new TypeError('Failed to fetch'); };
const BINDING = { mode: 'standalone', appId: 'egpt', appUrl: 'https://egpt.descix.net/prod/egpt/site/index.html', source: 'edge' };

/** A fetch that answers with `stubs[0]`, then `stubs[1]`, … (the last repeats), counting calls. */
function seq(...stubs) {
  const f = async (url, init) => { f.inits.push(init); return stubs[Math.min(f.calls++, stubs.length - 1)](url, init); };
  f.calls = 0;
  f.inits = [];
  return f;
}
/** Answers `make()` `ms` after it starts (on the mocked setTimeout). */
const slow = (ms, make) => () => new Promise((resolve) => setTimeout(() => resolve(make()), ms));

/**
 * Mount SdkInitializer with `fetchStub` under fake timers, run its init (advancing the clock in
 * 100 ms steps, up to 20 s), and report what it rendered and dispatched.
 */
async function boot(fetchStub) {
  const { react, ctx, SdkInitializer } = mods;
  react.resetHooks();
  const events = [];
  ctx.harnessContext.value = {
    appEvent: { type: mods.AppContextEvent.SDK_INITIALIZE },
    setAppEvent: (e) => events.push(e),
    isEmbedded: false,
  };
  const errors = [];
  const savedError = console.error;
  const savedLog = console.log;
  const savedFetch = globalThis.fetch;
  console.error = (...a) => errors.push(a.join(' '));
  console.log = () => {};
  globalThis.fetch = fetchStub;
  mock.timers.enable({ apis: ['setTimeout'] });
  const props = { children: 'APP-CHILDREN' };
  const settle = async () => {
    let out = react.render(SdkInitializer, props);
    for (let elapsed = 0; elapsed <= 20000; elapsed += 100) {
      for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
      out = react.render(SdkInitializer, props);
      if (events.length || out.type === mods.ShellFrame) return { out, elapsed };
      mock.timers.tick(100);
    }
    return { out, elapsed: Infinity };
  };
  try {
    const { out, elapsed } = await settle();
    return {
      out, elapsed, events,
      errors: errors.filter((e) => e.includes('[SdkInitializer]')),
      fetchCalls: fetchStub.calls,
      retry: async (nextFetch, { times = 1 } = {}) => {
        globalThis.fetch = nextFetch;
        const onRetry = errorState(out).props.onRetry;
        for (let i = 0; i < times; i++) onRetry();
        return settle();
      },
    };
  } finally {
    mock.timers.reset();
    console.error = savedError;
    console.log = savedLog;
    globalThis.fetch = savedFetch;
  }
}

/** The ShellErrorState inside its ShellFrame, or null. */
function errorState(out) {
  if (out.type !== mods.ShellFrame) return null;
  const child = out.props.children;
  return child && child.type === mods.ShellErrorState ? child : null;
}

const bootedStore = (events) => events.some((e) => e === mods.AppContextEvent.SDK_FAILED || e?.type === mods.AppContextEvent.SDK_FAILED);
const bootedApp = (events) => events.some((e) => e?.type === mods.AppContextEvent.SDK_READY && e.payload?.mode === 'STANDALONE_APP');

test('a binding boots the bound app, standalone', async () => {
  const r = await boot(seq(json(200, BINDING)));
  assert.ok(bootedApp(r.events), JSON.stringify(r.events));
  assert.equal(r.events.find((e) => e?.type)?.payload.appId, 'egpt');
  assert.equal(r.out.type, mods.ErrorBoundary);
  assert.deepEqual(r.errors, []);
});

test('a 404 ("no binding here") boots the store, and nothing else does', async () => {
  const r = await boot(seq(json(404, null)));
  assert.ok(bootedStore(r.events), JSON.stringify(r.events));
  assert.equal(r.out.type, mods.ErrorBoundary, 'the shell renders its children (the store)');
  assert.equal(r.out.props.children, 'APP-CHILDREN');
  assert.deepEqual(r.errors, []);
  assert.equal(r.fetchCalls, 1);
});

// A definite answer: the error at once, one request, no retry.
const DEFINITE = {
  'HTTP 400': [text(400), /answered HTTP 400$/],
  'HTTP 500': [text(500), /answered HTTP 500$/],
  'HTTP 401': [text(401), /answered HTTP 401$/],
  unparseable: [text(200), /answered HTTP 200 with a body that is not JSON$/],
  'wrong shape': [json(200, { mode: 'standalone', appId: 'egpt' }), /not an app binding \(missing appUrl, source\)$/],
};
// A transient failure from both requests: the error after the second.
const TRANSIENT = {
  'HTTP 502': [text(502), /answered HTTP 502, after a second request$/],
  'HTTP 503': [text(503), /answered HTTP 503, after a second request$/],
  'HTTP 504': [text(504), /answered HTTP 504, after a second request$/],
  'network error': [offline, /could not be reached \(Failed to fetch\), after a second request$/],
  timeout: [hang, /did not answer within 10000 ms, after a second request$/],
};

function assertErrorScreen(name, r, reason) {
  assert.ok(!bootedStore(r.events), `${name} booted the store: ${JSON.stringify(r.events)}`);
  assert.ok(!bootedApp(r.events), `${name} booted an app: ${JSON.stringify(r.events)}`);
  assert.equal(r.events.length, 0, `nothing is dispatched: ${JSON.stringify(r.events)}`);
  const es = errorState(r.out);
  assert.ok(es, `${name} must render ShellErrorState inside ShellFrame; got ${String(r.out.type?.name || r.out.type)}`);
  assert.match(es.props.detail, reason);
  assert.equal(typeof es.props.onRetry, 'function', 'the error state offers a retry');
  assert.ok(es.props.title && es.props.message, 'a visible title and plain sentence');
  assert.equal(r.errors.length, 1, `exactly one console.error: ${JSON.stringify(r.errors)}`);
  assert.ok(r.errors[0].includes(es.props.detail), `the console line names the same reason: ${r.errors[0]}`);
}

for (const [name, [stub, reason]] of Object.entries(DEFINITE)) {
  test(`${name}: the error state at once (one request, no hedge), never the store`, async () => {
    const r = await boot(seq(stub));
    assertErrorScreen(name, r, reason);
    assert.equal(r.fetchCalls, 1);
    assert.equal(r.elapsed, 0, 'no waiting on a definite answer');
  });
}

for (const [name, [stub, reason]] of Object.entries(TRANSIENT)) {
  test(`${name} from both requests: the error state after the second, never the store`, async () => {
    const r = await boot(seq(stub, stub));
    assertErrorScreen(name, r, reason);
    assert.equal(r.fetchCalls, 2);
  });
}

test('timeout: the loading state holds for the whole 10000 ms cap, then the error', async () => {
  const r = await boot(seq(hang, hang));
  assert.ok(r.elapsed >= 10000 && r.elapsed <= 10100, `error after ${r.elapsed} ms of virtual time`);
});

test('a 404 at 3 s boots the store at 3 s (the first request is not aborted at 2 s)', async () => {
  const r = await boot(seq(slow(3000, json(404, null)), hang));
  assert.ok(bootedStore(r.events), JSON.stringify(r.events));
  assert.ok(r.elapsed >= 3000 && r.elapsed <= 3100, `store after ${r.elapsed} ms`);
  assert.equal(r.fetchCalls, 2, 'a hedge request ran alongside from 2000 ms');
  assert.deepEqual(r.errors, []);
});

for (const [name, first] of Object.entries({ 'first hangs': hang, 'network error': offline, 'HTTP 503': text(503) })) {
  test(`${name}, second a binding: the app boots, nothing is shown or logged`, async () => {
    const r = await boot(seq(first, json(200, BINDING)));
    assert.ok(bootedApp(r.events), JSON.stringify(r.events));
    assert.deepEqual(r.errors, []);
    assert.equal(r.fetchCalls, 2);
  });
}

test('first hangs, second a 404: the store', async () => {
  const r = await boot(seq(hang, json(404, null)));
  assert.ok(bootedStore(r.events), JSON.stringify(r.events));
  assert.deepEqual(r.errors, []);
});

async function withRetryTimers(fn) {
  const savedLog = console.log;
  const savedFetch = globalThis.fetch;
  console.log = () => {};
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    return await fn();
  } finally {
    mock.timers.reset();
    console.log = savedLog;
    globalThis.fetch = savedFetch;
  }
}

test('Try again re-asks the origin: a 500 then a binding boots the app', async () => {
  const r = await boot(seq(text(500)));
  assert.ok(errorState(r.out));
  await withRetryTimers(async () => {
    const { out } = await r.retry(seq(json(200, BINDING)));
    assert.ok(bootedApp(r.events), JSON.stringify(r.events));
    assert.equal(out.type, mods.ErrorBoundary, 'the error state is gone after a successful retry');
  });
});

test('Try again pressed twice starts ONE run (one request)', async () => {
  const r = await boot(seq(text(500)));
  await withRetryTimers(async () => {
    const next = seq(json(200, BINDING));
    await r.retry(next, { times: 2 });
    assert.equal(next.calls, 1, `requests after a double Try again: ${next.calls}`);
    assert.equal(r.events.filter((e) => e?.type === mods.AppContextEvent.SDK_READY).length, 1);
  });
});

test('unmount while waiting: the cleanup aborts both requests and the late result is dropped', async () => {
  const { react, ctx, SdkInitializer } = mods;
  react.resetHooks();
  const events = [];
  ctx.harnessContext.value = { appEvent: { type: mods.AppContextEvent.SDK_INITIALIZE }, setAppEvent: (e) => events.push(e), isEmbedded: false };
  const f = seq(slow(5000, json(200, BINDING)));
  const saved = { fetch: globalThis.fetch, log: console.log, error: console.error };
  const errors = [];
  globalThis.fetch = f;
  console.log = () => {};
  console.error = (...a) => errors.push(a.join(' '));
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    react.render(SdkInitializer, { children: 'C' });
    for (let t = 0; t < 2500; t += 100) { await new Promise((r) => setImmediate(r)); mock.timers.tick(100); }
    await new Promise((r) => setImmediate(r));
    assert.equal(f.calls, 2, 'both requests were in flight');
    react.unmount();
    assert.ok(f.inits.every((i) => i.signal.aborted), 'the cleanup aborted both requests');
    for (let t = 0; t < 20000; t += 500) { await new Promise((r) => setImmediate(r)); mock.timers.tick(500); }
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(events, [], 'nothing is dispatched after unmount');
    assert.deepEqual(errors.filter((e) => e.includes('[SdkInitializer]')), []);
  } finally {
    mock.timers.reset();
    globalThis.fetch = saved.fetch;
    console.log = saved.log;
    console.error = saved.error;
  }
});

test('a 503 then a hang to the 10 s cap: the error screen names the timeout AND the earlier 503', async () => {
  const r = await boot(seq(text(503), hang));
  assertErrorScreen('503 then hang', r, /did not answer within 10000 ms, after a second request; an earlier request answered HTTP 503$/);
  assert.equal(r.fetchCalls, 2);
  assert.ok(r.elapsed >= 10000 && r.elapsed <= 10100, `error after ${r.elapsed} ms of virtual time`);
});

test('StrictMode: cancel run 1, start run 2, run 1 resumes; the unmount still aborts run 2', async () => {
  const { react, ctx, SdkInitializer } = mods;
  react.resetHooks();
  const events = [];
  ctx.harnessContext.value = { appEvent: { type: mods.AppContextEvent.SDK_INITIALIZE }, setAppEvent: (e) => events.push(e), isEmbedded: false };
  const f = seq(hang);
  const saved = { fetch: globalThis.fetch, log: console.log, error: console.error };
  const errors = [];
  globalThis.fetch = f;
  console.log = () => {};
  console.error = (...a) => errors.push(a.join(' '));
  mock.timers.enable({ apis: ['setTimeout'] });
  const tickMicro = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r)); };
  try {
    react.render(SdkInitializer, { children: 'C' }); // run 1 starts
    assert.equal(f.calls, 1, 'run 1 made its first request');
    // The StrictMode double-mount, synchronously: the cleanup cancels run 1, the re-run effects
    // start run 2 — before run 1's await has resumed.
    react.remount();
    react.render(SdkInitializer, { children: 'C' });
    assert.equal(f.calls, 2, 'run 2 made its first request');
    assert.equal(f.inits[0].signal.aborted, true, 'run 1 was cancelled');
    assert.equal(f.inits[1].signal.aborted, false, 'run 2 is running');
    await tickMicro(); // run 1 resumes with { kind: 'cancelled' } and returns
    react.unmount();
    assert.equal(f.inits[1].signal.aborted, true, 'the unmount aborted run 2: the handle still pointed at it');
    for (let t = 0; t < 20000; t += 500) { await tickMicro(); mock.timers.tick(500); }
    await tickMicro();
    assert.equal(f.calls, 2, 'run 2 never hedged: it was cancelled before 2000 ms');
    assert.deepEqual(events, [], 'nothing is dispatched after unmount');
    assert.deepEqual(errors.filter((e) => e.includes('[SdkInitializer]')), []);
  } finally {
    mock.timers.reset();
    globalThis.fetch = saved.fetch;
    console.log = saved.log;
    console.error = saved.error;
  }
});
