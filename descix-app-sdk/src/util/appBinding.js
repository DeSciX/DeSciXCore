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
