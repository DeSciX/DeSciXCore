/**
 * Airdrop Commands — DRY-RUN ONLY.
 *
 *   descix airdrop execute-queue [--community <slug>] [--dry-run] [--batch-size <n>]
 *
 * The apply leg (an admin PK forwarded through the server to Powch's broadcast) is REMOVED,
 * CLI and server both (CEO 2026-10-10, daita-sam M2 envelope constraint 6): migration batches
 * execute in daita-sam — act plan + typed confirm + the role holder's own wallet, client-signed.
 *
 * Access: requires an authenticated session (`requireAuth`); the server additionally requires
 * platform admin for the preview.
 */

import chalk from 'chalk';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';

/**
 * Preview (dry-run) the airdrop migration batch queue on the target environment.
 *
 * @param {Object} options
 * @param {string} [options.community] - Community slug scoping the preview (omitted = aggregate).
 * @param {boolean} [options.dryRun] - Accepted for scripts; dry-run is the only mode.
 * @param {number} [options.batchSize] - Optional cap on number of users processed this run.
 * @param {Object} [options.apiClient] - Optional injected API client (for tests).
 */
export async function executeQueue(options) {
    // THE APPLY LEG IS STRUCK — refused before auth, before any network touch (CEO 2026-10-10, daita-sam M2 envelope constraint 6; the server
    // refuses it too): migration batches execute in daita-sam — act plan + the role holder's own
    // wallet signs, client-side. No PK ever transits this CLI again.
    if (options.apply || options.signerPkFile) {
        throw new Error(
            'airdrop execute-queue is DRY-RUN ONLY: the apply leg (admin PK forwarded through the ' +
            'server) is removed. Execute migration batches in daita-sam (act plan + your own wallet).'
        );
    }
    const isDryRun = true;

    const apiClient = options.apiClient || new DeSciXApiClient();
    await requireAuth(apiClient);

    const params = {};
    if (options.community) params.community = options.community;
    params.mode = 'dry-run';
    if (options.batchSize !== undefined && options.batchSize !== null) {
        const bs = Number(options.batchSize);
        if (!Number.isFinite(bs) || bs <= 0) {
            throw new Error(`--batch-size must be a positive integer, got: ${options.batchSize}`);
        }
        params.batch_size = bs;
    }
    // Legacy boolean dry_run parameter (preserved for backwards-compat with existing scripts).
    if (isDryRun && !options.community) {
        params.dry_run = true;
    }

    const envLabel = process.env.DESCIX_API_URL || '(workspace default)';
    console.log(chalk.cyan(`\nairdrop execute-queue [${chalk.yellow('DRY-RUN')}] target=${envLabel}`));
    if (options.community) {
        console.log(chalk.gray(`  community:        ${options.community}`));
    }
    if (params.batch_size) {
        console.log(chalk.gray(`  batch_size:       ${params.batch_size}`));
    }
    console.log('');

    let response;
    try {
        response = await apiClient.invoke('airdrop_execute_queue', params);
    } catch (error) {
        // Auth/permission errors surface as HTTP-level failures with readable messages.
        // CRITICAL: ensure no echo of params.signer_pk_hex into any error message we print.
        const safeMsg = String(error.message || '').replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED]');
        console.error(chalk.red(`\nairdrop_execute_queue failed: ${safeMsg}\n`));
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

    if (isDryRun && result.mode === 'dry-run') {
        // Render the §4.F dry-run summary table.
        console.log(chalk.bold('Dry-Run Summary:'));
        console.log(`  community:                ${chalk.cyan(result.community || '(all)')}`);
        if (result.token_symbol) console.log(`  token_symbol:             ${result.token_symbol}`);
        if (result.token_contract_address) console.log(`  token_contract:           ${result.token_contract_address}`);
        if (result.abi_source) console.log(`  abi_source:               ${result.abi_source.doc_id} (v${result.abi_source.version || '?'})`);
        console.log(`  transfers_total:          ${chalk.yellow(result.transfers_total)}`);
        console.log(`  batches_total:            ${result.batches_total}`);
        console.log(`  debit_total:              ${result.debit_total}`);
        console.log(`  credit_total:             ${result.credit_total}`);
        const nz = result.net_zero_assertion || {};
        const nzLabel = nz.passes ? chalk.green('PASS') : chalk.red('FAIL');
        console.log(`  net_zero_assertion:       ${nzLabel} (Σ=${nz.sum})`);
        const pbc = result.pre_batch_checks || {};
        console.log(`  pre_batch_checks:         ${pbc.passes ? chalk.green('PASS') : chalk.red('FAIL — an execute would refuse')}`);
        for (const r of (pbc.refusals || [])) {
            console.log(chalk.red(`    ${r.kind} ${r.wallet} (${r.community_id}) holds ${r.held}, needs ${r.required} base units — rows ${(r.pending_ids || []).join(', ')}`));
        }
        console.log(`  unique_source_wallets:    ${result.unique_source_wallets}`);
        console.log(`  unique_master_wallets:    ${result.unique_master_wallets}`);
        console.log(`  prospective_batch_id:     ${result.prospective_batch_id}`);
        if (result.gas_estimate) {
            console.log(`  gas_estimate:             ${result.gas_estimate.units || '?'} units @ ${result.gas_estimate.gas_price_gwei || '?'} gwei`);
            if (result.gas_estimate.matic_cost_estimate) {
                console.log(`  estimated_cost:           ~${result.gas_estimate.matic_cost_estimate} MATIC`);
            }
        }
        console.log('');
        console.log(chalk.gray('No tx submitted. No DB rows mutated.'));
        console.log(chalk.gray('To execute migration batches: daita-sam (act plan + your own wallet).'));
        console.log('');
        return result;
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
    console.log(chalk.gray('Dry-run complete. No broadcast attempted. No on_chain_log broadcast row written.'));
    console.log('');
    return result;
}

export default { executeQueue };
