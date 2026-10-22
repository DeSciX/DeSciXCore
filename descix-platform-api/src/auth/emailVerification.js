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
import { EmailIdentityRefusal, EmailIdentityError } from '../models/index.js';

const EMAIL_CODE_EXPIRY_MINUTES = 15;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

/**
 * The machine-readable reason a verifyEmailCode call refused. Every ERROR result carries one of
 * these as `code`, so a consumer branches on the code and never on the message text.
 */
export const EmailVerificationRefusal = Object.freeze({
    INPUT_REQUIRED: 'VERIFICATION_INPUT_REQUIRED',
    NOT_FOUND: 'VERIFICATION_NOT_FOUND',
    EXPIRED: 'VERIFICATION_EXPIRED',
    ATTEMPTS_EXHAUSTED: 'VERIFICATION_ATTEMPTS_EXHAUSTED',
    INVALID: 'VERIFICATION_INVALID',
    /** The record was requested by another account (or by none, when an account verifies). */
    NOT_YOURS: EmailIdentityRefusal.VERIFICATION_NOT_YOURS,
    /** The record pre-dates the account binding (no uid field): request a new code. */
    UNBOUND: EmailIdentityRefusal.VERIFICATION_UNBOUND,
});

/** A Firestore Timestamp (or Date) as a Date, or null. */
function asDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    return value instanceof Date ? value : null;
}

/** The requesting account of a verification call: a non-empty string uid, or null (no account). */
function requesterUid(uid) {
    if (uid === undefined || uid === null) return null;
    if (typeof uid !== 'string' || uid.length === 0) {
        throw new Error('email verification: uid must be a non-empty string (the requesting account) or null');
    }
    return uid;
}

/** An ERROR networkResponse that carries the refusal code (networkResponse ferries `code`). */
function verificationRefusal(code, message) {
    return networkResponse(NetworkStatus.ERROR, LoginStatus.AUTH_FAILED, {
        status: NetworkStatus.ERROR, message, code,
    });
}

/**
 * Send an email verification code to the given address.
 * Generates a 6-digit code, hashes and stores it in Firestore, then emails it.
 *
 * The record is bound to the requesting account: `uid` is stored on it (null for flows with no
 * account, e.g. Discord link or a token-claim recipient), and every send rewrites it, so a new
 * request always replaces an earlier binding. Only a record whose uid is the caller's account
 * can attach the email to that account (assertEmailVerifiedFor).
 *
 * @param {Object} params
 * @param {string} params.email - Email address to verify
 * @param {string|null} [params.uid] - The requesting account's id (USERS doc id = sanitized credentialId)
 * @returns {Promise<Object>} networkResponse result
 */
export async function sendEmailVerification(params) {
    const utils = getCloudConfig();
    const { email } = params;
    const uid = requesterUid(params.uid);
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
        uid,
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
 * @param {string|null} [params.uid] - The verifying account; must equal the record's uid
 * @returns {Promise<Object>} networkResponse result
 */
export async function verifyEmailCode(params) {
    const { email, code } = params;
    const uid = requesterUid(params.uid);
    const normalized = normalizeEmail(email);
    if (!normalized || !code) {
        return verificationRefusal(EmailVerificationRefusal.INPUT_REQUIRED, 'Email and code are required.');
    }
    const db = new CacheFirestore();
    const record = await db.get_doc(FirestoreCollections.EMAIL_VERIFICATIONS(), normalized);
    if (!record) {
        return verificationRefusal(EmailVerificationRefusal.NOT_FOUND, 'No verification code found. Please request a new code.');
    }
    // Checked before the attempt counter: a caller that does not own the record never spends
    // (or probes) its attempts.
    if (uid !== null && !Object.prototype.hasOwnProperty.call(record, 'uid')) {
        return verificationRefusal(EmailVerificationRefusal.UNBOUND, 'This verification code was issued before codes were tied to an account. Please request a new code.');
    }
    if ((record.uid ?? null) !== uid) {
        return verificationRefusal(EmailVerificationRefusal.NOT_YOURS, 'This verification code was requested from a different account. Please request a new code.');
    }
    const now = new Date();
    const expiresAt = asDate(record.expires_at);
    if (expiresAt && expiresAt < now) {
        return verificationRefusal(EmailVerificationRefusal.EXPIRED, 'Verification code expired. Please request a new code.');
    }
    if (record.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
        return verificationRefusal(EmailVerificationRefusal.ATTEMPTS_EXHAUSTED, 'Too many attempts. Please request a new code.');
    }
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const matches = record.code_hash === codeHash;
    await db.put_doc(FirestoreCollections.EMAIL_VERIFICATIONS(), normalized, {
        attempts: (record.attempts || 0) + 1,
        verified: matches,
        verified_at: matches ? Timestamp.now() : record.verified_at || null
    });
    if (!matches) {
        return verificationRefusal(EmailVerificationRefusal.INVALID, 'Invalid verification code.');
    }
    return networkResponse(NetworkStatus.OK, LoginStatus.CONNECTED, { verified: true });
}

/**
 * The verification half of attaching an email to an account. Resolves when
 * the EMAIL_VERIFICATIONS record for `email` was requested by `uid`, is verified, and is not past
 * its expires_at (the code's expiry, EMAIL_CODE_EXPIRY_MINUTES after the send). Throws
 * EmailIdentityError otherwise, with a reason per case; a record with no uid field pre-dates the
 * binding and is refused, never grandfathered.
 *
 * @param {string} uid - The account attaching the email
 * @param {string} email - The email being attached
 * @returns {Promise<{ email: string }>} the normalized email
 */
export async function assertEmailVerifiedFor(uid, email) {
    if (!uid || typeof uid !== 'string') throw new Error('assertEmailVerifiedFor: uid is required');
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error('assertEmailVerifiedFor: email is required');
    const db = new CacheFirestore();
    const record = await db.get_doc(FirestoreCollections.EMAIL_VERIFICATIONS(), normalized);
    if (!record) {
        throw new EmailIdentityError(EmailIdentityRefusal.NOT_VERIFIED,
            'This email has not been verified. Enter the code we sent you before accepting the Terms of Service.');
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'uid')) {
        throw new EmailIdentityError(EmailIdentityRefusal.VERIFICATION_UNBOUND,
            'This email verification was made before codes were tied to an account. Request a new code and verify again.');
    }
    if (record.uid !== uid) {
        throw new EmailIdentityError(EmailIdentityRefusal.VERIFICATION_NOT_YOURS,
            'This email was verified from a different account. Request a new code from this account and verify again.');
    }
    const expiresAt = asDate(record.expires_at);
    if (!expiresAt || expiresAt <= new Date()) {
        throw new EmailIdentityError(EmailIdentityRefusal.VERIFICATION_EXPIRED,
            'Your email verification has expired. Request a new code and verify again.');
    }
    if (record.verified !== true) {
        throw new EmailIdentityError(EmailIdentityRefusal.NOT_VERIFIED,
            'This email has not been verified. Enter the code we sent you before accepting the Terms of Service.');
    }
    return { email: normalized };
}
