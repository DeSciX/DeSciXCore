/**
 * The binding exchange's three answers (startAppBinding(...).result): a binding, "no binding here"
 * (only a 404), and an error that names what went wrong — hedged: a second request at 2000 ms (or
 * at once after a transient failure), first definite answer wins, 10000 ms cap. The contract and
 * the servers it was read from are documented at APP_BINDING_NONE_STATUS in src/util/appBinding.js.
 *
 * Run: cd descix-app-sdk && node --test tests/app-binding-result.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readAppBindingResponse,
  describeAppBindingError,
  isRetryableBindingError,
  APP_BINDING_NONE_STATUS,
  APP_BINDING_PATH,
  APP_BINDING_RESULT,
  APP_BINDING_ERROR,
  APP_BINDING_TIMEOUT_MS,
  APP_BINDING_TOTAL_TIMEOUT_MS,
  APP_BINDING_RETRY_STATUSES,
  APP_BINDING_DETAIL_MAX,
  startAppBinding,
  standaloneBinding,
} from '../src/util/appBinding.js';

const BINDING = standaloneBinding({ appId: 'egpt', appUrl: 'https://egpt.descix.net/prod/egpt/site/index.html', source: 'edge' });
const answer = (status, body) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const notJson = (status) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => { throw new SyntaxError('Unexpected token < in JSON at position 0'); } });

/** A fetch answering `stubs[0]`, then `stubs[1]`, … (the last repeats), recording each call. */
function seq(...stubs) {
  const f = async (url, init) => {
    f.calls.push({ url, init });
    return stubs[Math.min(f.calls.length - 1, stubs.length - 1)](url, init);
  };
  f.calls = [];
  return f;
}

/** The exchange's result, for a case that never cancels. */
const resultOf = (options) => startAppBinding(options).result;

const flush = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r)); };

test('the constants: 404 is "no binding"; hedge at 2000 ms, cap 10000 ms; 502/503/504 are transient', () => {
  assert.equal(APP_BINDING_NONE_STATUS, 404);
  assert.equal(APP_BINDING_TIMEOUT_MS, 2000);
  assert.equal(APP_BINDING_TOTAL_TIMEOUT_MS, 10000);
  assert.equal(APP_BINDING_DETAIL_MAX, 200);
  assert.deepEqual([...APP_BINDING_RETRY_STATUSES], [502, 503, 504]);
});

test('200 with a binding: kind binding, the body as served, one request', async () => {
  const f = seq(answer(200, BINDING));
  assert.deepEqual(await resultOf({ fetchImpl: f }), { kind: 'binding', binding: BINDING });
  assert.equal(f.calls.length, 1);
});

test('the request asks this origin for the binding path, as JSON, with an abort signal', async () => {
  const f = seq(answer(200, BINDING));
  await resultOf({ fetchImpl: f });
  assert.equal(f.calls[0].url, APP_BINDING_PATH);
  assert.equal(f.calls[0].init.headers.Accept, 'application/json');
  assert.ok(f.calls[0].init.signal instanceof AbortSignal);
});

test('404: kind none, whatever the body (GCS answers XML there), no retry', async () => {
  const f = seq(notJson(404));
  assert.deepEqual(await resultOf({ fetchImpl: f }), { kind: 'none' });
  assert.equal(f.calls.length, 1);
  assert.deepEqual(await resultOf({ fetchImpl: answer(404, { anything: true }) }), { kind: 'none' });
});

// ── definite answers: final at once ─────────────────────────────────────────────────────────

for (const status of [400, 401, 403, 410, 500, 501, 505]) {
  test(`${status}: an error at once, one request, never none`, async () => {
    const f = seq(notJson(status));
    const r = await resultOf({ fetchImpl: f });
    assert.deepEqual(r, { kind: 'error', reason: APP_BINDING_ERROR.STATUS, status });
    assert.equal(f.calls.length, 1, 'a definite answer is not retried');
    assert.equal(describeAppBindingError(r), `${APP_BINDING_PATH} answered HTTP ${status}`);
  });
}

test('unparseable 2xx body: an error at once', async () => {
  const f = seq(notJson(200));
  const r = await resultOf({ fetchImpl: f });
  assert.equal(r.kind, 'error');
  assert.equal(r.reason, APP_BINDING_ERROR.UNPARSEABLE);
  assert.equal(r.status, 200);
  assert.equal(f.calls.length, 1);
  assert.equal(describeAppBindingError(r), `${APP_BINDING_PATH} answered HTTP 200 with a body that is not JSON`);
});

