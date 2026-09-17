/**
 * entitlement.js — THE ONE derivation of "does the caller own this app".
 *
 * Deliberately a plain .js file with no React/JSX/AppData import: it is the
 * decision, unit-tested with `node --test tests/entitlement.test.js` from
 * descix-app-sdk/ (AppData.jsx cannot be imported under plain `node --test` —
 * Node's ESM loader does not resolve the .jsx extension — so a predicate that
 * needs testing without a JSX transform has to live outside it).
 *
 * ChatWidget's legacy `entitled` fallback (`entitled === undefined`) and any
 * caller that needs to compute entitlement ahead of render both call this —
 * never re-inline the membership check, or the two copies can silently
 * disagree about what "owned" means. AppData.jsx re-exports this so existing
 * `import { isAppEntitled } from '../util/AppData'` call sites keep working.
 */

/**
 * @param {{app_id?: string, community_id?: string}|null|undefined} app
 * @param {Array<{app_id?: string, community_id?: string}>|null|undefined} myApps
 * @returns {boolean}
 */
export function isAppEntitled(app, myApps) {
  if (!app?.app_id) return false;
  return Array.isArray(myApps) && myApps.some(
    (a) => a?.app_id === app.app_id && a?.community_id === app.community_id
  );
}
