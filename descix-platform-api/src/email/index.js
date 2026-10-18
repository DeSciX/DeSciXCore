/**
 * @descix/platform-api - Email Infrastructure
 *
 * Gmail API email sending using service account with domain-wide delegation.
 * Used by both DeSciX_Cloud and DeSciX_Powch microservices.
 *
 * Config values are loaded at call time via getCloudConfig() from @descix/cloud-core.
 * All config must be bootstrapped before calling any function here.
 */

import { google } from 'googleapis';
import { getCloudConfig } from '@descix/cloud-core';

/**
 * Base64 URL encode helper for Gmail API message encoding
 * @param {string} input - Input string to encode
 * @returns {string} Base64 URL-encoded string
 */
export function base64UrlEncode(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Normalize email address (trim and lowercase)
 * @param {string} email - Email address to normalize
 * @returns {string|null} Normalized email or null if invalid
 */
export function normalizeEmail(email) {
    return email ? email.trim().toLowerCase() : null;
}

/**
 * An address masked for display to someone who is not its owner: the first character of the
 * local part, then '***', then the domain ('b***@example.com'). Null for a non-address.
 * @param {*} email
 * @returns {string|null}
 */
export function maskEmail(email) {
    if (!isValidEmail(email)) return null;
    const [local, domain] = normalizeEmail(email).split('@');
    return `${local[0]}***@${domain}`;
}

/**
 * Whether a value is a mailable address shape: one '@', a non-empty local part, and a dotted
 * domain, with no whitespace. Shape only — deliverability is proven by a verification code.
 * The ONE email-shape check; consumers call it rather than re-deriving `includes('@')`.
 *
 * @param {*} email - candidate address (any type; non-strings are not addresses)
 * @returns {boolean}
 */
export function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim());
}

/**
 * Core Gmail email sending function using service account with domain-wide delegation.
 *
 * Uses DESCIX_ROUTER_COMMUNITY_MANAGER as the impersonated user (sender).
 * Uses GMAIL_SENDER_EMAIL as the Reply-To address.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @param {string} [fromEmail] - Optional sender email (defaults to DESCIX_ROUTER_COMMUNITY_MANAGER)
 * @param {Object} [options]
 * @param {string} [options.html] - Optional HTML body (Q15, CEO word Unkamon c7bbc15). When
 *   present the message is multipart/alternative: the plain `body` is the text part, `html`
 *   the html part (last = preferred). Absent, the message is the same single-part text/plain
 *   it has always been — no existing caller changes.
 * @returns {Promise<void>}
 */
