/**
 * Unit tests for `descix airdrop execute-queue` CLI command.
 *
 * Coverage:
 *  - Dry-run path: invokes `airdrop_execute_queue` with `{dry_run: true}`, renders result.
 *  - Batch-size passthrough: `--batch-size 50` → params.batch_size=50.
 *  - Batch-size validation: non-positive values throw before invoke.
 *  - Admin-auth rejection: server-side permission error is surfaced clearly.
 *
 * Run: `node --test tests/airdrop.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeQueue } from '../lib/commands/airdrop.js';

/**
 * Minimal fake API client that:
 *  - satisfies `ensureInitialized()` + `loadCredentials()` + `hasCredentials()` (auth-guard)
 *  - records `invoke()` calls (command + params)
 *  - returns scripted responses per command
 *
 * `ensureInitialized` was ADDED to this double on 2026-08-30, when requireAuth() began settling
 * and PRINTING the origin before the credential check (contract I1, A'). The double had drifted
 * from the interface it stands in for, and the honest repair is to complete the double — NOT to
 * make requireAuth() call the method only if it happens to exist. A guard that tiptoes around a
 * missing method would also tiptoe around a REAL client that stopped providing it, which is the
 * silent-success class this whole contract exists to remove.
 */
function makeFakeApiClient(scripted = {}) {
    const calls = [];
    const client = {
        _calls: calls,
        async ensureInitialized() { return; },
        async loadCredentials() { return; },
        hasCredentials() { return true; },
        async invoke(command, params = {}) {
            calls.push({ command, params });
            const next = scripted[command];
            if (typeof next === 'function') {
                return await next(params);
            }
            if (next === undefined) {
                // default lightweight OK response used for validate_session
                // (session-validity probe — mirrors the handler shape:
                //  reason marks the session valid, no staking semantics)
                return { status: 'OK', message: { reason: 'session_valid', user: { email: 'admin@descix.net' } } };
            }
            return next;
        }
    };
    return client;
}

test('executeQueue — dry-run flag propagates to server params', async () => {
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => {
            return {
                status: 'OK',
                message: {
                    batches_executed: 0,
                    total_users: 0,
                    per_community: {},
                    dry_run: params.dry_run === true,
                    caller: { operator_email: 'admin@descix.net', service_account: null }
                }
            };
        }
    });

    const result = await executeQueue({ dryRun: true, apiClient });
    assert.equal(result.dry_run, true, 'dry_run flag must be returned');

    const invokeCall = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.ok(invokeCall, 'airdrop_execute_queue must be invoked');
    assert.equal(invokeCall.params.dry_run, true, 'dry_run must be true in params');
    assert.equal(invokeCall.params.batch_size, undefined, 'batch_size must be absent when not provided');
});

test('executeQueue — batch-size passthrough (with new dry-run-by-default contract)', async () => {
    // Per CEO-D-B1-FIX-DESIGN-LOCK 2026-04-28: --batch-size with no --apply defaults to
    // dry-run mode (read-only is the safe default).
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => ({
            status: 'OK',
            message: {
                mode: 'dry-run',
                community: null,
                token_symbol: null,
                token_contract_address: null,
                transfers_total: 50,
                debit_total: '0',
                credit_total: '0',
                net_zero_assertion: { passes: true, sum: '0' },
                unique_source_wallets: 0,
                unique_master_wallets: 0,
                prospective_batch_id: 'aeq-all-x',
                gas_estimate: { units: 0 },
                eta: {},
                caller: { operator_email: 'admin@descix.net', service_account: null }
            }
        })
    });

    await executeQueue({ batchSize: 50, apiClient });
    const invokeCall = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.equal(invokeCall.params.batch_size, 50, 'batch_size=50 must be in params');
    assert.equal(invokeCall.params.mode, 'dry-run', 'defaults to dry-run mode');
    assert.equal(invokeCall.params.signer_pk_hex, undefined, 'no signer_pk_hex without --apply');
});

test('executeQueue — rejects non-positive batch-size locally (no server call)', async () => {
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async () => {
            throw new Error('should not be called');
        }
    });

    await assert.rejects(
        () => executeQueue({ batchSize: '0', apiClient }),
        /--batch-size must be a positive integer/,
        '0 must be rejected before server invoke'
    );

    await assert.rejects(
        () => executeQueue({ batchSize: 'abc', apiClient }),
        /--batch-size must be a positive integer/,
        'non-numeric must be rejected before server invoke'
    );

    // Ensure airdrop_execute_queue was never invoked
    const airdropCalls = apiClient._calls.filter(c => c.command === 'airdrop_execute_queue');
    assert.equal(airdropCalls.length, 0, 'no server invoke on invalid batch-size');
});

test('executeQueue — surfaces admin-permission rejection clearly', async () => {
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async () => {
            throw new Error('airdrop_execute_queue requires platform-admin for user-session invocation.');
        }
    });

    await assert.rejects(
        () => executeQueue({ dryRun: true, apiClient }),
        /platform-admin/,
        'admin rejection must propagate to the caller'
    );
});

