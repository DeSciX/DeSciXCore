/**
 * @descix/platform-api - Email Verification Auth
 *
 * Email-based verification code flow shared between Cloud and Powch microservices.
 * Generates codes, stores hashed values in Firestore, sends via Gmail.
 *
 * Config values loaded at call time via getCloudConfig() from @descix/cloud-core.
 *
 * Local code sink: on a developer machine only, sendEmailVerification ALSO appends the plain code
 * to the JSON-lines file named by LOCAL_VERIFICATION_CODE_SINK, so a local end-to-end spec can
 * complete email verification without a mailbox. The key is a cloud-core local-only key
 * (config-schema.json local_only_keys): admitted only from dev-overrides.json when
 * isManagedCloudRuntime is false, and refused at boot everywhere else.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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

/** The config key naming the local code sink file (a cloud-core local-only key). */
export const LOCAL_VERIFICATION_CODE_SINK_KEY = 'LOCAL_VERIFICATION_CODE_SINK';

/**
 * The local code sink path of this process, or null when it has none. Throws when the key is set
 * on a managed cloud runtime (cloud-core refuses that config at boot; reaching here means the
 * refusal was bypassed) or is not an absolute path. Resolved BEFORE any side effect of a send.
 */
function localVerificationCodeSink(utils) {
    const sinkPath = utils[LOCAL_VERIFICATION_CODE_SINK_KEY];
    if (sinkPath === undefined || sinkPath === null) return null;
    if (utils.isManagedCloudRuntime !== false) {
        throw new Error(`${LOCAL_VERIFICATION_CODE_SINK_KEY} is set but this process is not on a developer machine ` +
            `(isManagedCloudRuntime=${utils.isManagedCloudRuntime}); refusing to send a verification code.`);
    }
    if (typeof sinkPath !== 'string' || !path.isAbsolute(sinkPath)) {
        throw new Error(`${LOCAL_VERIFICATION_CODE_SINK_KEY} must be an absolute file path (dev-overrides.json); ` +
            `got ${JSON.stringify(sinkPath)}.`);
    }
    return sinkPath;
}

/**
 * Append one sent code to the local code sink at `sinkPath` (from localVerificationCodeSink).
 * The file is created by this function with mode 600 (parent directories 700); an existing file
 * readable by group or other is refused, never silently used. The code is never logged.
 *
 * Line contract (JSON, one object per line):
 *   { email, code, requested_by, expires_at, timestamp }
 *   email        normalized address (the EMAIL_VERIFICATIONS doc id)
 *   code         the plain 6-digit code verifyEmailCode accepts
 *   requested_by the requesting account's uid, or null for an account-less send
 *   expires_at   ISO-8601 expiry of the code
 *   timestamp    ISO-8601 time the line was written
 * The newest line for an email is the live code: every send replaces the stored hash.
 */
function writeLocalVerificationCode(sinkPath, { email, code, uid, expiresAt }) {
    fs.mkdirSync(path.dirname(sinkPath), { recursive: true, mode: 0o700 });
    const fd = fs.openSync(sinkPath, 'a', 0o600);
    try {
        const mode = fs.fstatSync(fd).mode & 0o777;
        if (mode & 0o077) {
            throw new Error(`${LOCAL_VERIFICATION_CODE_SINK_KEY} file ${sinkPath} has mode ${mode.toString(8)}; ` +
                'it must be 600. Delete it and let the sink create it.');
        }
        fs.writeSync(fd, JSON.stringify({
            email,
            code,
            requested_by: uid,
            expires_at: expiresAt.toISOString(),
            timestamp: new Date().toISOString(),
        }) + '\n');
    } finally {
        fs.closeSync(fd);
    }
}

/**
 * Send an email verification code to the given address.
 * Generates a 6-digit code, hashes and stores it in Firestore, then emails it; on a developer
 * machine with LOCAL_VERIFICATION_CODE_SINK set, also appends it to the local code sink.
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

    const sinkPath = localVerificationCodeSink(utils);

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

    if (sinkPath) writeLocalVerificationCode(sinkPath, { email: normalized, code, uid, expiresAt: expiresAt.toDate() });

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
