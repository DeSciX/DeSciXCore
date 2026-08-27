/**
 * productUrl — THE owner of "where does a product's code site load from".
 *
 * GAP-4, measured 2026-08-27: the app record stores `ip_site_gcs_path_url` pinned to an
 * absolute host (dev.descix.net) while its sibling `api_base_url` holds the app's own
 * subdomain, so the record disagrees with itself about which host the app lives on. Treating
 * the stored value as a LOAD PATH made that disagreement load-bearing: opened at
 * https://egpt-godsworld.dev.descix.net the shell framed a dev.descix.net code site, the frame
 * became CROSS-ORIGIN, same-domain interframe scripting was impossible, and the bridge reported
 * the scripting window CLOSED. Launched from the store it happened to work, because there the
 * pinned host and the current origin coincided — which is exactly why the bug presented as
 * "works from the store, not from the subdomain".
 *
 * Only the PATH of the stored value is meaningful. The origin always comes from wherever the
 * shell is actually running, so a code site is same-origin with its shell BY CONSTRUCTION
 * rather than by the record happening to agree. The CEO's ruling requires same-domain
 * interframe scripting within the app shell — not a cross-origin postMessage bridge — and this
 * is what makes that structurally true instead of incidentally true.
 *
 * This lives in its own module, not inside AppData.jsx, so the rule has one owner and can be
 * driven by a test with no DOM and no JSX loader.
 */

/**
 * Take the PATH of a stored product URL and resolve it against the current origin.
 *
 * @param {string} stored - the record's stored URL (absolute, or already relative).
 * @param {string} [origin] - defaults to the ambient `window.location.origin`.
 * @returns {string} an absolute URL on `origin`; the input unchanged when there is nothing to
 *                   resolve or nothing to resolve against — never an invented host.
 */
export function resolveAgainstCurrentOrigin(stored, origin) {
    if (!stored) return stored;
    const base =
        origin ||
        (typeof window !== 'undefined' && window.location ? window.location.origin : null);
    // No DOM and no explicit origin: nothing to resolve against. Return the input rather than
    // inventing a host — a wrong host is the defect this module exists to remove.
    if (!base) return stored;
    try {
        // `new URL(stored, base)` keeps the path and REPLACES the origin when `stored` is
        // absolute, and resolves normally when it is relative. One expression, both cases.
        const u = new URL(stored, base);
        return new URL(u.pathname + u.search + u.hash, base).toString();
    } catch (e) {
        // Not a parseable URL. Return it visibly rather than guessing a host.
        return stored;
    }
}
