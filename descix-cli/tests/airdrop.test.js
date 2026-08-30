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
                bonus_total: '0',
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
// WS-ADMIN-B1-FIX (CEO-D-B1-FIX-DESIGN-LOCK 2026-04-28) — code-only split round.
// New tests for: --community, --dry-run, --apply, --signer-pk-file, prompt-password.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import os from 'os';
import path from 'path';
import { readSignerPkFromFile, promptSignerPkInteractive } from '../lib/commands/airdrop.js';

test('readSignerPkFromFile — accepts well-formed 0x + 64 hex', () => {
    const tmp = path.join(os.tmpdir(), `pk-test-${Date.now()}.txt`);
    fs.writeFileSync(tmp, '0x' + 'a'.repeat(64) + '\n');
    try {
        const pk = readSignerPkFromFile(tmp);
        assert.equal(pk, '0x' + 'a'.repeat(64));
    } finally {
        fs.unlinkSync(tmp);
    }
});

test('readSignerPkFromFile — rejects malformed key (no PK echo in error)', () => {
    const tmp = path.join(os.tmpdir(), `pk-test-bad-${Date.now()}.txt`);
    fs.writeFileSync(tmp, 'not-a-valid-pk');
    try {
        let err;
        try { readSignerPkFromFile(tmp); } catch (e) { err = e; }
        assert.ok(err, 'must throw');
        assert.match(err.message, /do not match expected 0x \+ 64 hex format/);
        // CRITICAL: error message must NOT echo the contents.
        assert.ok(!err.message.includes('not-a-valid-pk'), 'error must not leak contents');
    } finally {
        fs.unlinkSync(tmp);
    }
});

test('readSignerPkFromFile — rejects too-short hex', () => {
    const tmp = path.join(os.tmpdir(), `pk-test-short-${Date.now()}.txt`);
    fs.writeFileSync(tmp, '0x' + 'a'.repeat(63));
    try {
        assert.throws(
            () => readSignerPkFromFile(tmp),
            /do not match expected 0x \+ 64 hex format/
        );
    } finally {
        fs.unlinkSync(tmp);
    }
});

test('executeQueue — --dry-run + --apply mutually exclusive', async () => {
    const apiClient = makeFakeApiClient({});
    await assert.rejects(
        () => executeQueue({ dryRun: true, apply: true, apiClient }),
        /mutually exclusive/
    );
    // No invoke call to airdrop_execute_queue.
    const calls = apiClient._calls.filter(c => c.command === 'airdrop_execute_queue');
    assert.equal(calls.length, 0);
});

test('executeQueue — --apply without --community throws', async () => {
    const apiClient = makeFakeApiClient({});
    // Use a stub promptFn so it doesn't try to read stdin.
    await assert.rejects(
        () => executeQueue({
            apply: true,
            signerPkFile: '/nonexistent/should/not/be/read',
            apiClient
        }),
        /--community <slug> is required/
    );
});

test('executeQueue — --apply with --community + --signer-pk-file forwards signer_pk_hex to server', async () => {
    const tmp = path.join(os.tmpdir(), `pk-test-apply-${Date.now()}.txt`);
    fs.writeFileSync(tmp, '0x' + 'c'.repeat(64));
    try {
        const apiClient = makeFakeApiClient({
            airdrop_execute_queue: async (params) => ({
                status: 'OK',
                message: {
                    batches_executed: 1,
                    total_users: 2,
                    per_community: { sml: 2 },
                    dry_run: false,
                    caller: { operator_email: 'admin@descix.net' }
                }
            })
        });

        await executeQueue({
            apply: true,
            community: 'sml',
            signerPkFile: tmp,
            apiClient
        });

        const call = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
        assert.ok(call, 'invoked');
        assert.equal(call.params.community, 'sml');
        assert.equal(call.params.mode, 'apply');
        assert.equal(call.params.signer_pk_hex, '0x' + 'c'.repeat(64));
    } finally {
        fs.unlinkSync(tmp);
    }
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
                bonus_total: '0',
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

test('executeQueue — --apply without --signer-pk-file falls back to interactive prompt', async () => {
    let promptCalled = false;
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => ({
            status: 'OK',
            message: {
                batches_executed: 0,
                total_users: 0,
                per_community: {},
                dry_run: false,
                caller: { operator_email: 'admin@descix.net' }
            }
        })
    });

    await executeQueue({
        apply: true,
        community: 'sml',
        apiClient,
        promptFn: async () => {
            promptCalled = true;
            return '0x' + 'd'.repeat(64);
        }
    });

    assert.equal(promptCalled, true, 'apply without --signer-pk-file must call promptFn fallback');
    const call = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.equal(call.params.signer_pk_hex, '0x' + 'd'.repeat(64));
});
