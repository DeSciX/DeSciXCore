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
 * The precondition getProductUrl carries, enforced HERE so no caller has to re-derive it.
 *
 * Measured on production 2026-09-15: the egpt community record has icon_url "" and
 * ip_site_gcs_path_url null, so the community lobby's fallback chain fell through to
 * getProductUrl(AppData.myApps[0]) on an EMPTY apps array. A brand-new user owns zero apps by
 * construction, so `undefined.ip_site_gcs_path_url` threw on the new-user path BY DESIGN and the
 * CEO hit an error boundary the first time he installed a community. Five call sites re-derived
 * this guard by hand; four were right and the fifth was the bug. That is mirror drift, so the
 * owner now states the rule and the consumers ferry it.
 *
 * This is deliberately NOT a fallback: there is no "default product" and no invented URL. A
 * missing product is a CALLER defect, and it fails loud naming the function, the contract and
 * the predicate to call instead — the opposite of returning a quiet empty string that renders a
 * blank frame nobody can diagnose.
 *
 * @param {object} product - the product record; null/undefined is the error this exists to name.
 * @param {string} callerName - the calling symbol, so the message names the real site.
 * @returns {object} the product, so callers can assert-and-use in one expression.
 * @throws {TypeError} when there is no product.
 */
export function assertProductPresent(product, callerName) {
    if (product === null || product === undefined) {
        throw new TypeError(
            `${callerName}: no product record (got ${product === null ? 'null' : 'undefined'}). ` +
            `A code-site URL cannot be resolved without one, and there is no default to fall back to. ` +
            `Call AppData.hasProductSite(product) first and render an explicit empty state when it is ` +
            `false — do not call this with a product you do not have.`
        );
    }
    return product;
}

/**
 * Does this product record carry a usable stored site path?
 *
 * THE published predicate. It is total over a missing product — answering "no, there is no site"
 * is this function's whole job, which is why returning false here is an answer rather than a
 * silence. Consumers ask this instead of hand-writing `x && getProductUrl(x) && ...trim() !== ''`,
 * which is the shape that drifted.
 *
 * Note this reads the STORED value only. The dev workspaceProducts indirection can supply a URL
 * for a product whose record has no path, so AppData.hasProductSite consults that map first — the
 * dev map winning is the point of it, and `descix serve` routes through it.
 *
 * @param {object|null|undefined} product
 * @returns {boolean}
 */
export function hasStoredSitePath(product) {
    if (product === null || product === undefined) return false;
    const stored = product.ip_site_gcs_path_url;
    return typeof stored === 'string' && stored.trim() !== '';
}

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
