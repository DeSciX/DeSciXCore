/**
 * THE ONE OWNER OF "which environment was this credential obtained against".
 *
 * WHY (measured 2026-08-29): wallet.json carries no environment field at all, so a DEV
 * credential is byte-indistinguishable from a PROD one. Nothing downstream can tell a developer
 * that the session in their workspace was minted somewhere other than where they are pointing.
 *
 * SCOPE — WRITE ONLY, DELIBERATELY. This module RECORDS the origin a wallet was obtained
 * against. It does NOT refuse a mismatched wallet, and nothing here should grow into a check.
 * Enforcement needs a migration story for every wallet already on disk WITHOUT this field
 * (they are all of them, today), and shipping half an enforcement inside a publish is how a
 * guard that fires on correct code gets born. Enforcement is a separate row.
 *
 * The environment NAME comes from `environment-report.js::environmentNameFor` — the one owner
 * of that derivation, shared with the printed env line — so this file holds no second copy of
 * either the origin table or the matching rule.
 */
// The origin -> env-name derivation used to live in this file. It now has ONE owner, consumed
// here and by the printed env line, because two derivations of one fact is the mirror drift
// this contract exists to end.
import { environmentNameFor } from './environment-report.js';
import { normalizeOrigin } from './origin.js';

/**
 * The environment stamp to persist alongside a freshly obtained credential.
 *
 * @param {string} apiUrl - the origin the credential was actually obtained against
 *                          (i.e. `apiClient.baseUrl` at the moment of the exchange)
 * @returns {{ apiUrl: string, environment: string }} `environment` is the ENV_MAP name whose
 *          url matches (`dev` | `demo` | `prod`), or `'custom'` when the origin is a real one
 *          that simply is not in the map — a self-hosted or port-forwarded gateway.
 *
 * @throws when called with no origin. There is no default: guessing which environment a
 *         credential came from is exactly the misreport this contract exists to end, and every
 *         caller has the origin in hand.
 */
export function walletEnvironmentStamp(apiUrl) {
    if (!apiUrl || String(apiUrl).trim() === '') {
        throw new Error(
            'walletEnvironmentStamp: refusing to stamp a credential with no origin — ' +
            'the environment a wallet was obtained against cannot be guessed.',
        );
    }

    return {
        apiUrl: normalizeOrigin(apiUrl),
        environment: environmentNameFor(apiUrl),
    };
}
