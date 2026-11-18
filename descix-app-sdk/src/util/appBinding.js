/**
 * appBinding — the shell's side of the served app-binding contract (AMB-1c).
 *
 * The shell asks its OWN origin what it is supposed to be. That single fact is
 * what lets ONE bundle boot three ways with no rebuild:
 *
 *   descix.net            → 404, no binding         → the store
 *   localhost:<gateway>   → {standalone, appId}    → your app, no store chrome
 *   your-app.example.com  → {standalone, appId}    → the same app, deployed
 *   any other answer      → an error the shell shows, never the store
 *
 * Kept free of node imports on purpose: the gateway (node), the edge worker and
 * the shell (browser) must agree on ONE spelling of the path and ONE shape of
 * the binding, so all three import them here.
 */

import { VIEW_MODES } from './appView.js';

/** The path the gateway answers and the shell asks. */
export const APP_BINDING_PATH = '/__descix/app-binding.json';

/** The one `mode` a binding carries. */
export const STANDALONE_MODE = 'standalone';

/**
 * The binding's shape. Producers: `descix serve` (dev/serveBinding.js) and the edge worker's
 * synthesized binding; both build it with standaloneBinding(). Reader: readAppBindingResponse(),
 * through startAppBinding(), for SdkInitializer.
 *   mode        — always STANDALONE_MODE
 *   appId       — the bound app
 *   appUrl      — the app frame's URL, same-origin with the shell
 *   source      — who chose the app: 'edge', '--app' or 'cwd'
 *   defaultView — optional, one of VIEW_MODES: the view the shell paints first. Copied from the
 *                 app site's share.json `default_view` (util/share.js); omitted when the site
 *                 declares none (the shell then starts in DEFAULT_VIEW, util/appView.js).
 */
export const APP_BINDING_CONTRACT = Object.freeze([
  { name: 'mode', required: true },
  { name: 'appId', required: true },
  { name: 'appUrl', required: true },
  { name: 'source', required: true },
  { name: 'defaultView', required: false },
].map(Object.freeze));

const VIEWS = Object.values(VIEW_MODES);

/**
 * Build a standalone binding. The one constructor every producer calls.
 *
 * @param {{appId: string, appUrl: string, source: string, defaultView?: string|null}} fields
 * @returns {{mode: string, appId: string, appUrl: string, source: string, defaultView?: string}}
 *   defaultView is present only when given
 * @throws {Error} naming the field: a required field missing, or a defaultView outside VIEW_MODES
 */
export function standaloneBinding({ appId, appUrl, source, defaultView = null } = {}) {
  const binding = { mode: STANDALONE_MODE, appId, appUrl, source };
  for (const f of APP_BINDING_CONTRACT) {
    if (f.required && !binding[f.name]) throw new Error(`[app binding] ${f.name} is required; got ${JSON.stringify(binding[f.name])}`);
  }
  if (defaultView !== null && defaultView !== undefined) {
    if (!VIEWS.includes(defaultView)) {
      throw new Error(`[app binding] defaultView '${defaultView}' is not a view; one of ${VIEWS.join(', ')}`);
    }
    binding.defaultView = defaultView;
  }
  return binding;
}

/**
 * THE ONE "NO BINDING HERE" ANSWER: HTTP 404 at APP_BINDING_PATH.
 *
 * Measured against the servers of that path as they are today:
 *   - an app host ({appId}.{env}.descix.net, a custom domain): the edge worker synthesizes a 200
 *     binding (infra/edge-router/src/edge-router.js, the `standalone && url.pathname ===
 *     APP_BINDING_PATH` branch);
 *   - the store host (descix.net, dev.descix.net): no branch serves the path, so it falls to the
 *     static channel and GCS answers 404 for an object that does not exist (the SPA fallback skips
 *     it: the shell's Accept is application/json and the last segment has an extension);
 *   - `descix serve` (dev/serveBinding.js appBindingPlugin): always a 200 binding, or 400 for a
 *     malformed request authority — never "no binding", because the session's app is resolved at
 *     startup and fails loud there;
 *   - a bare Vite dev server for the shell: 404 (its HTML fallback ignores an Accept without
 *     text/html).
 * No server answers a 200 that means "no binding", so a 2xx that is not a binding is an error.
 */