test('executeQueue — no flags → defaults to dry-run mode (CEO-D-B1-FIX-DESIGN-LOCK 2026-04-28)', async () => {
    // Per the post-design-lock contract: invoking with no flags is read-only by default
    // (dry-run is the safe default; --apply is opt-in). This supersedes the pre-fix
    // contract where no flags meant "execute live with no broadcast".
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => ({
            status: 'OK',
            message: {
                batches_executed: 0,
                total_users: 0,
                per_community: {},
                dry_run: true,
                mode: 'dry-run',
                caller: { operator_email: 'admin@descix.net', service_account: null }
            }
        })
    });

    await executeQueue({ apiClient });
    const invokeCall = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.equal(invokeCall.params.mode, 'dry-run', 'defaults to dry-run mode when no flags');
    assert.equal(invokeCall.params.signer_pk_hex, undefined, 'no signer_pk_hex without --apply');
});

// ─────────────────────────────────────────────────────────────────────────────
// SML STRIKE (CEO 2026-10-10, Unkamon#11; daita-sam M2 envelope constraint 6): the apply leg
// (admin PK forwarded through the server) is REMOVED, CLI and server both. The CLI refuses any
// apply-shaped invocation naming daita-sam, and no PK helper exists to read or prompt one.
// ─────────────────────────────────────────────────────────────────────────────

test('executeQueue — the struck apply leg refuses loudly, naming daita-sam, before any server call', async () => {
    const apiClient = makeFakeApiClient();
    await assert.rejects(
        () => executeQueue({ apply: true, community: 'sml', apiClient }),
        /DRY-RUN ONLY.*daita-sam/s
    );
    await assert.rejects(
        () => executeQueue({ signerPkFile: '/nonexistent/never/read', apiClient }),
        /DRY-RUN ONLY.*daita-sam/s
    );
    assert.equal(apiClient._calls.length, 0, 'a refused apply call must never reach the server');
});

test('executeQueue — the PK helpers are gone from the module surface', async () => {
    const mod = await import('../lib/commands/airdrop.js');
    assert.equal(mod.readSignerPkFromFile, undefined);
    assert.equal(mod.promptSignerPkInteractive, undefined);
});

test('executeQueue — --dry-run with --community does NOT prompt and does NOT include signer_pk_hex', async () => {
    let promptCalled = false;
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => ({
            status: 'OK',
            message: {
                mode: 'dry-run',
                community: 'sml',
                token_symbol: 'SML',
                token_contract_address: '0x18ba…',
                transfers_total: 0,
                debit_total: '0',
                credit_total: '0',
                net_zero_assertion: { passes: true, sum: '0' },
                unique_source_wallets: 0,
                unique_master_wallets: 0,
                prospective_batch_id: 'aeq-sml-x',
                gas_estimate: { units: 0, gas_price_gwei: '0', matic_cost_estimate: '0', rpc_source: 'polygon-url' },
                eta: { block_time_seconds: 2, confirmation_target_blocks: 5, wall_clock_seconds_estimate: 10 }
            }
        })
    });

    const result = await executeQueue({
        dryRun: true,
        community: 'sml',
        apiClient,
        promptFn: async () => { promptCalled = true; return '0x' + 'a'.repeat(64); }
    });

    assert.equal(promptCalled, false, 'dry-run must NOT prompt for PK');
    const call = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.equal(call.params.signer_pk_hex, undefined, 'no signer_pk_hex in dry-run params');
    assert.equal(call.params.mode, 'dry-run');
    assert.equal(call.params.community, 'sml');
    assert.equal(result.mode, 'dry-run');
});

test('executeQueue — dry-run prints the pre-batch balance refusals an execute would enforce', async () => {
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async () => ({
            status: 'OK',
            message: {
                mode: 'dry-run', community: 'daita', transfers_total: 2, batches_total: 1,
                debit_total: '-50', credit_total: '50', net_zero_assertion: { passes: true, sum: '0' },
                pre_batch_checks: {
                    passes: false,
                    refusals: [{ kind: 'source', wallet: '0xsrc', community_id: 'daita', required: '50', held: '0', pending_ids: ['mig-u1-1-daita'] }],
                    treasuries: [], sources: []
                },
                unique_source_wallets: 1, unique_master_wallets: 1, prospective_batch_id: 'aeq-daita-x',
                gas_estimate: null, eta: null, caller: { operator_email: 'admin@descix.net', service_account: null }
            }
        })
    });
    const lines = [];
    const orig = console.log;
    console.log = (...a) => { lines.push(a.join(' ')); };
    try {
        await executeQueue({ community: 'daita', dryRun: true, apiClient });
    } finally {
        console.log = orig;
    }
    const out = lines.join('\n');
    assert.match(out, /pre_batch_checks:.*FAIL/);
    assert.match(out, /source 0xsrc .*needs 50.*mig-u1-1-daita/);
});
