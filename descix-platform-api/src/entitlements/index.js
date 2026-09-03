/**
 * @descix/platform-api - Entitlements
 *
 * Purchase verification, community membership checks, and product registry utilities.
 * Shared between Cloud and Powch microservices.
 */

import { CacheFirestore } from '@descix/cloud-core';

/**
 * Error thrown when an app_id cannot be resolved to a registered Products entry.
 *
 * Carries an HTTP-mappable statusCode (404) and a stable machine-readable code so
 * the apiFront catch-all can surface a clean client error instead of an opaque 500.
 * The message names only the app_id and the deployment env — no internals — so it is
 * safe to return to clients even in production.
 *
 * Common cause: a chat/RAG/KB query targeting a DEV-only app against a prod backend
 * (or any wrong-env mistake). A clean 404 makes that misconfiguration self-evident.
 */
export class AppNotFoundError extends Error {
    constructor(appId, env) {
        const envLabel = env || 'unknown';
        super(`app "${appId}" is not registered in env ${envLabel}`);
        this.name = 'AppNotFoundError';
        this.code = 'APP_NOT_FOUND';
        this.statusCode = 404;
        this.app_id = appId;
        this.env = envLabel;
    }
}

/**
 * THE ONE DERIVATION of "which community owns this app".
 *
 * Reads Products/{app_id} — the canonical O(1) registry entry — and returns that
 * community_id. It takes an app_id SCALAR, never a params bag, so there is no
 * client-supplied community_id in scope for it to honour: the answer is a function
 * of the registry alone. Every security boundary (authorization scope, Pinecone
 * namespace, entitlement checks) MUST consume this rather than reading a
 * community_id off a request.
 *
 * Resolution is authoritative and explicit (no silent default — anti-pattern #7):
 *   - No Products/{app_id} doc, or no resolvable community_id in it → AppNotFoundError (404).
 *   - Genuine infrastructure errors (Firestore unreachable) are re-thrown as-is so they
 *     surface as 500s — not masked as "app not found".
 *
 * @param {string} app_id
 * @param {Object} [deps] - Seam for tests: { getProductData(app_id) => data|null }.
 *                          Production callers pass nothing and get the Firestore path.
 * @returns {Promise<string>} the registry's community_id for this app
 * @throws {AppNotFoundError} when app_id is not registered in the current env
 */
export async function resolveAppCommunityId(app_id, deps = {}) {
    if (!app_id) {
        throw new AppNotFoundError(app_id, process.env.DEPLOY_ENV);
    }

    let productData;
    try {
        if (deps.getProductData) {
            productData = await deps.getProductData(app_id);
        } else {
            const db = new CacheFirestore();
            const productDoc = await db.db.collection('Products').doc(app_id).get();
            productData = productDoc.exists ? productDoc.data() : null;
        }
    } catch (err) {
        // Infrastructure failure (e.g. Firestore unreachable) — NOT a missing app.
        // Re-throw so it surfaces as a 500 rather than a misleading 404.
        console.error(`[resolveAppCommunityId] Firestore error resolving '${app_id}': ${err.message}`);
        throw err;
    }

    if (productData) {
        if (productData.community_id) return productData.community_id;
        const match = productData.productPath?.match(/Community\/([^/]+)/);
        if (match) return match[1];
    }

    // App is not registered in this environment (or its Products doc is malformed).
    // Surface a clean, structured 404 instead of letting an undefined community_id
    // bubble into an opaque downstream 500.
    throw new AppNotFoundError(app_id, process.env.DEPLOY_ENV);
}

/**
 * Hydrate community_id from the Products registry when missing.
 *
 * FILL-IF-ABSENT convenience for handlers that accept a community_id in their own
 * published contract. It consumes resolveAppCommunityId so there is exactly one
 * derivation of the fact.
 *
 * NOT AN AUTHORIZATION PRIMITIVE, and it never was: because it returns early when
 * the caller already supplied a community_id, it is a no-op EXACTLY when a caller
 * asserts the value — a mitigation that disables itself under the case that matters.
 * An authorization scope MUST call resolveAppCommunityId directly.
 *
 * @param {Object} params - Mutable params object with app_id; sets community_id if missing
 * @param {Object} [deps] - Seam for tests, forwarded to resolveAppCommunityId.
 * @returns {Promise<void>}
 * @throws {AppNotFoundError} when app_id is not registered in the current env
 */
export async function hydrateCommunityIdFromProducts(params, deps = {}) {
    if (!params.app_id || params.community_id) return;
    params.community_id = await resolveAppCommunityId(params.app_id, deps);
}
