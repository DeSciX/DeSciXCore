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
 * Kept free of node imports on purpose: the gateway (node) and the shell
 * (browser) must agree on ONE spelling of the path, so both import it here.
 */

/** The path the gateway answers and the shell asks. */
export const APP_BINDING_PATH = '/__descix/app-binding.json';

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
 * @returns {Promise<{mode: string, appId: string, appUrl: string|null}|null>}
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
    if (!binding || binding.mode !== 'standalone' || !binding.appId) return null;
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
