/**
 * THE ONE OWNER OF "which DeSciX origin does this invocation talk to, and who chose it".
 *
 * WHY (measured 2026-08-29, published @descix/cli 1.0.1): `getApiUrl()` on an unconfigured
 * workspace returned the production origin and said NOTHING. A developer who had configured
 * nothing and a developer who had deliberately chosen production produced byte-identical
 * results, and the CLI then reported that origin back in agent-instruction files, in
 * `config show`, and in the wallet it minted.
 *
 * THE RULE THIS ENFORCES (contract I1 as amended by (A'), rev 2, 2026-08-30):
 *   · An unconfigured workspace resolves to the DECLARED DEFAULT, production. That is the
 *     shipped product's target and CEO-D-2026-08-18 stands. The PROD target was never the
 *     defect.
 *   · SILENCE was the defect. Every resolution carries its SOURCE, and every network-bound
 *     command PRINTS it — always, not only on the default. "Chose prod" and "chose nothing"
 *     are distinguished by `source`, never by a null nobody sees.
 *   · A CONFIGURED-but-invalid origin still FAILS LOUD, naming the fix. Landing on the default
 *     is a product decision; silently discarding something the developer actually typed is not.
 *
 * NO SECOND SPELLING OF THE DEFAULT. The origin table has ONE owner, `@descix/app-sdk/dev`,
 * and this module IMPORTS the production origin from it rather than writing the literal down.
 * That is deliberate and it is load-bearing for acceptance A1: `grep` of the packed tarball for
 * the production literal outside the one owner returns 0 because there is no second copy to
 * find -- not even here.
 *
 * This file imports nothing from the CLI, so it can be consumed by `workspace-config.js`
 * without a cycle.
 */
import { DEFAULT_API_URL } from '@descix/app-sdk/dev';

/**
 * The single spelling of "are these two origins the same origin" — trailing slashes and
 * surrounding whitespace do not make an origin different.
 *
 * Exported because other modules compare origins against ENV_MAP and MUST use the same
 * comparison this module resolves with; a second private copy is how the two drift.
 *
 * @param {string} origin
 * @returns {string}
 */
export function normalizeOrigin(origin) {
    return String(origin).trim().replace(/\/+$/, '');
}

/**
 * Thrown when a source NAMED an origin and that origin is not usable. Carries a `code` so
 * callers can recognise it without matching on message text.
 *
 * This is the loud failure I1 requires. It replaced `OriginUnresolvedError`, which fired when
 * NOTHING was configured — a case that is no longer a failure at all under (A'), because the
 * declared default answers it. The old error was DELETED rather than fenced: an unreachable
 * error path kept "just in case" is the compat fence CEO-D-2026-07-26 forbids.
 */
export class OriginInvalidError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OriginInvalidError';
        this.code = 'ORIGIN_INVALID';
    }
}

/**
 * The resolution order, most explicit first. Each entry is [human-readable source, key].
 * The ORDER is the contract; the array is the only place it is written down.
 */
const PRECEDENCE = [
    ['DESCIX_API_URL (or --api-url / --env)', 'envVar'],
    ['.descix/workspace.json env.apiUrl', 'workspaceEnvApiUrl'],
    ['.descix/workspace.json apiUrl (legacy)', 'legacyApiUrl'],
    ['~/.descix/config.json api_url', 'globalApiUrl'],
];

/** The remedy text every failure prints. One spelling, so every surface says the same thing. */
export const ORIGIN_REMEDY =
    'Choose one explicitly:\n' +
    '  descix config init --env dev|demo|prod  (persists env.apiUrl in .descix/workspace.json)\n' +
    '  descix --env dev|demo|prod <command>    (this invocation only)\n' +
    '  export DESCIX_API_URL=https://...       (this shell only)';

/**
 * The SOURCE label for a resolution nobody configured. Exported so the printed env line, the
 * tests and any consumer all use one spelling instead of three that drift.
 *
 * The wording is the contract's own (I1, rev 2): it names the state AND the one command that
 * changes it, because a developer who reads "prod" and does not want prod needs the fix in the
 * same line, not in a doc.
 */
export const DEFAULT_ORIGIN_SOURCE =
    'default — no workspace config; `descix config init --env dev` targets DEV';

/**
 * Is this string usable as an API origin? Absolute http(s) URLs only.
 * @param {string} value
 * @returns {boolean}
 */
function isUsableOrigin(value) {
    let parsed;
    try {
        parsed = new URL(String(value).trim());
    } catch {
        return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

/**
 * Resolve the API origin from the sources a caller has in hand.
 *
 * @param {object} sources
 * @param {string|null} [sources.envVar]              process.env.DESCIX_API_URL
 * @param {string|null} [sources.workspaceEnvApiUrl]  workspace.json env.apiUrl
 * @param {string|null} [sources.legacyApiUrl]        workspace.json top-level apiUrl
 * @param {string|null} [sources.globalApiUrl]        ~/.descix/config.json api_url
 * @returns {{ origin: string, source: string, isDefault: boolean }} the origin AND which source
 *          supplied it — the source is returned because "where did this come from" is the
 *          question every misreport in this contract failed to answer. It NEVER returns null
 *          and it never throws for an absent configuration.
 * @throws {OriginInvalidError} when a source NAMED an origin that cannot be used. Falling back
 *         to the default here would silently discard what the developer typed, which is the
 *         same class of defect from the other direction.
 */
export function resolveOrigin(sources = {}) {
    for (const [label, key] of PRECEDENCE) {
        const value = sources[key];
        if (typeof value === 'string' && value.trim() !== '') {
            if (!isUsableOrigin(value)) {
                throw new OriginInvalidError(
                    `The DeSciX API origin configured in ${label} is not a usable origin: "${String(value).trim()}".\n` +
                    'An origin must be an absolute http(s) URL, e.g. https://dev.descix.net.\n\n' +
                    ORIGIN_REMEDY,
                );
            }
            return { origin: normalizeOrigin(value), source: label, isDefault: false };
        }
    }
    // Nothing was configured. That is not a failure — it is the shipped product's declared
    // target, and the caller is required to PRINT that it landed here.
    return {
        origin: normalizeOrigin(DEFAULT_API_URL),
        source: DEFAULT_ORIGIN_SOURCE,
        isDefault: true,
    };
}
