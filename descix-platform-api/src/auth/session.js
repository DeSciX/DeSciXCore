/**
 * @descix/platform-api - Session Management
 *
 * Creates and manages user sessions in Firestore.
 * Shared between Cloud and Powch microservices.
 */

import crypto from 'crypto';
import { UserSession, AuthProvider, CacheFirestore } from '@descix/cloud-core';

/**
 * Create a unified user session for any authentication provider.
 *
 * @param {string} userId - DeSciX user ID (descix_*)
 * @param {string} provider - Provider type (AuthProvider.DISCORD, AuthProvider.GOOGLE, AuthProvider.DESCIX, etc.)
 * @param {number} expiresInSeconds - Session expiration in seconds (default: 86400 = 24 hours)
 * @returns {Promise<string>} Session token
 */
export async function createUserSession(userId, provider, expiresInSeconds = 86400) {
    const sessionToken = crypto.randomUUID();
    const session = new UserSession(
        provider,
        sessionToken,
        null,                    // refresh_token
        expiresInSeconds,
        provider,                // scope
        'Bearer',
        null,                    // id_token
        userId
    );
    await UserSession.to_firestore(session);
    return sessionToken;
}