export const APP_BINDING_NONE_STATUS = 404;

/**
 * When the second (hedge) request starts if the first has not answered. The first is NOT aborted:
 * both run, and the first definite answer wins, so a slow-but-healthy host is never slowed down.
 */
export const APP_BINDING_TIMEOUT_MS = 2000;

/**
 * The cap on the whole exchange. 10000 ms: on an app host the edge fetches share.json before it
 * answers, which on a slow link or a cold cache can take seconds; ten seconds of loading screen is
 * about where a visitor gives up, and far below any proxy's own timeout.
 */
export const APP_BINDING_TOTAL_TIMEOUT_MS = 10000;

/** HTTP statuses that mean "the server in front is briefly unavailable": not a definite answer. */
export const APP_BINDING_RETRY_STATUSES = Object.freeze([502, 503, 504]);

/** A detail derived from a response is cut to this many characters. */
export const APP_BINDING_DETAIL_MAX = 200;

function clip(text) {
  const t = String(text);
  return t.length > APP_BINDING_DETAIL_MAX ? `${t.slice(0, APP_BINDING_DETAIL_MAX)}…` : t;
}

/** The three answers the binding exchange (startAppBinding) gives, besides `cancelled`. */
export const APP_BINDING_RESULT = Object.freeze({ BINDING: 'binding', NONE: 'none', ERROR: 'error' });

/** Why a binding answer is an error. */
export const APP_BINDING_ERROR = Object.freeze({
  STATUS: 'status',           // an HTTP status other than 2xx and APP_BINDING_NONE_STATUS
  UNPARSEABLE: 'unparseable', // a 2xx whose body is not JSON
  SHAPE: 'shape',             // a 2xx JSON body that is not a standalone binding (APP_BINDING_CONTRACT)
  NETWORK: 'network',         // the request failed before any answer
  TIMEOUT: 'timeout',         // no answer within the timeout
  NO_FETCH: 'no-fetch',       // this runtime has no fetch
});

/**
 * What one HTTP answer at APP_BINDING_PATH means.
 *
 * @param {{status: number, ok: boolean, json: () => Promise<any>}} res
 * @returns {Promise<{kind: 'binding', binding: Object} | {kind: 'none'} |
 *   {kind: 'error', reason: string, status: number, detail?: string}>}
 * @throws the body read's AbortError, so the caller can name a timeout
 */
export async function readAppBindingResponse(res) {
  if (res.status === APP_BINDING_NONE_STATUS) return { kind: APP_BINDING_RESULT.NONE };
  if (!res.ok) return { kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.STATUS, status: res.status };
  let body;
  try {
    body = await res.json();
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    return { kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.UNPARSEABLE, status: res.status, detail: clip(e && e.message) };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.SHAPE, status: res.status, detail: clip(`body is ${JSON.stringify(body)}`) };
  }
  if (body.mode !== STANDALONE_MODE) {
    return { kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.SHAPE, status: res.status, detail: clip(`mode is ${JSON.stringify(body.mode)}, not '${STANDALONE_MODE}'`) };
  }
  const missing = APP_BINDING_CONTRACT.filter((f) => f.required && !body[f.name]).map((f) => f.name);
  if (missing.length) {
    return { kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.SHAPE, status: res.status, detail: `missing ${missing.join(', ')}` };
  }
  return { kind: APP_BINDING_RESULT.BINDING, binding: body };
}

/**
 * Is this error transient — not a definite answer? A timeout, a network failure, or a
 * 502/503/504. A definite answer (another 4xx/5xx, an unparseable or wrong-shaped body) is not.
 *
 * @param {{kind: string, reason?: string, status?: number}} result
 * @returns {boolean}
 */
