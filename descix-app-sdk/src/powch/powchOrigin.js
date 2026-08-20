/**
 * powchOrigin — the ONE owner of "where is Powch" for RUNTIME (browser) code.
 *
 * ── Why there is deliberately no default ─────────────────────────────────────
 * This value decides where a user types a passkey and where an HD wallet is
 * unlocked. A hardcoded production origin reached from a dev or DEMO build is a
 * silent cross-environment leak on the single most sensitive origin the platform
 * has — the developer never chose it, and nothing on screen says it happened.
 * So an unknown origin FAILS, loudly, naming every legitimate way to set it.
 * Absent is better than plausible-and-wrong.
 *
 * ── Two questions, two functions, one owner each ─────────────────────────────
 *   BUILD / DEV time: `resolvePowchUrl(workspaceConfig)` in ../dev/powchUrl.js
 *     answers "what does this workspace say?" and returns null when it says
 *     nothing. It is the ONE owner of workspace resolution and consumes the
 *     normalisation + app id below.
 *   RUNTIME (browser): `requirePowchUrl(explicit, caller)` here answers "what
 *     origin do I mount RIGHT NOW?" — the caller's explicit config, else the
 *     value the build injected, else a throw. There is no third answer.
 *
 * Nothing here imports node built-ins; it is safe in a browser bundle.
 */

/** The one app id that is an identity silo rather than a hosted app. */
export const POWCH_APP_ID = 'powch';

/** Powch's origin with exactly one trailing slash, so callers never double it. */
export function normalizePowchUrl(url) {
  return url.endsWith('/') ? url : url + '/';
}

/**
 * The origin the BUILD injected, or null.
 *
 * `__POWCH_APP_URL__` is a Vite `define` written by the two builds that know:
 * the dev gateway (src/dev/gateway.js) and the shell's own vite.config. Both
 * fill it from resolvePowchUrl, so there is one source and it can legitimately
 * be `null` (define writes the literal `null` when the workspace is silent).
 */
export function powchUrlFromBuild() {
  // eslint-disable-next-line no-undef
  if (typeof __POWCH_APP_URL__ === 'undefined') return null;
  // eslint-disable-next-line no-undef
  return __POWCH_APP_URL__ ? normalizePowchUrl(__POWCH_APP_URL__) : null;
}

/**
 * Powch's origin, or a loud failure. Never a guess.
 *
 * @param {string|null|undefined} explicit - a URL the caller was configured with
 * @param {string} caller - the module name, so the error says where it fired
 * @returns {string} origin with a trailing slash
 * @throws {Error} when the origin is unknown
 */
export function requirePowchUrl(explicit, caller) {
  const url = explicit ? normalizePowchUrl(explicit) : powchUrlFromBuild();
  if (url) return url;
  throw new Error(powchUrlUnknownMessage(caller));
}

/** The one wording for "we do not know where Powch is". */
export function powchUrlUnknownMessage(caller) {
  return (
    `[${caller}] Powch's origin is unknown, so the wallet cannot be reached.\n` +
    '  Set it one of these ways:\n' +
    '    - pass config.powch.bridgeUrl to AppShell (or bridgeUrl to the Powch\n' +
    '      client you construct yourself), or\n' +
    '    - set env.powchUrl in .descix/workspace.json — `descix serve` and the\n' +
    '      shell build both inject __POWCH_APP_URL__ from it, or\n' +
    '    - run Powch as a workspace product (env.products[] entry with\n' +
    `      appId "${POWCH_APP_ID}" and a site.port), or\n` +
    '    - set VITE_POWCH_APP_URL for the shell build.\n' +
    '  There is deliberately no default: Powch holds passkeys and the HD wallet,\n' +
    '  so a plausible-but-wrong origin would send them to an environment nobody\n' +
    '  chose. See src/powch/powchOrigin.js.'
  );
}
