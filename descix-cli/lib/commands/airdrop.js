/**
 * Airdrop Commands
 *
 * Admin-facing CLI commands for WS-ADMIN-B1 airdrop migration operations.
 * Per CEO-D-MANUAL-TRIGGER-NO-CRON (2026-04-20), Cloud Scheduler cron was dropped
 * from Round B in favor of operator-invoked manual triggers via this CLI.
 *
 * Per CEO-D-B1-FIX-DESIGN-LOCK (2026-04-28), the CLI signature is:
 *   descix airdrop execute-queue --community <slug> [--dry-run | --signer-pk-file <path> --apply]
 *
 *   --community <slug>      REQUIRED for --apply mode (per-community batch scoping). Optional
 *                           in --dry-run mode (returns aggregate-across-communities preview).
 *   --dry-run               Read-only preview path. No PK prompt. No tx. No state mutation.
 *   --apply                 Live execution path. Requires --signer-pk-file or interactive
 *                           prompt-password. Mutually exclusive with --dry-run.
 *   --signer-pk-file <path> File containing the admin's per-invocation signer PK (0x + 64 hex,
 *                           one line). Inline --signer-pk and env vars REJECTED on security
 *                           grounds (process listing leak).
 *
 * Access: requires admin session (platform-admin group membership enforced server-side
 * in `airdrop_execute_queue` via `isPlatformAdmin(user)`). CLI-side, we require an
 * authenticated session (`requireAuth`). The server rejects non-admin users.
 *
 * Safety: the `BATCH_UPDATE_BALANCES_BROADCAST_ENABLED` flag gates the actual on-chain
 * broadcast in Powch. While that flag is false, `airdrop_execute_queue --apply` will assemble
 * batches but Powch returns `stopped_at_broadcast_boundary` — useful for verifying queue
 * assembly without spending MATIC.
 */

import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';

const PK_REGEX = /^0x[a-fA-F0-9]{64}$/;

/**
 * Read a signer PK from a file. Validates 0x + 64-hex format. Trims trailing whitespace
 * and a trailing newline only — does NOT mutate any other formatting.
 *
 * @param {string} path - Filesystem path to the PK file.
 * @returns {string} Validated PK in `0x` + 64 hex form.
 * @throws {Error} If the file is missing or contents are malformed.
 */
export function readSignerPkFromFile(path) {
    let raw;
    try {
        raw = fs.readFileSync(path, 'utf8');
    } catch (e) {
        throw new Error(`--signer-pk-file: cannot read ${path}: ${e.message}`);
    }
    const trimmed = raw.trim();
    if (!PK_REGEX.test(trimmed)) {
        // CRITICAL: do not echo the contents (even partial) into the error message.
        throw new Error(`--signer-pk-file: contents do not match expected 0x + 64 hex format`);
    }
    return trimmed;
}

/**
 * Interactive password prompt (no echo). Reads a line of stdin with terminal echo disabled
 * so the typed PK never appears on screen. Validates 0x + 64-hex format.
 *
 * @returns {Promise<string>} Validated PK in `0x` + 64 hex form.
 */
export async function promptSignerPkInteractive({ stdin = process.stdin, stdout = process.stdout } = {}) {
    return await new Promise((resolve, reject) => {
        const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });
        // Disable echo so the PK isn't visible while typing.
        const originalWrite = stdout.write.bind(stdout);
        stdout.write = (str, ...rest) => {
            // Suppress only the echoed characters during the prompt; allow our prompt to render.
            if (typeof str === 'string' && str.length === 1) return true;
            return originalWrite(str, ...rest);
        };
        stdout.write('Enter signer PK (0x + 64 hex, will not be echoed): ');
        rl.question('', (answer) => {
            stdout.write = originalWrite;
            stdout.write('\n');
            rl.close();
            const trimmed = (answer || '').trim();
            if (!PK_REGEX.test(trimmed)) {
                reject(new Error('prompt-password: input does not match expected 0x + 64 hex format'));
                return;
            }
            resolve(trimmed);
        });
    });
}

