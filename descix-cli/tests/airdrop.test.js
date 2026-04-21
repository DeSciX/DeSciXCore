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
 *  - satisfies `loadCredentials()` + `hasCredentials()` (auth-guard shortcut)
 *  - records `invoke()` calls (command + params)
 *  - returns scripted responses per command
 */
function makeFakeApiClient(scripted = {}) {
    const calls = [];
    const client = {
        _calls: calls,
        async loadCredentials() { return; },
        hasCredentials() { return true; },
        async invoke(command, params = {}) {
            calls.push({ command, params });
            const next = scripted[command];
            if (typeof next === 'function') {
                return await next(params);
            }
            if (next === undefined) {
                // default lightweight OK response used for check_staked_status
                return { status: 'OK', message: { is_staked: true, user: { email: 'admin@descix.net' } } };
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

test('executeQueue — batch-size passthrough', async () => {
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => ({
            status: 'OK',
            message: {
                batches_executed: 2,
                total_users: 50,
                per_community: { daita: 30, egpt: 20 },
                dry_run: false,
                caller: { operator_email: 'admin@descix.net', service_account: null }
            }
        })
    });

    const result = await executeQueue({ batchSize: 50, apiClient });
    assert.equal(result.total_users, 50);
    const invokeCall = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.equal(invokeCall.params.batch_size, 50, 'batch_size=50 must be in params');
    assert.equal(invokeCall.params.dry_run, undefined, 'dry_run must be absent when not provided');
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

test('executeQueue — no flags → empty params', async () => {
    const apiClient = makeFakeApiClient({
        airdrop_execute_queue: async (params) => ({
            status: 'OK',
            message: {
                batches_executed: 0,
                total_users: 0,
                per_community: {},
                dry_run: false,
                caller: { operator_email: 'admin@descix.net', service_account: null }
            }
        })
    });

    await executeQueue({ apiClient });
    const invokeCall = apiClient._calls.find(c => c.command === 'airdrop_execute_queue');
    assert.deepEqual(invokeCall.params, {}, 'empty params when no flags provided');
});
