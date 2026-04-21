/**
 * Airdrop Commands
 *
 * Admin-facing CLI commands for WS-ADMIN-B1 airdrop migration operations.
 * Per CEO-D-MANUAL-TRIGGER-NO-CRON (2026-04-20), Cloud Scheduler cron was dropped
 * from Round B in favor of operator-invoked manual triggers via this CLI.
 *
 * Access: requires admin session (platform-admin group membership enforced server-side
 * in `airdrop_execute_queue` via `isPlatformAdmin(user)`). CLI-side, we require an
 * authenticated session (`requireAuth`). The server rejects non-admin users.
 *
 * Safety: the `BATCH_UPDATE_BALANCES_BROADCAST_ENABLED` flag gates the actual on-chain
 * broadcast in Powch. While that flag is false, `airdrop_execute_queue` will assemble
 * batches but the downstream Powch call returns `stopped_at_broadcast_boundary` —
 * useful for verifying queue assembly without spending MATIC.
 */

import chalk from 'chalk';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';

/**
 * Execute the airdrop migration batch queue on the target environment.
 *
 * @param {Object} options
 * @param {number} [options.batchSize] - Optional cap on number of users processed this run.
 *   Server-side cap `AIRDROP_MAX_RUN_USERS` still applies (this cannot exceed it).
 * @param {boolean} [options.dryRun] - If true, assembles batches but skips the broadcast
 *   call entirely. No on_chain_log `status: broadcast` row — emits `status: dry_run` instead.
 * @param {Object} [options.apiClient] - Optional injected API client (for tests).
 */
export async function executeQueue(options) {
    const apiClient = options.apiClient || new DeSciXApiClient();
    await requireAuth(apiClient);

    const params = {};
    if (options.batchSize !== undefined && options.batchSize !== null) {
        const bs = Number(options.batchSize);
        if (!Number.isFinite(bs) || bs <= 0) {
            throw new Error(`--batch-size must be a positive integer, got: ${options.batchSize}`);
        }
        params.batch_size = bs;
    }
    if (options.dryRun) {
        params.dry_run = true;
    }

    const envLabel = process.env.DESCIX_API_URL || '(workspace default)';
    const mode = options.dryRun ? chalk.yellow('DRY-RUN') : chalk.green('EXECUTE');
    console.log(chalk.cyan(`\nairdrop execute-queue [${mode}] target=${envLabel}`));
    if (params.batch_size) {
        console.log(chalk.gray(`  batch_size: ${params.batch_size}`));
    }
    console.log('');

    let response;
    try {
        response = await apiClient.invoke('airdrop_execute_queue', params);
    } catch (error) {
        // Auth/permission errors surface as HTTP-level failures with readable messages.
        console.error(chalk.red(`\nairdrop_execute_queue failed: ${error.message}\n`));
        if (/platform-admin|service-account/i.test(error.message)) {
            console.error(chalk.gray('  This command requires a platform-admin account.'));
            console.error(chalk.gray('  Verify your membership in the DESCIX_ADMIN_GROUP Google Group.\n'));
        }
        throw error;
    }

    const result = response?.message || response;
    if (!result || typeof result !== 'object') {
        throw new Error('airdrop_execute_queue returned no result');
    }

    console.log(chalk.bold('Result:'));
    console.log(`  batches_executed: ${chalk.yellow(result.batches_executed ?? 0)}`);
    console.log(`  total_users:      ${chalk.yellow(result.total_users ?? 0)}`);
    console.log(`  dry_run:          ${result.dry_run ? chalk.yellow('true') : chalk.gray('false')}`);

    const perCommunity = result.per_community || {};
    const communityKeys = Object.keys(perCommunity);
    if (communityKeys.length) {
        console.log(`  per_community:`);
        for (const cid of communityKeys) {
            console.log(`    ${cid}: ${perCommunity[cid]}`);
        }
    } else {
        console.log(`  per_community:    ${chalk.gray('{}')}`);
    }

    if (result.caller) {
        const who = result.caller.operator_email || result.caller.service_account || '(unknown)';
        console.log(chalk.gray(`  caller:           ${who}`));
    }

    console.log('');
    if (options.dryRun) {
        console.log(chalk.gray('Dry-run complete. No broadcast attempted. No on_chain_log broadcast row written.'));
    } else {
        console.log(chalk.gray('Queue run complete. See on_chain_log for the trigger audit row.'));
    }
    console.log('');
    return result;
}

export default { executeQueue };