export function isRetryableBindingError(result) {
  if (result.kind !== APP_BINDING_RESULT.ERROR) return false;
  if (result.reason === APP_BINDING_ERROR.TIMEOUT || result.reason === APP_BINDING_ERROR.NETWORK) return true;
  return result.reason === APP_BINDING_ERROR.STATUS && APP_BINDING_RETRY_STATUSES.includes(result.status);
}

/**
 * Ask this origin what app it is bound to, HEDGED: at most two requests, first definite answer
 * wins. The state machine:
 *   - request 1 starts at once;
 *   - request 2 starts at `hedgeAfterMs` if nothing has settled, or AT ONCE if request 1 has
 *     already failed transiently (network, 502/503/504) — request 1 is never aborted for it;
 *   - the first DEFINITE answer from either settles: a binding, a 404 (`none`), or a
 *     non-transient error (another status, an unparseable or wrong-shaped body);
 *   - a transient failure settles nothing while the other request is still in flight; when both
 *     have failed transiently, the result is the last failure, `retried: true`;
 *   - at `totalTimeoutMs` with nothing settled, the result is `timeout` (`retried` when request 2
 *     had started), carrying `lastFailure` when a request had already failed transiently;
 *   - on settle, on the cap and on cancel(), every request still in flight is aborted (where
 *     AbortController exists) and anything it answers later is ignored.
 * `retried: true` marks an error that the second request's outcome is part of: request 2's own
 * definite error, both requests' transient failures, or the cap reached with request 2 running.
 * A definite error from request 1 is reported as request 1's (`retried` absent), even while
 * request 2 is in flight.
 *
 * @param {Object} [options]
 * @param {typeof fetch} [options.fetchImpl] - default: global fetch
 * @param {number} [options.hedgeAfterMs=APP_BINDING_TIMEOUT_MS]
 * @param {number} [options.totalTimeoutMs=APP_BINDING_TOTAL_TIMEOUT_MS]
 * @param {(fn: () => void, ms: number) => any} [options.setTimer] - default: setTimeout
 * @param {(handle: any) => void} [options.clearTimer] - default: clearTimeout
 * @param {() => ({abort: () => void, signal: any}|null)} [options.makeController] - default:
 *   `new AbortController()` where it exists, else null (requests then run without a signal)
 * @returns {{ result: Promise<{kind: 'binding', binding: Object} | {kind: 'none'} |
 *   {kind: 'error', reason: string, status?: number, detail?: string, timeoutMs?: number,
 *   retried?: boolean, lastFailure?: Object} | {kind: 'cancelled'}>, cancel: () => void,
 *   requests: () => number }}
 *   `cancelled` only after cancel(); requests() counts the requests started
 */
export function startAppBinding(options = {}) {
  const {
    fetchImpl,
    hedgeAfterMs = APP_BINDING_TIMEOUT_MS,
    totalTimeoutMs = APP_BINDING_TOTAL_TIMEOUT_MS,
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (h) => clearTimeout(h),
    makeController = () => (typeof AbortController === 'function' ? new AbortController() : null),
  } = options;
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) {
    return { result: Promise.resolve({ kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.NO_FETCH }), cancel: () => {}, requests: () => 0 };
  }

  let settle;
  const result = new Promise((resolve) => { settle = resolve; });
  let done = false;
  let lastFailure = null;
  const inFlight = new Set(); // controllers (or placeholder objects) of running requests
  let started = 0;
  const timers = [];

  function finish(outcome) {
    if (done) return;
    done = true;
    for (const t of timers) clearTimer(t);
    for (const c of inFlight) if (c.abort) c.abort();
    inFlight.clear();
    settle(outcome);
  }

  function start() {
    if (done || started >= 2) return;
    started += 1;
    const nth = started;
    const controller = makeController() || {};
    inFlight.add(controller);
    const run = (async () => {
      const res = await doFetch(APP_BINDING_PATH, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      return readAppBindingResponse(res);
    })();
    run.then(
      (outcome) => land(controller, nth, outcome),
      (e) => land(controller, nth, { kind: APP_BINDING_RESULT.ERROR, reason: APP_BINDING_ERROR.NETWORK, detail: clip(e && e.message) }),
    );
  }

  function land(controller, nth, outcome) {
    if (done || !inFlight.has(controller)) return; // a late answer after settle: ignored
    inFlight.delete(controller);
    if (!isRetryableBindingError(outcome)) {
      // A definite error is "retried" only when it is the second request's own answer.
      finish(outcome.kind === APP_BINDING_RESULT.ERROR && nth === 2 ? { ...outcome, retried: true } : outcome);
      return;
    }
    lastFailure = outcome;
    if (started < 2) { start(); return; }       // a fast transient failure: hedge now
    if (inFlight.size === 0) finish({ ...lastFailure, retried: true }); // both failed transiently
  }

  timers.push(setTimer(start, hedgeAfterMs));
  timers.push(setTimer(() => finish({
    kind: APP_BINDING_RESULT.ERROR,
    reason: APP_BINDING_ERROR.TIMEOUT,
    timeoutMs: totalTimeoutMs,
    ...(started > 1 ? { retried: true } : {}),
    ...(lastFailure ? { lastFailure } : {}),
  }), totalTimeoutMs));
  start();

  return {
    result,
    cancel: () => finish({ kind: 'cancelled' }),
    requests: () => started,
  };
}

