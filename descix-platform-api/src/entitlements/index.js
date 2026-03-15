/**
 * @descix/platform-api - Entitlements
 *
 * Purchase verification, community membership checks, and product registry utilities.
 * Shared between Cloud and Powch microservices.
 */

import { CacheFirestore } from '@descix/cloud-core';

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
 * @param {Object} params - Mutable params object with app_id; sets community_id if missing
 * @returns {Promise<void>}
 */
export async function hydrateCommunityIdFromProducts(params) {
    if (!params.app_id || params.community_id) return;
    try {
        const db = new CacheFirestore();
        const productDoc = await db.db.collection('Products').doc(params.app_id).get();
        if (productDoc.exists) {
            const productData = productDoc.data();
            if (productData.community_id) {
                params.community_id = productData.community_id;
            } else if (productData.productPath) {
                const match = productData.productPath.match(/Community\/([^/]+)/);
                if (match) params.community_id = match[1];
            }
        }
    } catch (err) {
        console.error(`[hydrateCommunityIdFromProducts] Error: ${err.message}`);
    }
}