/**
 * Execute the airdrop migration batch queue on the target environment.
 *
 * @param {Object} options
 * @param {string} [options.community] - Community slug for per-community batch scoping.
 *   REQUIRED for --apply mode; optional for --dry-run mode (omitted = aggregate preview).
 * @param {boolean} [options.dryRun] - If true, read-only preview path. Mutually exclusive with --apply.
 * @param {boolean} [options.apply] - If true, live execution path. Requires --signer-pk-file or
 *   interactive prompt-password. Mutually exclusive with --dry-run.
 * @param {string} [options.signerPkFile] - Path to file containing the admin's signer PK.
 * @param {number} [options.batchSize] - Optional cap on number of users processed this run.
 * @param {Object} [options.apiClient] - Optional injected API client (for tests).
 * @param {Function} [options.promptFn] - Optional injected interactive PK prompt (for tests).
 */
export async function executeQueue(options) {
    const apiClient = options.apiClient || new DeSciXApiClient();
    await requireAuth(apiClient);

    // Mode resolution: --dry-run and --apply are mutually exclusive. Default is dry-run when
    // no --apply is provided (read-only is the safer default per CEO-D-B1-FIX-DESIGN-LOCK §4.A).
    if (options.dryRun && options.apply) {
        throw new Error('--dry-run and --apply are mutually exclusive (CEO-D-B1-FIX-DESIGN-LOCK Decision 1).');
    }
    const isDryRun = options.dryRun === true || (!options.apply && options.dryRun !== false);
    const isApply = options.apply === true;

    if (isApply && !options.community) {
        throw new Error('--community <slug> is required for --apply mode (per-community batch scoping per CEO-D-B1-FIX-DESIGN-LOCK Decision 3).');
    }

    // Resolve signer PK for --apply mode: --signer-pk-file (default) or interactive prompt fallback.
    let signerPkHex = null;
    if (isApply) {
        if (options.signerPkFile) {
            signerPkHex = readSignerPkFromFile(options.signerPkFile);
        } else {
            const promptFn = options.promptFn || promptSignerPkInteractive;
            signerPkHex = await promptFn();
        }
    }

    const params = {};
    if (options.community) params.community = options.community;
    params.mode = isApply ? 'apply' : 'dry-run';
    if (signerPkHex) params.signer_pk_hex = signerPkHex;
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
    const mode = isApply ? chalk.green('APPLY') : chalk.yellow('DRY-RUN');
    console.log(chalk.cyan(`\nairdrop execute-queue [${mode}] target=${envLabel}`));
    if (options.community) {
        console.log(chalk.gray(`  community:        ${options.community}`));
    }
    if (params.batch_size) {
        console.log(chalk.gray(`  batch_size:       ${params.batch_size}`));
    }
    if (signerPkHex) {
        // Just confirm a PK is loaded; never echo any portion of it.
        console.log(chalk.gray(`  signer_pk:        loaded (0x${signerPkHex.slice(2,6)}…${signerPkHex.slice(-4)})`));
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
    } finally {
        // Belt-and-suspenders: clear local PK var after the single use. We deliberately
        // do NOT mutate `params.signer_pk_hex` here because the api-client/axios layer may
        // still be serializing the body, and modern axios keeps no reference after the
        // request resolves anyway. The local var nulling is the meaningful action.
        signerPkHex = null;
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
        console.log(`  debit_total:              ${result.debit_total}`);
        console.log(`  credit_total:             ${result.credit_total}`);
        console.log(`  bonus_total:              ${result.bonus_total}`);
        const nz = result.net_zero_assertion || {};
        const nzLabel = nz.passes ? chalk.green('PASS') : chalk.red('FAIL');
        console.log(`  net_zero_assertion:       ${nzLabel} (Σ=${nz.sum})`);
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
        console.log(chalk.gray('No PK supplied. No tx submitted. No DB rows mutated.'));
        console.log(chalk.gray('Re-run with --apply --signer-pk-file <path> to commit.'));
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
    if (isApply) {
        console.log(chalk.gray('Apply complete. See on_chain_log for the trigger audit row.'));
    } else {
        console.log(chalk.gray('Dry-run complete. No broadcast attempted. No on_chain_log broadcast row written.'));
    }
    console.log('');
    return result;
}

export default { executeQueue, readSignerPkFromFile, promptSignerPkInteractive };
