/**
 * @descix/platform-api - User Migration
 *
 * Lazy migration for users from legacy provider IDs to descix_ primary auth IDs.
 * Used by Cloud's authHandlers.js during login flows.
 */

import crypto from 'crypto';
import { CacheFirestore, FirestoreCollections, AuthProvider } from '@descix/cloud-core';

/**
 * Migrate legacy user to DeSciX primary auth system (lazy migration on login).
 *
 * @param {string} legacyId - Legacy user ID (Discord snowflake, google_*, or descix_email_hash)
 * @param {string} providerType - Provider type (AuthProvider.DISCORD, AuthProvider.GOOGLE, AuthProvider.DESCIX)
 * @returns {Promise<Object|null>} Migrated user doc data or null if not found
 *
 * NOTE: Returns raw Firestore doc data, not a User model instance,
 * to avoid a circular dependency with the models module.
 * Callers should wrap in User.from_firestore() if needed.
 */
export async function migrateUserIfNeeded(legacyId, providerType) {
    if (!legacyId || !providerType) return null;

    const db = new CacheFirestore();

    // Check if already migrated (has descix_ prefix)
    if (legacyId.startsWith('descix_')) {
        return await db.get_doc(FirestoreCollections.USERS(), legacyId);
    }

    // Check if already indexed in ProviderIndex
    const sanitizedId = sanitizeProviderId(legacyId);
    const indexKey = `${providerType}_${sanitizedId}`;
    const index = await db.get_doc(FirestoreCollections.PROVIDER_INDEX(), indexKey);
    if (index?.descix_user_id) {
        return await db.get_doc(FirestoreCollections.USERS(), index.descix_user_id);
    }

    // Try to load legacy user
    const existingUser = await db.get_doc(FirestoreCollections.USERS(), legacyId);
    if (!existingUser) {
        return null;
    }

    // Generate new DeSciX ID
    const newId = `descix_${crypto.randomUUID()}`;

    // Create new user document with DeSciX ID
    const userData = { ...existingUser, id: newId };

    // Ensure provider_links is populated
    if (!userData.provider_links || Object.keys(userData.provider_links).length === 0) {
        userData.provider_links = {};
        if (providerType === AuthProvider.DISCORD) {
            userData.provider_links[AuthProvider.DISCORD] = {
                provider_id: legacyId,
                linked_at: new Date().toISOString()
            };
        } else if (providerType === AuthProvider.GOOGLE) {
            const googleSub = legacyId.startsWith('google_') ? legacyId.substring(7) : legacyId;
            userData.provider_links[AuthProvider.GOOGLE] = {
                provider_id: googleSub,
                linked_at: new Date().toISOString()
            };
        }
    }

    // Save new document
    await db.put_doc(FirestoreCollections.USERS(), newId, userData);

    // Add ProviderIndex entry for the new ID
    await db.put_doc(FirestoreCollections.PROVIDER_INDEX(), indexKey, {
        descix_user_id: newId,
        provider_type: providerType,
        provider_id: legacyId,
        linked_at: new Date().toISOString()
    });

    console.log(`[migration] Migrated user ${legacyId} -> ${newId}`);
    return userData;
}

/**
 * Sanitize provider ID for use in Firestore document paths.
 * @param {string} providerId - Original provider ID
 * @returns {string} Sanitized ID safe for Firestore paths
 */
function sanitizeProviderId(providerId) {
    if (!providerId) return '';
    if (providerId.includes('@') || providerId.includes('+') || providerId.includes('/')) {
        // Hash emails and IDs with special characters
        return crypto.createHash('sha256').update(providerId.toLowerCase()).digest('hex').substring(0, 32);
    }
    return providerId.replace(/[/.+@#[\]]/g, '_');
}