const WRONG_SHAPES = [
  [null, /body is null/],
  [[], /body is \[\]/],
  ['standalone', /body is "standalone"/],
  [{ appId: 'egpt' }, /mode is undefined, not 'standalone'/],
  [{ mode: 'store', appId: 'egpt' }, /mode is "store", not 'standalone'/],
  [{ mode: 'standalone' }, /missing appId, appUrl, source/],
  [{ mode: 'standalone', appId: 'egpt' }, /missing appUrl, source/],
  [{ ...BINDING, appUrl: null }, /missing appUrl/],
];
for (const [body, why] of WRONG_SHAPES) {
  test(`wrong-shaped 2xx body ${JSON.stringify(body)}: an error at once, naming why`, async () => {
    const f = seq(answer(200, body));
    const r = await resultOf({ fetchImpl: f });
    assert.equal(r.kind, 'error');
    assert.equal(r.reason, APP_BINDING_ERROR.SHAPE);
    assert.equal(f.calls.length, 1);
    assert.match(describeAppBindingError(r), why);
  });
}

// ── the hedged exchange (startAppBinding), on an injected fake clock ─────────────────────────

/** A deterministic clock: timers fire only when advanced, in time order. */
function fakeClock() {
  let now = 0;
  const timers = [];
  const clock = {
    now: () => now,
    setTimer(fn, ms) { const t = { at: now + ms, fn, live: true }; timers.push(t); return t; },
    clearTimer(t) { if (t) t.live = false; },
    async advanceTo(target) {
      for (;;) {
        const due = timers.filter((t) => t.live && t.at <= target).sort((x, y) => x.at - y.at)[0];
        if (!due) break;
        due.live = false;
        now = due.at;
        due.fn();
        await flush();
      }
      now = target;
      await flush();
    },
  };
  return clock;
}

/** A request that answers `make()` `ms` after it starts, or rejects with AbortError when aborted. */
const after = (clock, ms, make, { ignoreAbort = false } = {}) => (_url, init) => new Promise((resolve, reject) => {
  clock.setTimer(() => { Promise.resolve().then(make).then(resolve, reject); }, ms);
  if (!ignoreAbort && init.signal) init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
});
const resp = (status, body) => () => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const never = () => new Promise(() => {});

/** Start the exchange on `clock` with request stubs in order; report the result and when it came. */
function hedge(clock, stubs, extra = {}) {
  const f = seq(...stubs);
  const run = startAppBinding({ fetchImpl: f, setTimer: clock.setTimer, clearTimer: clock.clearTimer, ...extra });
  const out = { f, run, value: undefined, at: undefined };
  run.result.then((v) => { out.value = v; out.at = clock.now(); });
  return out;
}

test('hedge: a 404 at 3 s from the first request is the store at 3 s (the first is never aborted at 2 s)', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 3000, resp(404)), never]);
  await clock.advanceTo(2999);
  assert.equal(h.value, undefined);
  assert.equal(h.f.calls.length, 2, 'the hedge request started at 2000 ms');
  assert.equal(h.f.calls[0].init.signal.aborted, false, 'the first request was not aborted at 2000 ms');
  await clock.advanceTo(3000);
  assert.deepEqual(h.value, { kind: 'none' });
  assert.equal(h.at, 3000);
  assert.equal(h.f.calls[1].init.signal.aborted, true, 'the loser is aborted on settle');
});

test('hedge: the first hangs forever, the second answers at 2.5 s: that answer at 2.5 s', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [never, after(clock, 500, resp(200, BINDING))]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'binding', binding: BINDING });
  assert.equal(h.at, 2500);
  assert.equal(h.f.calls[0].init.signal.aborted, true);
});

test('hedge: the first 502 at 100 ms starts the second at once; its 200 at 300 ms is the binding at 300 ms', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 100, notJson(502)), after(clock, 200, resp(200, BINDING))]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'binding', binding: BINDING });
  assert.equal(h.at, 300);
  assert.equal(h.f.calls.length, 2);
});

test('hedge: a network error before 2 s also starts the second at once', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 50, () => { throw new TypeError('Failed to fetch'); }), after(clock, 100, resp(404))]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'none' });
  assert.equal(h.at, 150);
});

test('hedge: both 503: the error after the second, retried, two requests', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 100, notJson(503)), after(clock, 100, notJson(503))]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'error', reason: APP_BINDING_ERROR.STATUS, status: 503, retried: true });
  assert.equal(h.at, 200);
  assert.equal(describeAppBindingError(h.value), `${APP_BINDING_PATH} answered HTTP 503, after a second request`);
});

