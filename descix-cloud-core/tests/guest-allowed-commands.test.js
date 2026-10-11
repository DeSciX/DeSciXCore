/**
 * GUEST_ALLOWED_COMMANDS conformance. The list is Cloud's gate copy of each service's own
 * guestAllowed fact — where a service refuses guests (Powch submit_transaction, 401 on no
 * _descix.user.id, service 2.2.0), Cloud's list must not wave them through: a guest would pass
 * Cloud's gate only to be refused downstream, and the platform's broadcast endpoint must not be
 * reachable anonymously at ANY gate.
 *
 * Run: node --test tests/guest-allowed-commands.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUEST_ALLOWED_COMMANDS } from '../src/config.js';

test('submit_transaction is NOT guest-allowed (Powch 2.2.0 requires an authenticated caller)', () => {
    assert.ok(!GUEST_ALLOWED_COMMANDS.includes('submit_transaction'),
        'submit_transaction broadcasts through the platform RPC endpoint; both measured callers are ' +
        'signed-in flows and Powch refuses guests (401) — Cloud must refuse them at its own gate too');
});
