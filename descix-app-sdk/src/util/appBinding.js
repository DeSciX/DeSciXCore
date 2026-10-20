/**
 * appBinding — the shell's side of the served app-binding contract (AMB-1c).
 *
 * The shell asks its OWN origin what it is supposed to be. That single fact is
 * what lets ONE bundle boot three ways with no rebuild:
 *
 *   descix.net            → no binding served      → the store
 *   localhost:<gateway>   → {standalone, appId}    → your app, no store chrome
 *   your-app.example.com  → {standalone, appId}    → the same app, deployed
 *
 * Kept free of node imports on purpose: the gateway (node), the edge worker and
 * the shell (browser) must agree on ONE spelling of the path and ONE shape of
 * the binding, so all three import them here.
 */

import { VIEW_MODES } from './appView.js';

/** The path the gateway answers and the shell asks. */
export const APP_BINDING_PATH = '/__descix/app-binding.json';

/** The one `mode` a binding carries; anything else is "no binding" (the store). */
export const STANDALONE_MODE = 'standalone';

/**
 * The binding's shape. Producers: `descix serve` (dev/serveBinding.js) and the edge worker's
 * synthesized binding; both build it with standaloneBinding(). Reader: fetchAppBinding() and
 * SdkInitializer.
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
 * Ask this origin what app it is bound to.
 *
 * Returns null for "no binding" — which is the STORE, and is a completely
 * normal answer (descix.net serves no binding). A network failure also returns
 * null: booting the store is the safe degradation, and a shell that refused to
 * boot because one optional probe timed out would be worse than the problem.
 *
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=2000] - cap on the probe
 * @param {typeof fetch} [options.fetchImpl] - injectable for tests
 * @returns {Promise<{mode: string, appId: string, appUrl: string|null, source?: string,
 *   defaultView?: string}|null>} as served; its defaultView is validated where the shell seeds
 *   its first view (appView.js initialViewFor), which fails loud into the shell's ERROR state
 */
export async function fetchAppBinding(options = {}) {
  const { timeoutMs = 2000, fetchImpl } = options;
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) return null;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await doFetch(APP_BINDING_PATH, {
      signal: controller ? controller.signal : undefined,
      headers: { Accept: 'application/json' },
    });
    if (!res || !res.ok) return null;
    const binding = await res.json();
    // Only a well-formed standalone binding changes how the shell boots. A
    // malformed one is treated as absent rather than half-applied.
    if (!binding || binding.mode !== STANDALONE_MODE || !binding.appId) return null;
    return binding;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
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
