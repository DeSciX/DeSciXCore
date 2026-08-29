/**
 * THE ONE OWNER OF "which DeSciX origin does this invocation talk to".
 *
 * WHY (measured 2026-08-29, `getApiUrl()` on an unconfigured workspace returned
 * `https://descix.net`): the CLI had no representation of "nobody chose an origin". Every
 * resolution site ended in the production literal, so a developer who had configured nothing
 * and a developer who had deliberately chosen production produced byte-identical results. The
 * CLI then reported that origin back in agent-instruction files, in `config show`, and in the
 * wallet it minted — naming a production origin the developer never picked.
 *
 * THE RULE THIS ENFORCES: a resolver MISS FAILS LOUD. There is no default origin. `prod` is a
 * thing you CHOOSE (`--env prod`, `descix config set-env prod`), never a thing you land on by
 * omission.
 *
 * This module holds NO copy of the origin table. The three named origins live in
 * `WorkspaceConfig.ENV_MAP` (itself derived from `@descix/app-sdk/dev` ENV_ORIGINS), which is
 * what `--env` resolves against; consumers that need a name for an origin use
 * `walletEnvironmentStamp`. Keeping the table out of here is deliberate: two derivations of one
 * fact is the mirror drift this contract exists to end.
 *
 * This file imports nothing from the CLI, so it can be consumed by `workspace-config.js`
 * without a cycle.
 */

/**
 * The single spelling of "are these two origins the same origin" — trailing slashes and
 * surrounding whitespace do not make an origin different.
 *
 * Exported because `wallet-environment.js` compares origins against ENV_MAP and MUST use the
 * same comparison this module resolves with; a second private copy is how the two drift.
 *
 * @param {string} origin
 * @returns {string}
 */
export function normalizeOrigin(origin) {
    return String(origin).trim().replace(/\/+$/, '');
}

/**
 * Thrown when no configured source names an origin. Carries a `code` so callers can recognise
 * it without matching on message text.
 */
export class OriginUnresolvedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OriginUnresolvedError';
        this.code = 'ORIGIN_UNRESOLVED';
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

/** The remedy text every miss prints. One spelling, so every surface says the same thing. */
export const ORIGIN_REMEDY =
    'Choose one explicitly:\n' +
    '  descix config set-env dev|demo|prod     (persists env.apiUrl in .descix/workspace.json)\n' +
    '  descix --env dev|demo|prod <command>    (this invocation only)\n' +
    '  export DESCIX_API_URL=https://...       (this shell only)';

/**
 * Resolve the API origin from the sources a caller has in hand.
 *
 * @param {object} sources
 * @param {string|null} [sources.envVar]              process.env.DESCIX_API_URL
 * @param {string|null} [sources.workspaceEnvApiUrl]  workspace.json env.apiUrl
 * @param {string|null} [sources.legacyApiUrl]        workspace.json top-level apiUrl
 * @param {string|null} [sources.globalApiUrl]        ~/.descix/config.json api_url
 * @returns {{ origin: string, source: string }} the origin AND which source supplied it — the
 *          source is returned because "where did this come from" is the question every
 *          misreport in this contract failed to answer.
 * @throws {OriginUnresolvedError} when no source names an origin. It does NOT return a default;
 *         that absence is the entire point of this module.
 */
export function resolveOrigin(sources = {}) {
    for (const [label, key] of PRECEDENCE) {
        const value = sources[key];
        if (typeof value === 'string' && value.trim() !== '') {
            return { origin: normalizeOrigin(value), source: label };
        }
    }
    throw new OriginUnresolvedError(
        'No DeSciX API origin is configured, so this command has no server to talk to.\n' +
        'Nothing was found in any of: ' + PRECEDENCE.map(([label]) => label).join(', ') + '.\n\n' +
        ORIGIN_REMEDY,
    );
}

/**
 * Non-throwing form, for surfaces that must DISPLAY the state rather than act on it
 * (`config show`, `status`). Returns null instead of inventing an origin.
 *
 * @param {object} sources - same shape as {@link resolveOrigin}
 * @returns {{ origin: string, source: string }|null}
 */
export function resolveOriginOrNull(sources = {}) {
    try {
        return resolveOrigin(sources);
    } catch (err) {
        if (err instanceof OriginUnresolvedError) return null;
        throw err;
    }
}
