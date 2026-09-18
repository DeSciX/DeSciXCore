/**
 * THE ORIGIN STAMP EVERY MCP TOOL RESULT CARRIES.
 *
 * MEASURED 2026-09-17: two sessions spent hours investigating a knowledge base as broken.
 * Both were reading DEV through the MCP connector while believing they were reading PROD,
 * because tool results said nothing about where they came from. `bin/mcp-server.js` returned
 * every result as a bare `JSON.stringify(result)` — no origin, no environment. The envelope
 * carries `community_id`/`app_id`, which READ like provenance and are not: they say which app,
 * never which deployment of the platform answered.
 *
 * By contrast the CLI prints `env: <name> (<source>) <origin>` on EVERY network-bound command,
 * unprompted (`lib/environment-report.js` `reportEnvironment()`), sourced from the ONE owner of
 * "which origin did this invocation resolve to" (`lib/origin.js` `resolveOrigin()`, consumed by
 * `DeSciXApiClient.initialize()` and kept on the client as `baseUrl` + `originSource`).
 *
 * This module adds NO second derivation. It reads the SAME two facts the CLI already keeps on
 * an initialized `DeSciXApiClient` and combines them with the SAME env-name owner
 * (`environmentNameFor`) the CLI's own status line uses. There is exactly one answer to "what
 * origin, what environment" for a given client, and every surface — the CLI's stderr line, the
 * MCP stamp — reads it from here.
 */
import { environmentNameFor } from './environment-report.js';

/**
 * Build the origin stamp for an MCP tool result FROM the one owner: an already-initialized
 * `DeSciXApiClient`'s `baseUrl` + `originSource` (set once, in `initialize()`, by
 * `resolveOrigin()` — see `api-client.js`).
 *
 * @param {import('./api-client.js').DeSciXApiClient} apiClient - must already be initialized
 *   (`ensureInitialized()` resolved) so `baseUrl`/`originSource` are populated. Calling this
 *   before initialization is a caller defect, not a state to paper over with a guess.
 * @returns {{origin: string, source: string, environment: string}}
 */
export function originStampFor(apiClient) {
    const origin = apiClient?.baseUrl;
    const source = apiClient?.originSource;
    if (!origin || !source) {
        throw new Error(
            'originStampFor: apiClient has no resolved baseUrl/originSource — ' +
            'call ensureInitialized() before stamping a result.',
        );
    }
    return { origin, source, environment: environmentNameFor(origin) };
}

/**
 * The ONE spelling of the human-visible stamp line. Mirrors `formatEnvLine()`
 * (`environment-report.js`) in shape so a reader who has seen the CLI's own `env:` line
 * recognizes this as the same fact, not a second convention.
 *
 * @param {{origin: string, source: string, environment: string}} stamp
 * @returns {string}
 */
export function formatOriginStampLine({ origin, source, environment }) {
    return `[DeSciX origin] env: ${environment} (${source}) ${origin}`;
}

/**
 * Attach the origin stamp to an MCP `CallToolResult` — success or error alike.
 *
 * TWO PLACES, DELIBERATELY, per the same fact:
 *   1. An appended `content` block (visible text). This is the fix for the actual measured
 *      failure: the reader is an LLM/agent consuming the tool's TEXT output, not a program
 *      inspecting `_meta` — a stamp only a machine can see would not have caught the two
 *      sessions this closes. The ORIGINAL content entries are left untouched and in place, so
 *      an existing caller's `JSON.parse(content[0].text)` keeps working exactly as before —
 *      this only ever APPENDS a new block, never rewrites or reorders the old one.
 *   2. `_meta.descix_origin` — the MCP-spec extension point (`CallToolResult._meta`, a sibling
 *      of `content`, not nested inside it) for a programmatic caller that wants the fact as
 *      structured data without re-parsing the human-readable line.
 *
 * @param {{content?: Array<object>, isError?: boolean, [k: string]: any}} result
 * @param {{origin: string, source: string, environment: string}} stamp
 * @returns {object} a NEW result object; `result` is not mutated.
 */
export function stampToolResult(result, stamp) {
    const content = Array.isArray(result.content) ? [...result.content] : [];
    content.push({ type: 'text', text: formatOriginStampLine(stamp) });
    return {
        ...result,
        content,
        _meta: { ...(result._meta || {}), descix_origin: stamp },
    };
}
