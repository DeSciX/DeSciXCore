/**
 * Mesh Loopback — SERVICE-SIDE caller-authenticated broker invoker.
 *
 * WS-V1-PURGE data-plane caller-auth (CEO-D-2026-06-02-APP-DATAPLANE-CALLER-AUTH-NO-SERVICE-KEY +
 * CEO-D-2026-06-02-DATAPLANE-LOOPBACK-OPTION-A-SA-APP-BINDING).
 *
 * An app microservice running on Cloud Run writes its OWN data plane
 * (get_asset_upload_token, get_app_asset, app_records_*) by calling the Core broker
 * (/apifront) AS the injected caller — with NO per-service key, NO delegate signature,
 * NO X-NFT-ID/SERVICE_KEY. This REPLACES the delegate/mcpClient path for the app data
 * plane.
 *
 * AUTH MODEL — SA-OIDC establishes the caller:
 *   1. The app service mints a Google OIDC ID-token using ITS OWN Cloud Run service
 *      account (ADC → google-auth-library getIdTokenClient(CORE_API_URL)). The token's
 *      verified `email` claim IS the service's SA identity — unforgeable, signed by Google.
 *   2. It POSTs { command, params } to CORE_API_URL with:
 *        Authorization: Bearer <id_token>
 *      and threads the platform-user context through params._descix.user.id (the user
 *      the action is performed AS — exactly the _descix envelope Core forwards to external
 *      services, here flowing back IN).
 *   3. Core (apiFront SA-OIDC-establishes-caller branch) verifies the token is a
 *      platform-trusted SA, ENFORCES that the SA matches the app_id's registered SA
 *      (the SA<->app_id binding — multi-tenant safety), rehydrates the full User from
 *      Firestore by _descix.user.id, sets params.user, and runs the command with the
 *      normal entitlement check (the user must hold COMMUNITY_MANAGE_APPS on that app).
 *
 * The SA identity (Bearer) is the SERVICE authority; _descix.user.id is the ACTING user.
 * Both are required: the binding proves "this is app X's service"; the entitlement proves
 * "acting as a user who may manage app X".
 *
 * Decoupled from any HTTP client: callers get back Core's `message` payload. The OIDC
 * client is memoized per CORE_API_URL (audience) — one token-minting client per process.
 */

import { GoogleAuth } from 'google-auth-library';

// One GoogleAuth per process (ADC discovery is shared). getIdTokenClient is cached per
// audience URL so we don't re-discover credentials on every call.
let _auth = null;
const _idTokenClientByAudience = new Map();

function getAuth() {
    if (!_auth) _auth = new GoogleAuth();
    return _auth;
}

/**
 * Get (memoized) an IdTokenClient whose minted ID-tokens carry `aud = coreApiUrl`.
 * The Cloud Run service's own SA is used (ADC). Google signs the token; the SA email
 * claim is what Core's binding check verifies.
 */
async function getIdTokenClient(coreApiUrl) {
    let client = _idTokenClientByAudience.get(coreApiUrl);
    if (!client) {
        client = await getAuth().getIdTokenClient(coreApiUrl);
        _idTokenClientByAudience.set(coreApiUrl, client);
    }
    return client;
}

/**
 * Build a meshLoopback invoker bound to a Core broker URL.
 *
 * @param {object} opts
 * @param {string} opts.coreApiUrl - Core broker URL (e.g. utils.CORE_API_URL → https://.../apifront/).
 *        Also used as the OIDC token audience.
 * @param {() => {id: string, email?: string, walletAddress?: string} | null} [opts.getDescixUser]
 *        Returns the platform user to act AS for a given call. Most app services bind a
 *        single owning user; this is invoked per call so the user can be request-scoped.
 *        If it returns null, the loopback sends no _descix.user and Core will reject any
 *        user-scoped command (fail-closed).
 * @param {(url: string, body: string, headers: object) => Promise<{status:number, data:any}>} [opts.post]
 *        Optional POST transport seam (DEV self-signed cert handling / tests). Defaults to
 *        the google-auth-library IdTokenClient.request (which attaches the Bearer token).
 * @returns {(command: string, params?: object) => Promise<any>} meshLoopback(command, params)
 */
export function createMeshLoopback({ coreApiUrl, getDescixUser, post } = {}) {
    if (!coreApiUrl) {
        throw new Error('createMeshLoopback: coreApiUrl is required (e.g. utils.CORE_API_URL).');
    }

    /**
     * Call a Core command as the injected caller (SA-OIDC + _descix.user).
     * @param {string} command
     * @param {object} [params]
     * @returns {Promise<any>} Core's `message` payload on success.
     */
    return async function meshLoopback(command, params = {}) {
        if (!command || typeof command !== 'string') {
            throw new Error('meshLoopback: command (string) is required.');
        }

        // Thread the acting platform user through the _descix envelope (the same shape
        // Core forwards to external services — here it flows back inbound).
        const descixUser = typeof getDescixUser === 'function' ? getDescixUser() : null;
        const body = {
            command,
            params: {
                ...params,
                _descix: {
                    user: descixUser
                        ? {
                              id: descixUser.id,
                              email: descixUser.email,
                              walletAddress: descixUser.walletAddress,
                          }
                        : null,
                    timestamp: Date.now(),
                },
            },
        };
        const bodyString = JSON.stringify(body);

        let result;
        if (typeof post === 'function') {
            // Test / dev transport seam. The caller's post() is responsible for the Bearer
            // token in test contexts; production uses the IdTokenClient path below.
            result = await post(coreApiUrl, bodyString, { 'Content-Type': 'application/json' });
        } else {
            // Production path: IdTokenClient.request attaches Authorization: Bearer <id_token>
            // minted for `aud = coreApiUrl` from the Cloud Run SA (ADC). No service key.
            const client = await getIdTokenClient(coreApiUrl);
            const resp = await client.request({
                url: coreApiUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: bodyString,
            });
            result = { status: resp.status, data: resp.data };
        }

        const data = result?.data;
        if (data && data.status === 'OK') {
            return data.message;
        }
        const reason = (data && data.message) || `HTTP ${result?.status}` || 'Unknown error from Core';
        throw new Error(`meshLoopback ${command} failed: ${reason}`);
    };
}

/**
 * One-shot convenience: mint + call without pre-building an invoker.
 * @param {string} command
 * @param {object} params
 * @param {object} opts - same as createMeshLoopback opts.
 */
export async function meshLoopback(command, params = {}, opts = {}) {
    const invoker = createMeshLoopback(opts);
    return invoker(command, params);
}
