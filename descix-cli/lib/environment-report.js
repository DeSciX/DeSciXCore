/**
 * THE ONE OWNER OF "which environment is this origin, and how does the CLI SAY SO".
 *
 * WHY THIS FILE EXISTS: contract I1 (A', rev 2) requires that every network-bound command
 * PRINT the resolved environment, origin and source — always, not only when it landed on the
 * default. That print needs two facts: the env NAME for an origin, and one spelling of the
 * line. Both were about to be derived in a second place.
 *
 * `wallet-environment.js` already derived origin -> env name privately, for the wallet stamp.
 * Two derivations of one fact is the mirror-drift bug class this contract exists to end, so
 * the derivation moved HERE and the wallet stamp became a consumer of it. There is exactly one
 * answer to "what environment is https://dev.descix.net", and both surfaces read it from here.
 *
 * The origin TABLE is still owned upstream (`@descix/app-sdk/dev` ENV_ORIGINS, surfaced as
 * `WorkspaceConfig.ENV_MAP`). This module holds no copy of it.
 */
import { WorkspaceConfig } from './workspace-config.js';
import { normalizeOrigin } from './origin.js';

/**
 * The environment NAME for an origin.
 *
 * @param {string} origin
 * @returns {string} the ENV_MAP name whose url matches (`dev` | `demo` | `prod`), or `'custom'`
 *          when the origin is a real one that simply is not in the map — a self-hosted or
 *          port-forwarded gateway. 'custom' is an HONEST answer ("a real origin, not one of the
 *          three named ones"), not a fallback standing in for a missing fact: the origin itself
 *          is always printed beside it.
 * @throws when called with no origin. There is no default: guessing which environment an
 *         origin belongs to is exactly the misreport this contract exists to end.
 */
export function environmentNameFor(origin) {
    if (!origin || String(origin).trim() === '') {
        throw new Error(
            'environmentNameFor: refusing to name the environment of an empty origin — ' +
            'it cannot be guessed.',
        );
    }
    const normalized = normalizeOrigin(origin);
    const match = Object.entries(WorkspaceConfig.ENV_MAP)
        .find(([, entry]) => entry && normalizeOrigin(entry.url) === normalized);
    return match ? match[0] : 'custom';
}

/**
 * The ONE spelling of the env line every network-bound command prints.
 *
 * Shape is the contract's own (I1, rev 2): `env: <name> (<source>) <origin>`. The SOURCE is the
 * whole point — it is the fact whose absence made "the developer chose production" and "the
 * developer chose nothing" one observable state on 1.0.1.
 *
 * @param {{origin: string, source: string}} resolved - as returned by `resolveOrigin`
 * @returns {string} the line, WITHOUT a trailing newline
 */
export function formatEnvLine({ origin, source }) {
    return `env: ${environmentNameFor(origin)} (${source}) ${origin}`;
}

/**
 * The SOURCE label for an origin handed in by the caller rather than resolved from config —
 * `--api-url`, `descix auth login -u`, a microservice constructing a client against a known
 * origin. Exported so the label has one spelling.
 */
export const EXPLICIT_ORIGIN_SOURCE = 'explicit --api-url / caller-supplied baseUrl';

/**
 * Distinct (origin, source) pairs already reported in this process.
 *
 * WHY DEDUPE AND NOT A ONE-SHOT FLAG: a single command constructs many clients (87 sites), so
 * a per-client print would emit the same line a dozen times and train the reader to skim past
 * it. But a one-shot flag would HIDE a second, DIFFERENT origin being contacted in the same
 * invocation — which is precisely the kind of thing this contract exists to surface. Keying on
 * the pair prints each distinct target exactly once.
 */
const reported = new Set();

/**
 * PRINT the resolved environment for a network-bound invocation. Always — not only when the
 * origin came from the declared default.
 *
 * STDERR, DELIBERATELY. stdout is a DATA CHANNEL under `--json` and is the protocol channel for
 * the MCP stdio server; a status line on stdout would corrupt both. stderr is where a human
 * piping stdout still sees it.
 *
 * @param {{origin: string, source: string}} resolved
 * @returns {string|null} the line printed, or null when this pair was already reported
 */
export function reportEnvironment({ origin, source }) {
    const key = `${origin}\u0000${source}`;
    if (reported.has(key)) return null;
    reported.add(key);
    const line = formatEnvLine({ origin, source });
    process.stderr.write(line + '\n');
    return line;
}

/** TEST SEAM ONLY: forget what has been reported, so a test can observe the print again. */
export function _resetEnvironmentReportForTests() {
    reported.clear();
}