test('hedge: a transient failure does not settle while the other is in flight', async () => {
  const clock = fakeClock();
  // first: 503 at 2500 (after the hedge started at 2000); second: binding at 2000 + 1000 = 3000
  const h = hedge(clock, [after(clock, 2500, notJson(503)), after(clock, 1000, resp(200, BINDING))]);
  await clock.advanceTo(2600);
  assert.equal(h.value, undefined, 'the 503 settled nothing');
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'binding', binding: BINDING });
  assert.equal(h.at, 3000);
});

test('hedge: a definite error from the second after the first failed transiently is final (retried)', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 100, notJson(503)), after(clock, 100, notJson(500))]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'error', reason: APP_BINDING_ERROR.STATUS, status: 500, retried: true });
});

test('hedge: a definite error from the FIRST while the second is in flight is the first\'s answer: retried false', async () => {
  const clock = fakeClock();
  // first: 500 at 2500 (the hedge started at 2000 and hangs)
  const h = hedge(clock, [after(clock, 2500, notJson(500)), never]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'error', reason: APP_BINDING_ERROR.STATUS, status: 500 });
  assert.equal(h.at, 2500);
  assert.equal(h.f.calls.length, 2, 'the second request had started');
  assert.equal(h.f.calls[1].init.signal.aborted, true, 'and is aborted on settle');
  assert.equal(describeAppBindingError(h.value), `${APP_BINDING_PATH} answered HTTP 500`);
});

test('hedge: a transient failure from the first, then the second hangs to the cap: the timeout carries the earlier failure', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 100, notJson(503)), never]);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, {
    kind: 'error', reason: APP_BINDING_ERROR.TIMEOUT, timeoutMs: 10000, retried: true,
    lastFailure: { kind: 'error', reason: APP_BINDING_ERROR.STATUS, status: 503 },
  });
  assert.equal(h.at, 10000);
  assert.equal(describeAppBindingError(h.value), `${APP_BINDING_PATH} did not answer within 10000 ms, after a second request; an earlier request answered HTTP 503`);
  const clock2 = fakeClock();
  const n = hedge(clock2, [after(clock2, 50, () => { throw new TypeError('Failed to fetch'); }), never]);
  await clock2.advanceTo(10000);
  assert.equal(describeAppBindingError(n.value), `${APP_BINDING_PATH} did not answer within 10000 ms, after a second request; an earlier request could not be reached (Failed to fetch)`);
});

test('hedge: a definite answer before 2 s settles at once with one request (400, 500, unparseable, shape)', async () => {
  for (const make of [notJson(400), notJson(500), notJson(200), resp(200, { mode: 'standalone' })]) {
    const clock = fakeClock();
    const h = hedge(clock, [after(clock, 100, make)]);
    await clock.advanceTo(10000);
    assert.equal(h.value.kind, 'error');
    assert.equal(h.value.retried, undefined);
    assert.equal(h.at, 100);
    assert.equal(h.f.calls.length, 1);
  }
});

test('hedge: nothing by 10 s is a timeout error at 10 s, both aborted', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 60000, resp(404))]);
  await clock.advanceTo(9999);
  assert.equal(h.value, undefined);
  await clock.advanceTo(10000);
  assert.deepEqual(h.value, { kind: 'error', reason: APP_BINDING_ERROR.TIMEOUT, timeoutMs: 10000, retried: true });
  assert.equal(h.at, 10000);
  assert.ok(h.f.calls.every((c) => c.init.signal.aborted));
  assert.equal(describeAppBindingError(h.value), `${APP_BINDING_PATH} did not answer within 10000 ms, after a second request`);
});

test('hedge: a late answer from the loser after settle is ignored, and the loser was aborted', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 2500, resp(200, BINDING)), after(clock, 3000, notJson(500), { ignoreAbort: true })]);
  await clock.advanceTo(20000);
  assert.deepEqual(h.value, { kind: 'binding', binding: BINDING });
  assert.equal(h.at, 2500);
  assert.equal(h.f.calls[1].init.signal.aborted, true);
});

