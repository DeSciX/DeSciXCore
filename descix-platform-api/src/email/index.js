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
 * Core Gmail email sending function using service account with domain-wide delegation.
 *
 * Uses DESCIX_ROUTER_COMMUNITY_MANAGER as the impersonated user (sender).
 * Uses GMAIL_SENDER_EMAIL as the Reply-To address.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @param {string} [fromEmail] - Optional sender email (defaults to DESCIX_ROUTER_COMMUNITY_MANAGER)
 * @returns {Promise<void>}
 */
export async function sendEmail(toEmail, subject, body, fromEmail = null) {
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

    // Build the email message with Reply-To header
    const message = [
        `From: DeSciX <${impersonatedUser}>`,
        `To: ${toEmail}`,
        `Reply-To: ${replyToEmail}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        body
    ].join('\n');

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
 * Send payment pending notification with deposit instructions.
 *
 * @param {Object} quote - The payment quote object
 * @param {string} quote.quote_id - Unique quote identifier
 * @param {string} quote.deposit_address - Deposit address
 * @param {string} quote.amount_formatted - Formatted amount (e.g., "0.5 ETH")
 * @param {string} quote.usd_amount_formatted - Formatted USD amount (e.g., "$10.00")
 * @param {string} quote.chain_name - Chain name (e.g., "Polygon")
 * @param {string} quote.expires_at - ISO timestamp when quote expires
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<void>}
 */
export async function sendPaymentPending(quote, recipientEmail) {
    const utils = getCloudConfig();
    const subject = `Payment Instructions - ${quote.usd_amount_formatted || `$${quote.usd_amount}`} via ${quote.chain_name || quote.chain}`;

    const expiryDate = new Date(quote.expires_at);
    const expiryStr = expiryDate.toLocaleString();

    const body = `Hello,

You've initiated a crypto payment on DeSciX. Please complete your payment using the instructions below:

═══════════════════════════════════════════════
PAYMENT DETAILS
═══════════════════════════════════════════════

Quote ID:        ${quote.quote_id}
Amount:          ${quote.amount_formatted}
USD Value:       ${quote.usd_amount_formatted || `$${quote.usd_amount}`}
Chain:           ${quote.chain_name || quote.chain?.toUpperCase()}

DEPOSIT ADDRESS:
${quote.deposit_address}

⚠️  IMPORTANT: Send exactly ${quote.amount_formatted} to the address above.
    Sending the wrong amount may result in processing issues.

Expires: ${expiryStr}

═══════════════════════════════════════════════

Once your payment is confirmed on the blockchain, we'll send you a confirmation email.

If you did not initiate this payment, please ignore this email.

— The DeSciX Team
`;

    // Send to user
    await sendEmail(recipientEmail, subject, body);

    // CC admin group if configured
    const adminGroup = utils.DESCIX_ADMIN_GROUP;
    if (adminGroup) {
        try {
            await sendEmail(adminGroup, `[ADMIN CC] ${subject}`, `Payment pending for: ${recipientEmail}\n\n${body}`);
        } catch (error) {
            console.warn(`Failed to send admin CC email: ${error.message}`);
        }
    }
}

/**
 * Send payment confirmation notification.
 *
 * @param {Object} quote - The fulfilled quote object
 * @param {string} quote.quote_id - Unique quote identifier
 * @param {string} quote.usd_amount - USD amount
 * @param {string} quote.chain - Chain identifier
 * @param {string} quote.payment_tx_hash - Transaction hash
 * @param {Object} fulfillment - Fulfillment details
 * @param {string} fulfillment.type - Fulfillment type (usdcx_credit or token_mint)
 * @param {number} [fulfillment.usdcx_credited] - USDCX amount credited
 * @param {number} [fulfillment.tokens_minted] - Tokens minted
 * @param {string} [fulfillment.token_symbol] - Token symbol
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<void>}
 */
export async function sendPaymentConfirmation(quote, fulfillment, recipientEmail) {
    const utils = getCloudConfig();
    const usdAmountFormatted = quote.usd_amount_formatted || `$${quote.usd_amount}`;
    const chainName = quote.chain_name || quote.chain?.toUpperCase();

    let subject, creditsText;

    if (fulfillment.type === 'usdcx_credit') {
        subject = `Payment Confirmed - ${usdAmountFormatted} USDCX Credited`;
        creditsText = `USDCX Credited:   ${fulfillment.usdcx_credited?.toFixed(2) || quote.usd_amount}`;
    } else if (fulfillment.type === 'token_mint') {
        subject = `Payment Confirmed - ${fulfillment.tokens_minted} ${fulfillment.token_symbol} Tokens`;
        creditsText = `Tokens Received:  ${fulfillment.tokens_minted} ${fulfillment.token_symbol}`;
    } else {
        subject = `Payment Confirmed - ${usdAmountFormatted}`;
        creditsText = `Amount:           ${usdAmountFormatted}`;
    }

    const body = `Hello,

Your crypto payment has been confirmed!

═══════════════════════════════════════════════
PAYMENT CONFIRMATION
═══════════════════════════════════════════════

Quote ID:         ${quote.quote_id}
Status:           CONFIRMED
Chain:            ${chainName}
${creditsText}

${quote.payment_tx_hash ? `Transaction:      ${quote.payment_tx_hash}` : ''}

═══════════════════════════════════════════════

Your account has been updated with the purchased credits/tokens.

Thank you for using DeSciX!

— The DeSciX Team
`;

    // Send to user
    await sendEmail(recipientEmail, subject, body);

    // CC admin group if configured
    const adminGroup = utils.DESCIX_ADMIN_GROUP;
    if (adminGroup) {
        try {
            await sendEmail(adminGroup, `[ADMIN CC] ${subject}`, `Payment confirmed for: ${recipientEmail}\n\n${body}`);
        } catch (error) {
            console.warn(`Failed to send admin CC email: ${error.message}`);
        }
    }
}
