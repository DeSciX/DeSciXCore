/**
 * User.recovery_confirmed_at — the wallet cold-storage backup confirmation (design 2026-10-23),
 * owned by the User model: confirmRecovery() writes it (ISO string), from_firestore() hydrates it,
 * hasConfirmedRecovery() reads it. A failed USERS write fails loud.
 *
 * Firestore is an in-memory fake standing in for CacheFirestore. Nothing leaves the process.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/user-recovery-confirmed-owner.test.js
 */
import { test, mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const real = await import('@descix/cloud-core');

const store = new Map();
let failWrites = false;
const coll = (p) => { if (!store.has(p)) store.set(p, new Map()); return store.get(p); };

class FakeCacheFirestore {
    async put_doc(p, id, data) { const c = coll(p); c.set(id, { ...(c.get(id) || {}), ...data }); return true; }
    async get_doc(p, id) { const d = coll(p).get(id); return d ? { ...d } : null; }
    async update_doc_fields(p, id, updates) {
        if (failWrites) return false;
        const c = coll(p); c.set(id, { ...(c.get(id) || {}), ...updates }); return true;
    }
    async delete_doc(p, id) { coll(p).delete(id); return true; }
}

mock.module('@descix/cloud-core', { namedExports: { ...real, CacheFirestore: FakeCacheFirestore } });

let User;
before(async () => { ({ User } = await import('../src/models/index.js')); });

const USERS = () => coll(real.FirestoreCollections.USERS());
const UID = 'cred_print_wallet';

beforeEach(() => {
    store.clear();
    failWrites = false;
    USERS().set(UID, { id: UID, email: null });
});

test('an account that never confirmed loads with recovery_confirmed_at null and hasConfirmedRecovery() false', async () => {
    const u = await User.from_firestore(UID);
    assert.equal(u.recovery_confirmed_at, null);
    assert.equal(u.hasConfirmedRecovery(), false);
});

test('confirmRecovery() stores an ISO string on the USERS doc and from_firestore() hydrates it', async () => {
    const u = await User.from_firestore(UID);
    const at = await u.confirmRecovery();
    assert.match(at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.equal(USERS().get(UID).recovery_confirmed_at, at);
    assert.equal(u.hasConfirmedRecovery(), true);
    const reloaded = await User.from_firestore(UID);
    assert.equal(reloaded.recovery_confirmed_at, at);
    assert.equal(reloaded.hasConfirmedRecovery(), true);
});

test('confirmRecovery() fails loud when the USERS write fails, and the instance stays unconfirmed', async () => {
    const u = await User.from_firestore(UID);
    failWrites = true;
    await assert.rejects(() => u.confirmRecovery(), /recovery_confirmed_at was not stored/);
    assert.equal(u.hasConfirmedRecovery(), false);
    assert.equal(USERS().get(UID).recovery_confirmed_at, undefined);
});
