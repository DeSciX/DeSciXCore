/**
 * @descix/platform-api - Email Verification Auth
 *
 * Email-based verification code flow shared between Cloud and Powch microservices.
 * Generates codes, stores hashed values in Firestore, sends via Gmail.
 *
 * Config values loaded at call time via getCloudConfig() from @descix/cloud-core.
 */

import crypto from 'crypto';
import {
    CacheFirestore,
    FirestoreCollections,
    Timestamp,
    networkResponse,
    NetworkStatus,
    LoginStatus,
    getCloudConfig,
} from '@descix/cloud-core';
import { sendVerificationEmail, normalizeEmail } from '../email/index.js';

const EMAIL_CODE_EXPIRY_MINUTES = 15;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

/**
 * Send an email verification code to the given address.
 * Generates a 6-digit code, hashes and stores it in Firestore, then emails it.
 *
 * @param {Object} params
 * @param {string} params.email - Email address to verify
 * @returns {Promise<Object>} networkResponse result
 */
export async function sendEmailVerification(params) {
    const utils = getCloudConfig();
    const { email } = params;
    const normalized = normalizeEmail(email);
    if (!normalized || !normalized.includes('@')) {
        return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, 'Valid email address is required.');
    }
    if (!utils.DESCIX_ROUTER_COMMUNITY_MANAGER) {
        return networkResponse(
            NetworkStatus.ERROR,
            LoginStatus.AUTH_FAILED,
            'Email sending is not configured on the server (missing DESCIX_ROUTER_COMMUNITY_MANAGER).'
        );
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + EMAIL_CODE_EXPIRY_MINUTES * 60 * 1000));

    const db = new CacheFirestore();
    await db.put_doc(FirestoreCollections.EMAIL_VERIFICATIONS(), normalized, {
        email: normalized,
        code_hash: codeHash,
        expires_at: expiresAt,
        created_at: Timestamp.now(),
        attempts: 0,
        verified: false
    });

    await sendVerificationEmail(normalized, code, EMAIL_CODE_EXPIRY_MINUTES);

    return networkResponse(NetworkStatus.OK, LoginStatus.CONNECTED, {
        sent: true,
        expires_in_minutes: EMAIL_CODE_EXPIRY_MINUTES
    });
}

/**
 * Verify an email code previously sent by sendEmailVerification.
 *
 * @param {Object} params
 * @param {string} params.email - Email address that was verified
 * @param {string} params.code - The 6-digit code to check
 * @returns {Promise<Object>} networkResponse result
 */
export async function verifyEmailCode(params) {
    const { email, code } = params;
    const normalized = normalizeEmail(email);
    if (!normalized || !code) {
        return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, 'Email and code are required.');
    }
    const db = new CacheFirestore();
    const record = await db.get_doc(FirestoreCollections.EMAIL_VERIFICATIONS(), normalized);
    if (!record) {
        return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, 'No verification code found. Please request a new code.');
    }
    const now = new Date();
    const expiresAt = record.expires_at?.toDate ? record.expires_at.toDate() : null;
    if (expiresAt && expiresAt < now) {
        return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, 'Verification code expired. Please request a new code.');
    }
    if (record.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
        return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, 'Too many attempts. Please request a new code.');
    }
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const matches = record.code_hash === codeHash;
    await db.put_doc(FirestoreCollections.EMAIL_VERIFICATIONS(), normalized, {
        attempts: (record.attempts || 0) + 1,
        verified: matches,
        verified_at: matches ? Timestamp.now() : record.verified_at || null
    });
    if (!matches) {
        return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, 'Invalid verification code.');
    }
    return networkResponse(NetworkStatus.OK, LoginStatus.CONNECTED, { verified: true });
}