export async function sendEmail(toEmail, subject, body, fromEmail = null, { html = null } = {}) {
    const utils = getCloudConfig();

    // The sender/impersonated user - must be a real user in the domain with Gmail access
    const impersonatedUser = fromEmail || utils.DESCIX_ROUTER_COMMUNITY_MANAGER;
    // Reply-To address for user responses
    const replyToEmail = utils.GMAIL_SENDER_EMAIL || impersonatedUser;

    if (!impersonatedUser) {
        throw new Error('Email sender is not configured. Please set DESCIX_ROUTER_COMMUNITY_MANAGER in config.');
    }

    // Get service account credentials from utils (loaded from Secret Manager)
    const credentials = utils.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentials) {
        throw new Error('Service account credentials not available. Ensure elevated_credentials_descix secret is loaded.');
    }

    // Create JWT client with domain-wide delegation (impersonating the user)
    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        subject: impersonatedUser // Impersonate this user to send email
    });

    const gmail = google.gmail({ version: 'v1', auth });

    // Build the email message with Reply-To header. With `html`, multipart/alternative
    // (text part first, html part last — the alternative order of preference); without it,
    // the single-part text/plain message unchanged.
    const headers = [
        `From: DeSciX <${impersonatedUser}>`,
        `To: ${toEmail}`,
        `Reply-To: ${replyToEmail}`,
        `Subject: ${subject}`,
    ];
    let message;
    if (html) {
        const boundary = `descix-alt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        message = [
            ...headers,
            'MIME-Version: 1.0',
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            body,
            `--${boundary}`,
            'Content-Type: text/html; charset="UTF-8"',
            '',
            html,
            `--${boundary}--`
        ].join('\n');
    } else {
        message = [
            ...headers,
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            body
        ].join('\n');
    }

    const raw = base64UrlEncode(message);

    // Use impersonated user's email as userId
    try {
        await gmail.users.messages.send({
            userId: impersonatedUser,
            requestBody: { raw }
        });
        console.log(`Email sent successfully to ${toEmail} from ${impersonatedUser} (reply-to: ${replyToEmail})`);
    } catch (error) {
        console.error(`Failed to send email to ${toEmail}:`, error.message);
        if (error.code === 403 || error.message?.includes('insufficient')) {
            console.error(
                `\n⚠️  Gmail API Permission Error. Ensure:\n` +
                `   1. Domain-wide delegation is enabled for service account: ${credentials.client_email}\n` +
                `   2. Scope 'https://www.googleapis.com/auth/gmail.send' is authorized in Google Workspace Admin\n` +
                `   3. User ${impersonatedUser} exists in the domain and has Gmail access\n`
            );
        }
        throw error;
    }
}

/**
 * High-level verification email sender.
 * Sends a verification code email with standard formatting.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} code - Verification code to send
 * @param {number} [expiryMinutes=15] - Expiry time in minutes for the code
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(toEmail, code, expiryMinutes = 15) {
    const subject = 'Your DeSciX verification code';
    const body = `Your DeSciX verification code is: ${code}\n\nThis code expires in ${expiryMinutes} minutes.\nIf you did not request this, please ignore this email.`;
    await sendEmail(toEmail, subject, body);
}

/**
 * Render the receipt for a queued airdrop-wallet migration (the `pending_migrations` lane).
 *
 * Honest by construction: it names what was queued, the airdrop wallet it leaves, the DeSciX
 * wallet it lands in, and that nothing moves until the next administrative batch runs. It
 * carries no payment fields — a migration is not a purchase.
 *
 * @param {Object} migration
 * @param {string} migration.airdrop_address - Old airdrop wallet (the batch retires this balance)
 * @param {string} migration.master_wallet_address - The user's DeSciX (passkey master) wallet
 * @param {Array<{symbol: string, amount: string|number}>} migration.tokens - What was queued
 * @returns {{subject: string, body: string}}
 */
export function renderMigrationQueuedEmail({ airdrop_address, master_wallet_address, tokens }) {
    if (!airdrop_address) throw new Error('renderMigrationQueuedEmail: airdrop_address is required');
    if (!master_wallet_address) throw new Error('renderMigrationQueuedEmail: master_wallet_address is required');
    if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('renderMigrationQueuedEmail: tokens[] is required');
    for (const t of tokens) {
        if (!t?.symbol || t.amount === undefined || t.amount === null) {
            throw new Error('renderMigrationQueuedEmail: every token needs a symbol and an amount');
        }
    }

    const subject = 'Your airdrop migration is queued';
    const tokenLines = tokens.map(t => `  ${t.amount} ${t.symbol}`).join('\n');
    const body = `Hello,

Your airdropped tokens are queued to move to your DeSciX wallet.

═══════════════════════════════════════════════
MIGRATION QUEUED
═══════════════════════════════════════════════

Tokens:
${tokenLines}

From (airdrop wallet):  ${airdrop_address}
To (DeSciX wallet):     ${master_wallet_address}

═══════════════════════════════════════════════

Nothing moves yet. The transfer happens when the next administrative batch runs: that batch
retires the balance at the airdrop wallet and credits the same amount to your DeSciX wallet.
You don't need to do anything else.

If you did not request this, reply to this email.

— The DeSciX Team
`;
    return { subject, body };
}

/**
 * Send the queued-migration receipt rendered by `renderMigrationQueuedEmail`.
 *
 * @param {Object} migration - See renderMigrationQueuedEmail
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<void>}
 */
export async function sendMigrationQueued(migration, recipientEmail) {
    const { subject, body } = renderMigrationQueuedEmail(migration);
    await sendEmail(recipientEmail, subject, body);
}

