/**
 * Credits Commands — platform-wide USD AI credits (WS-HEADLESS-MVP-A2, CEO-D-2026-07-01 D2).
 *
 * `descix credits balance | history | buy | grant | refund` over get_credit_balance /
 * get_credit_history / create_checkout_session / grant_credits / refund_credits.
 *
 * `buy` starts Powch's checkout ceremony: create_checkout_session is a Powch command that /apifront
 * proxies under the caller's identity; it returns a Stripe Checkout `url`, and the purchase settles
 * into the ledger when Powch confirms payment. The Powch Buy menu makes the same call.
 *
 * Credits are the metered AI-consumption balance (RAG chat / agents debit it per call).
 * They are NOT community tokens.
 */

import chalk from 'chalk';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';

function unwrap(response) {
    return response?.message || response;
}

/** Show the caller's AI-credits balance. */
export async function showBalance() {
    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);
    const result = unwrap(await apiClient.invoke('get_credit_balance', {}));
    console.log(chalk.bold('\nAI Credits Balance:'));
    console.log(`  Balance:            ${chalk.green(`$${Number(result.usd_balance).toFixed(2)}`)}`);
    console.log(`  Lifetime purchased: $${Number(result.lifetime_purchased_usd).toFixed(2)}`);
    console.log(`  Lifetime granted:   $${Number(result.lifetime_granted_usd).toFixed(2)}`);
    console.log(`  Lifetime used:      $${Number(result.lifetime_debited_usd).toFixed(2)}`);
    if (Number(result.usd_balance) <= 0) {
        console.log(chalk.yellow(`\n  Balance empty — metered AI calls will be rejected.`));
        console.log(`  Buy credits: ${chalk.cyan('descix credits buy --usd <amount>')}`);
    }
    const bundles = creditBundles(result);
    console.log(bundles
        ? `  Credit bundles:     ${bundles.map((usd) => `$${usd}`).join(', ')}`
        : chalk.yellow('  Credit bundles:     none listed (get_credit_balance returned no ai_credits purchase_catalogue)'));
    return result;
}

/** Show the caller's credit ledger history (newest first). */
export async function showHistory(options = {}) {
    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);
    const result = unwrap(await apiClient.invoke('get_credit_history', {
        limit: options.limit ? parseInt(options.limit, 10) : undefined,
    }));
    const entries = result.entries || [];
    console.log(chalk.bold(`\nCredit Ledger (${entries.length} entries, newest first):\n`));
    if (entries.length === 0) {
        console.log(chalk.dim('  (empty)'));
        return result;
    }
    for (const e of entries) {
        const sign = e.usd_delta >= 0 ? '+' : '';
        const amountStr = `${sign}$${Number(e.usd_delta).toFixed(4)}`;
        const amount = e.usd_delta >= 0 ? chalk.green(amountStr) : chalk.red(amountStr);
        const ts = e.ts?._seconds ? new Date(e.ts._seconds * 1000).toISOString()
            : (e.ts?.seconds ? new Date(e.ts.seconds * 1000).toISOString() : String(e.ts || ''));
        let detail = '';
        if (e.type === 'debit') {
            detail = `${e.app_id || '?'} ${e.model_used || ''} in:${e.tokens_in ?? '?'} out:${e.tokens_out ?? '?'}`;
        } else if (e.type === 'purchase') {
            detail = `${e.source || ''} ${e.payment_ref || ''}`;
        } else if (e.type === 'grant' || e.type === 'refund') {
            detail = e.reason || '';
        }
        console.log(`  ${ts}  ${e.type.padEnd(12)} ${amount.padEnd(22)} bal $${Number(e.balance_after_usd).toFixed(4)}  ${chalk.dim(detail)}`);
    }
    return result;
}

/** The purchase type `credits buy` buys (Cloud's purchase catalogue names it). */
const AI_CREDITS = 'ai_credits';

/** The listed ai_credits bundle amounts from a get_credit_balance bag, or null when none are listed. */
function creditBundles(balance) {
    const entry = Array.isArray(balance?.purchase_catalogue)
        ? balance.purchase_catalogue.find((p) => p?.purchase_type === AI_CREDITS)
        : null;
    return Array.isArray(entry?.bundles) && entry.bundles.length ? entry.bundles.map((b) => b.amount_usd) : null;
}

/** A positive USD amount, whole string or nothing: `10abc` is a typo, not $10. */
function parseUsd(raw) {
    const text = String(raw ?? '').trim();
    const usd = /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : NaN;
    if (!(usd > 0)) throw new Error(`--usd must be a positive USD amount such as 10 or 25.50 (got ${JSON.stringify(raw)})`);
    return usd;
}

/** Buy AI credits: start Powch's checkout and print the Stripe Checkout URL it returns. */
export async function buyCredits(options) {
    const usd = parseUsd(options.usd);
    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);
    const session = unwrap(await apiClient.invoke('create_checkout_session', { purchase_type: AI_CREDITS, amount_usd: usd }));
    if (!session?.url) {
        throw new Error(`create_checkout_session returned no checkout url (response keys: ${Object.keys(session || {}).join(', ') || 'none'})`);
    }
    console.log(chalk.green('\n✓ Checkout session created.'));
    console.log(chalk.bold('\nComplete your purchase here:'));
    console.log(`  ${chalk.cyan(session.url)}`);
    if (session.session_id) console.log(chalk.dim(`\n  Session: ${session.session_id}`));
    console.log(chalk.dim('  Credits are added once Powch confirms the payment.'));
    console.log(`  Check with: ${chalk.cyan('descix credits balance')}`);
    return session;
}

/** ADMIN: grant credits to a user. (target_user_id — `user_id` is middleware-reserved.) */
export async function grantCredits(options) {
    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);
    const result = unwrap(await apiClient.invoke('grant_credits', {
        target_user_id: options.user,
        usd_amount: parseFloat(options.usd),
        reason: options.reason,
    }));
    console.log(chalk.green(`\n✓ Granted $${Number(result.granted_usd).toFixed(2)} AI credits to ${result.target_user_id} (ledger ${result.entry_id}).`));
    return result;
}

/** ADMIN: refund (remove) credits from a user. */
export async function refundCredits(options) {
    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);
    const result = unwrap(await apiClient.invoke('refund_credits', {
        target_user_id: options.user,
        usd_amount: parseFloat(options.usd),
        reason: options.reason,
    }));
    console.log(chalk.green(`\n✓ Refunded $${Number(result.refunded_usd).toFixed(2)} AI credits from ${result.target_user_id} (ledger ${result.entry_id}).`));
    return result;
}
