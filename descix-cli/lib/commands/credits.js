/**
 * Credits Commands — platform-wide USD AI credits (WS-HEADLESS-MVP-A2, CEO-D-2026-07-01 D2).
 *
 * `descix credits balance | history | buy | grant | refund` over the backend commands
 * get_credit_balance / get_credit_history / create_stripe_checkout_session
 * (purchase_type:'ai_credits') / grant_credits / refund_credits.
 *
 * Credits are the metered AI-consumption balance (RAG chat / agents debit it per call).
 * They are NOT community tokens — token purchases live under `descix buy`.
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

/** Start a Stripe checkout to buy AI credits. Prints the checkout URL. */
export async function buyCredits(options) {
    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);
    const usd = parseFloat(options.usd);
    if (!Number.isFinite(usd) || usd <= 0) {
        console.error(chalk.red('A positive --usd amount is required.'));
        throw new Error('invalid --usd');
    }
    // success/cancel URLs: platform site (informational landing; settlement is webhook-driven).
    // The landing page belongs to the SAME deployment the checkout session is created against.
    // Hardcoding the production origin sent a DEV purchase's success/cancel links to prod.
    const base = options.returnBase || apiClient.baseUrl;
    const result = unwrap(await apiClient.invoke('create_stripe_checkout_session', {
        amount_usd: usd,
        purchase_type: 'ai_credits',
        success_url: `${base}/?credits_purchase=success`,
        cancel_url: `${base}/?credits_purchase=cancelled`,
    }));
    if (!result?.checkoutUrl) throw new Error('No checkout URL returned');
    console.log(chalk.green('\n✓ Stripe checkout session created.'));
    console.log(chalk.bold('\nComplete your purchase here:'));
    console.log(`  ${chalk.cyan(result.checkoutUrl)}`);
    console.log(chalk.dim(`\n  Session: ${result.sessionId}`));
    console.log(chalk.dim('  Credits are added automatically once payment completes (webhook settlement).'));
    console.log(`  Check with: ${chalk.cyan('descix credits balance')}`);
    return result;
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
