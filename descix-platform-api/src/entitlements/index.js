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
 * Hydrate community_id from the Products registry when missing.
 *
 * The Products/{app_id} document is the canonical O(1) registry entry.
 * app_id is globally unique; community_id is stored metadata in the doc.
 * This function mutates params.community_id in-place.
 *
 * Invariant: Never trust a client-provided community_id.
 * Security boundaries (Pinecone namespace, entitlement checks) must always
 * call this to re-derive community_id from the Products registry.
 *
 * Resolution is authoritative and explicit (no silent default — anti-pattern #7):
 *   - If app_id has no Products/{app_id} doc (or no resolvable community_id in it),
 *     throw AppNotFoundError (HTTP 404). This covers the wrong-env / nonexistent-app
 *     case for every chat/RAG/KB query path, all of which funnel through here.
 *   - Genuine infrastructure errors (Firestore unreachable, etc.) are re-thrown as-is
 *     so they surface as 500s — not masked as "app not found".
 *
 * @param {Object} params - Mutable params object with app_id; sets community_id if missing
 * @returns {Promise<void>}
 * @throws {AppNotFoundError} when app_id is not registered in the current env
 */
export async function hydrateCommunityIdFromProducts(params) {
    if (!params.app_id || params.community_id) return;

    let productDoc;
    try {
        const db = new CacheFirestore();
        productDoc = await db.db.collection('Products').doc(params.app_id).get();
    } catch (err) {
        // Infrastructure failure (e.g. Firestore unreachable) — NOT a missing app.
        // Re-throw so it surfaces as a 500 rather than a misleading 404.
        console.error(`[hydrateCommunityIdFromProducts] Firestore error resolving '${params.app_id}': ${err.message}`);
        throw err;
    }

    if (productDoc.exists) {
        const productData = productDoc.data();
        if (productData.community_id) {
            params.community_id = productData.community_id;
            return;
        }
        const match = productData.productPath?.match(/Community\/([^/]+)/);
        if (match) {
            params.community_id = match[1];
            return;
        }
    }

    // App is not registered in this environment (or its Products doc is malformed).
    // Surface a clean, structured 404 instead of letting an undefined community_id
    // bubble into an opaque downstream 500.
    throw new AppNotFoundError(params.app_id, process.env.DEPLOY_ENV);
}