/**
 * The one sentence for a binding error: the console line and the shell's error state both say it.
 * A timeout that followed an earlier transient failure names that failure too.
 *
 * @param {{kind: 'error', reason: string, status?: number, detail?: string, timeoutMs?: number,
 *   retried?: boolean, lastFailure?: Object}} result
 * @returns {string}
 */
export function describeAppBindingError(result) {
  let sentence = `${APP_BINDING_PATH} ${whatHappened(result)}`;
  if (result.retried) sentence += ', after a second request';
  if (result.lastFailure) sentence += `; an earlier request ${whatHappened(result.lastFailure)}`;
  return sentence;
}

/** What one attempt did, as the predicate of a sentence whose subject is the path or a request. */
function whatHappened(result) {
  switch (result.reason) {
    case APP_BINDING_ERROR.STATUS:
      return `answered HTTP ${result.status}`;
    case APP_BINDING_ERROR.UNPARSEABLE:
      return `answered HTTP ${result.status} with a body that is not JSON`;
    case APP_BINDING_ERROR.SHAPE:
      return `answered HTTP ${result.status} with a body that is not an app binding (${result.detail})`;
    case APP_BINDING_ERROR.NETWORK:
      return `could not be reached (${result.detail})`;
    case APP_BINDING_ERROR.TIMEOUT:
      return `did not answer within ${result.timeoutMs} ms`;
    case APP_BINDING_ERROR.NO_FETCH:
      return 'could not be requested: this browser has no fetch';
    default:
      throw new Error(`[app binding] unknown error reason ${JSON.stringify(result.reason)}`);
  }
}

/**
 * The app frame's URL for a shell opened at an app's own direct link ({appId}.{env}.descix.net, or
 * the local gateway serving that binding). The top-level query and hash pass through to the app,
 * so an inbound link such as `https://egpt-frqtl.descix.net/?notebook=qft#cell-3` reaches the app
 * as `<appUrl>?notebook=qft#cell-3`. A top-level parameter overrides the same parameter on appUrl;
 * a top-level hash replaces appUrl's. The store (no binding) never calls this.
 *
 * @param {string} appUrl - the binding's appUrl (absolute or origin-relative)
 * @param {{search?: string, hash?: string}} topLocation - the shell's window.location
 * @returns {string}
 */
export function appFrameUrl(appUrl, topLocation) {
  if (!appUrl) return appUrl;
  const search = topLocation?.search || '';
  const hash = topLocation?.hash || '';
  if (search.length <= 1 && hash.length <= 1) return appUrl;

  const PLACEHOLDER = 'https://app-frame.invalid';
  const absolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(appUrl);
  const url = new URL(appUrl, PLACEHOLDER);
  for (const [key, value] of new URLSearchParams(search)) url.searchParams.set(key, value);
  if (hash.length > 1) url.hash = hash;
  return absolute ? url.href : url.href.slice(PLACEHOLDER.length);
}
