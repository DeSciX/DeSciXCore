/**
 * powchUrl — the ONE owner of "where is Powch".
 *
 * ── Powch is cross-origin ON PURPOSE ─────────────────────────────────────────
 * The platform runs a deliberately ASYMMETRIC origin model:
 *
 *   shell  <->  app     SAME origin  — direct interframe scripting is the point
 *                                      (SplitView reaches iframe.contentWindow)
 *   shell  <->  Powch   CROSS origin — postMessage bridge ONLY
 *
 * Powch holds passkeys, the HD wallet and the ZK-SSO silo. If Powch were
 * same-origin with the shell, every app the shell hosts could read Powch's DOM
 * and memory through exactly the same-origin reach SplitView depends on. So the
 * boundary is not an oversight to tidy up — it is the security design, and this
 * module exists so no caller can erode it by accident.
 *
 * Concretely: this NEVER returns the gateway's /p/powch route. The gateway does
 * expose a /powch proxy prefix, but the sidebar deliberately does not use it.
 * Powch is reached at its own origin.
 *
 * Previously two modules answered this question differently — the gateway read
 * env.powchUrl then auto-discovered from products, while the shell's Vite config
 * required VITE_POWCH_APP_URL or a powch entry in the product MAP and never read
 * env.powchUrl at all. Two owners for one value is how the workspace key became
 * invisible to the shell (redteam G-10).
 *
 * This module answers the BUILD/DEV-time question ("what does this workspace
 * say?"). The RUNTIME question ("what origin do I mount right now, or fail")
 * belongs to ../powch/powchOrigin.js, whose app id and normalisation this
 * consumes so the two can never disagree.
 */

import { POWCH_APP_ID, normalizePowchUrl } from '../powch/powchOrigin.js';

export { POWCH_APP_ID };

/**
 * Resolve Powch's origin from workspace config.
 *
 * Precedence: explicit env.powchUrl > the powch product's OWN origin > null.
 *
 * @param {Object} config - parsed workspace.json
 * @param {Object} [options]
 * @param {string} [options.override] - an explicit URL (e.g. VITE_POWCH_APP_URL) that wins outright
 * @returns {string|null} Powch's origin with a trailing slash, or null if unknown
 */
export function resolvePowchUrl(config, options = {}) {
  if (options.override) return normalizePowchUrl(options.override);

  const env = config?.env || {};
  if (env.powchUrl) return normalizePowchUrl(env.powchUrl);

  const powch = (Array.isArray(env.products) ? env.products : []).find((p) => p.appId === POWCH_APP_ID);
  if (powch?.site?.port) {
    // The product's OWN origin — deliberately not the gateway route.
    const proto = powch.site.protocol || 'https';
    return `${proto}://localhost:${powch.site.port}/`;
  }
  return null;
}
