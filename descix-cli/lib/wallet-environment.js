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
 * The environment NAME is derived from WorkspaceConfig.ENV_MAP — the same canonical map
 * `descix --env` resolves against — so this file holds no second copy of the origin table.
 */
import { WorkspaceConfig } from './workspace-config.js';

/** Compare origins without tripping on a trailing slash or case in the host. */
function normalizeOrigin(origin) {
    return String(origin).trim().replace(/\/+$/, '');
}

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

    const normalized = normalizeOrigin(apiUrl);
    const match = Object.entries(WorkspaceConfig.ENV_MAP)
        .find(([, entry]) => entry && normalizeOrigin(entry.url) === normalized);

    // 'custom' is an HONEST answer — "a real origin, not one of the three named ones" — and is
    // not a fallback value standing in for a missing fact. The fact is the apiUrl beside it.
    return { apiUrl: normalized, environment: match ? match[0] : 'custom' };
}