test('hedge: no AbortController: still correct, no signal, no unhandled rejection', async () => {
  const unhandled = [];
  const onUnhandled = (e) => unhandled.push(e);
  process.on('unhandledRejection', onUnhandled);
  try {
    const clock = fakeClock();
    const h = hedge(clock, [
      after(clock, 2500, resp(200, BINDING)),
      after(clock, 3000, () => { throw new TypeError('late failure'); }),
    ], { makeController: () => null });
    await clock.advanceTo(20000);
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(h.value, { kind: 'binding', binding: BINDING });
    assert.equal(h.f.calls[0].init.signal, undefined);
    assert.deepEqual(unhandled, []);
    const clock2 = fakeClock();
    const h2 = hedge(clock2, [never], { makeController: () => null });
    await clock2.advanceTo(10000);
    assert.equal(h2.value.reason, APP_BINDING_ERROR.TIMEOUT);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});

test('hedge: never more than two requests, whatever fails when', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 10, notJson(502))]); // every request 502s fast
  await clock.advanceTo(30000);
  assert.equal(h.run.requests(), 2);
  assert.equal(h.f.calls.length, 2);
  const clock2 = fakeClock();
  const h2 = hedge(clock2, [never]);
  await clock2.advanceTo(30000);
  assert.equal(h2.f.calls.length, 2, 'the hedge timer adds one request, never more');
});

test('hedge: cancel() aborts both, resolves cancelled, and later answers are ignored', async () => {
  const clock = fakeClock();
  const h = hedge(clock, [after(clock, 5000, resp(200, BINDING), { ignoreAbort: true })]);
  await clock.advanceTo(2500);
  h.run.cancel();
  await flush();
  assert.deepEqual(h.value, { kind: 'cancelled' });
  assert.ok(h.f.calls.every((c) => c.init.signal.aborted));
  await clock.advanceTo(20000);
  assert.deepEqual(h.value, { kind: 'cancelled' });
});

test('the exchange with the real timers: a fast binding, one request', async () => {
  const f = seq(answer(200, BINDING));
  assert.deepEqual(await resultOf({ fetchImpl: f }), { kind: 'binding', binding: BINDING });
  assert.equal(f.calls.length, 1);
});

test('a detail derived from a response body is cut to 200 characters with an ellipsis', async () => {
  const r = await resultOf({ fetchImpl: answer(200, 'x'.repeat(5000)) });
  assert.equal(r.reason, APP_BINDING_ERROR.SHAPE);
  assert.equal(r.detail.length, APP_BINDING_DETAIL_MAX + 1);
  assert.ok(r.detail.endsWith('…'));
  const u = await resultOf({ fetchImpl: async () => ({ status: 200, ok: true, json: async () => { throw new SyntaxError('y'.repeat(900)); } }) });
  assert.equal(u.detail.length, APP_BINDING_DETAIL_MAX + 1);
});

test('isRetryableBindingError: timeout, network and 502/503/504 only', () => {
  const e = (reason, status) => ({ kind: 'error', reason, status });
  assert.equal(isRetryableBindingError(e('timeout')), true);
  assert.equal(isRetryableBindingError(e('network')), true);
  for (const s of [502, 503, 504]) assert.equal(isRetryableBindingError(e('status', s)), true, String(s));
  for (const s of [400, 401, 403, 500, 501, 505]) assert.equal(isRetryableBindingError(e('status', s)), false, String(s));
  for (const r of ['unparseable', 'shape', 'no-fetch']) assert.equal(isRetryableBindingError(e(r, 200)), false, r);
  assert.equal(isRetryableBindingError({ kind: 'none' }), false);
  assert.equal(isRetryableBindingError({ kind: 'binding', binding: BINDING }), false);
});

// ── the rest of the owner ───────────────────────────────────────────────────────────────────

test('no fetch in this runtime: an error, not none', async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = undefined;
  try {
    assert.deepEqual(await resultOf(), { kind: 'error', reason: APP_BINDING_ERROR.NO_FETCH });
  } finally {
    globalThis.fetch = saved;
  }
});

test('readAppBindingResponse is the one reader: the same answers without the fetch wrapper', async () => {
  assert.deepEqual(await readAppBindingResponse(await answer(404)()), { kind: 'none' });
  assert.deepEqual(await readAppBindingResponse(await answer(200, BINDING)()), { kind: 'binding', binding: BINDING });
  assert.equal((await readAppBindingResponse(await answer(500)())).kind, 'error');
});

test('the result kinds and reasons are the exported tables, and an unknown reason fails loud', () => {
  assert.deepEqual(APP_BINDING_RESULT, { BINDING: 'binding', NONE: 'none', ERROR: 'error' });
  assert.deepEqual(Object.values(APP_BINDING_ERROR).sort(), ['network', 'no-fetch', 'shape', 'status', 'timeout', 'unparseable']);
  for (const reason of Object.values(APP_BINDING_ERROR)) {
    assert.equal(typeof describeAppBindingError({ kind: 'error', reason, status: 500, detail: 'x', timeoutMs: 1 }), 'string');
  }
  assert.throws(() => describeAppBindingError({ kind: 'error', reason: 'mystery' }), /unknown error reason "mystery"/);
});
