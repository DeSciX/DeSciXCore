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
 * The SOURCE label for each thing that can name an origin. One key, one spelling.
 *
 * WHY EACH LABEL NAMES EXACTLY ONE THING (measured 2026-09-09 on published 1.0.4): the envVar
 * label used to read `DESCIX_API_URL (or --api-url / --env)` — a STATIC DISJUNCTION printed
 * whichever of the three had actually chosen the origin, and printed verbatim even with
 * DESCIX_API_URL provably unset. `--env dev`, `--api-url https://dev.descix.net` and a real
 * `DESCIX_API_URL=...` produced three byte-identical source strings. A source that lists the
 * possibilities is not a source: it is the same "who chose this origin" silence this module
 * exists to end, one level in from the null it already fixed.
 *
 * The flag labels are reachable because `bin/descix.js` RECORDS which flag set the variable
 * (see `recordInvocationOrigin`) instead of only folding it into `process.env` and discarding
 * the provenance.
 */
export const ORIGIN_SOURCE_LABELS = {
    flagApiUrl: '--api-url flag',
    flagEnv: '--env flag',
    envVar: 'DESCIX_API_URL environment variable',
    workspaceEnvApiUrl: '.descix/workspace.json env.apiUrl',
    legacyApiUrl: '.descix/workspace.json apiUrl (legacy)',
    globalApiUrl: '~/.descix/config.json api_url',
};

/**
 * The resolution order, most explicit first. The ORDER is the contract; this array is the only
 * place it is written down. Labels come from ORIGIN_SOURCE_LABELS, never from a second literal.
 */
const PRECEDENCE = ['envVar', 'workspaceEnvApiUrl', 'legacyApiUrl', 'globalApiUrl'];

/**
 * What this invocation's FLAGS named, if anything: `{ origin, sourceKey }`.
 *
 * `--api-url` and `--env` are folded into `process.env.DESCIX_API_URL` by the CLI's preAction
 * hook so that every consumer sees one variable. That fold is what destroys the provenance, so
 * the hook records it here in the same breath. Module-level because there is exactly ONE
 * invocation per process, and because this module is imported by every consumer of the origin —
 * one owner of the fact, not a copy ferried through four call signatures.
 */
let invocationOrigin = null;

/**
 * Record that a COMMAND-LINE FLAG chose this invocation's origin.
 *
 * @param {string} origin - the origin the flag resolved to
 * @param {'flagApiUrl'|'flagEnv'} sourceKey - which flag it was
 * @throws when handed a key that has no published label — a source with no name is the defect.
 */
export function recordInvocationOrigin(origin, sourceKey) {
    if (!Object.prototype.hasOwnProperty.call(ORIGIN_SOURCE_LABELS, sourceKey)) {
        throw new Error(
            `recordInvocationOrigin: "${sourceKey}" is not a known origin source. ` +
            `Known: ${Object.keys(ORIGIN_SOURCE_LABELS).join(', ')}.`,
        );
    }
    invocationOrigin = { origin: normalizeOrigin(origin), sourceKey };
}

/** TEST SEAM ONLY: forget this invocation's recorded flag provenance. */
export function _resetInvocationOriginForTests() {
    invocationOrigin = null;
}

/**
 * The label for the value that won, naming WHICH source supplied it.
 *
 * The envVar slot is the only one with more than one possible author, because the flags are
 * folded into it. It reports a flag ONLY when the recorded flag actually accounts for the value
 * in hand — if a flag was recorded and DESCIX_API_URL nevertheless holds something else, the
 * honest answer is the environment variable.
 *
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
function sourceLabelFor(key, value) {
    if (key === 'envVar' && invocationOrigin
        && invocationOrigin.origin === normalizeOrigin(value)) {
        return ORIGIN_SOURCE_LABELS[invocationOrigin.sourceKey];
    }
    return ORIGIN_SOURCE_LABELS[key];
}

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
    for (const key of PRECEDENCE) {
        const value = sources[key];
        if (typeof value === 'string' && value.trim() !== '') {
            const label = sourceLabelFor(key, value);
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
