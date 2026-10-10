/**
 * THE ONE OWNER OF "whose app is this workspace, and where does it point".
 *
 * WHY (measured 2026-08-29): `descix init -c egpt -a godsworld` wrote
 * `env.products[0].appId = "godsworld"` and nothing else, while `agent-files.js` read
 * `env.platform.appId`, `defaultContext.appId` and a TOP-LEVEL `config.apiUrl` — three keys the
 * init path never writes. The reader missed on every one and fell through to the literals
 * `'my-app'` and the production origin. The measured result: the four generated
 * agent-instruction files named `my-app` and that origin, and named the developer's
 * actual app and community ZERO times.
 *
 * That is a READER/WRITER MISMATCH, which is the mirror-drift bug class in its purest form —
 * two modules each holding their own idea of the workspace's shape. The cure is this module:
 * ONE reader, over the keys the writer actually writes, consumed by every surface that needs
 * the workspace's identity. `registerApp()` is the writer; this is its reader.
 *
 * NO FALLBACK LITERALS. A fact this module cannot find is returned as `null` and the caller
 * decides loudly. `'my-app'` was never a default — it was a wrong answer wearing a default's
 * clothes, and it shipped in every file the CLI generated.
 */

import { resolveOrigin } from './origin.js';

/**
 * Read the workspace's identity from a parsed `.descix/workspace.json`.
 *
 * v3 single-app: the one key the writer (`WorkspaceConfig.registerApp()`) writes is `env.app`,
 * so that is the one key read here — writer and reader are a pair. The legacy `defaultContext`
 * survives as the last resort for files written before the env block existed.
 *
 * @param {object} config - the PARSED workspace.json (not a WorkspaceConfig instance, so that
 *                          `agent-files.js` can stay usable from the VS Code extension where it
 *                          only has the JSON).
 * @returns {{ appId: string|null, communityId: string|null, apiUrl: string|null,
 *             originSource: string|null }}
 */
export function readIdentity(config = {}) {
    const env = config.env || {};
    const app = env.app || {};
    const legacy = config.defaultContext || {};

    const appId =
        app.appId ||
        legacy.appId ||
        null;

    const communityId =
        app.communityId ||
        legacy.communityId ||
        config.primaryCommunity ||
        null;

    // The origin comes from the ONE origin owner, over the same sources every other surface
    // resolves against — including DESCIX_API_URL, because `descix --env dev init` is the
    // developer stating their choice at exactly the moment these files are written.
    // Under (A') this ALWAYS yields an origin: a workspace that named none resolves to the
    // declared default, carrying `source: default`. The generated files therefore state the
    // origin AND where it came from, instead of either guessing or going silent. A configured
    // origin that is unusable still THROWS here — writing agent files against a broken origin
    // would bake the breakage into four files the developer's agent then trusts.
    const resolved = resolveOrigin({
        envVar: process.env.DESCIX_API_URL,
        workspaceEnvApiUrl: env.apiUrl,
    });

    return {
        appId,
        communityId,
        apiUrl: resolved.origin,
        originSource: resolved.source,
    };
}

/**
 * True when the identity is complete enough to generate honest agent-instruction files.
 * `apiUrl` is deliberately NOT required: a workspace can legitimately exist before an
 * environment is chosen, and the generated files say so in words rather than guessing.
 *
 * @param {{appId: string|null, communityId: string|null}} identity
 * @returns {boolean}
 */
export function isIdentityNamed(identity) {
    return Boolean(identity && identity.appId && identity.communityId);
}
