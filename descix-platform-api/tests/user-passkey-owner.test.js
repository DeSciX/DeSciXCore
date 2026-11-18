/**
 * USERS.passkey: the public key a Powch account was registered with, owned by the User model.
 * createForPasskey creates the account WITH the key in one create() and refuses an existing account;
 * passkeyOf reports NOT_REGISTERED / NO_PUBLIC_KEY / REGISTERED and throws on a failed read;
 * recordPasskeyCounter stores a verified counter and throws on a failed write.
 *
 * Firestore is an in-memory fake standing in for CacheFirestore (its `.db` is a minimal Firestore with
 * create()/get() semantics). Nothing leaves the process.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/user-passkey-owner.test.js
 */
import { test, mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const real = await import('@descix/cloud-core');

const store = new Map();
let failReads = false;
let failWrites = false;
let txLock = Promise.resolve();
const coll = (p) => { if (!store.has(p)) store.set(p, new Map()); return store.get(p); };

function setPath(obj, dotted, value) {
    const keys = dotted.split('.');
    let o = obj;
    for (const k of keys.slice(0, -1)) { o[k] = { ...(o[k] || {}) }; o = o[k]; }
    o[keys.at(-1)] = value;
}

class FakeCacheFirestore {
    get db() {
        return {
            collection: (p) => ({
                doc: (id) => ({
                    async create(data) {
                        if (failWrites) throw Object.assign(new Error('UNAVAILABLE'), { code: 14 });
                        if (coll(p).has(id)) throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 });
                        coll(p).set(id, structuredClone(data));
                    },
                    async get() {
                        if (failReads) throw Object.assign(new Error('UNAVAILABLE'), { code: 14 });
                        await new Promise((r) => setImmediate(r));
                        const d = coll(p).get(id);
                        return { exists: !!d, data: () => (d ? structuredClone(d) : undefined) };
                    },
                    p, id,
                }),
            }),
            // Transactions on a document serialize (the server SDK holds what a transaction read until it commits).
            runTransaction: async (fn) => {
                const prev = txLock;
                let release;
                txLock = new Promise((r) => { release = r; });
                await prev;
                try {
                    const updates = [];
                    const out = await fn({ get: (ref) => ref.get(), update: (ref, data) => { updates.push([ref, data]); } });
                    if (failWrites && updates.length) throw Object.assign(new Error('UNAVAILABLE'), { code: 14 });
                    for (const [ref, data] of updates) {
                        const doc = structuredClone(coll(ref.p).get(ref.id));
                        for (const [k, v] of Object.entries(data)) setPath(doc, k, v);
                        coll(ref.p).set(ref.id, doc);
                    }
                    return out;
                } finally {
                    release();
                }
            },
        };
    }
    async get_doc(p, id) { const d = coll(p).get(id); return d ? structuredClone(d) : null; }
    async update_doc_fields(p, id, updates) {
        if (failWrites || !coll(p).has(id)) return false;
        const doc = structuredClone(coll(p).get(id));
        for (const [k, v] of Object.entries(updates)) setPath(doc, k, v);
        coll(p).set(id, doc);
        return true;
    }
}

mock.module('@descix/cloud-core', { namedExports: { ...real, CacheFirestore: FakeCacheFirestore } });

let User, PasskeyState, PASSKEY_FIELDS, normalizePasskey;
before(async () => {
    ({ User, PasskeyState, PASSKEY_FIELDS, normalizePasskey } = await import('../src/models/index.js'));
});

const USERS = () => coll(real.FirestoreCollections.USERS());
const CRED = 'cHJvYmUtY3JlZGVudGlhbC1pZA';
const PASSKEY = () => ({
    credential_id: CRED,
    public_key: 'pQECAyYgASFYIAbc',
    counter: 0,
    transports: ['internal', 'hybrid'],
    rp_id: 'powch.example',
    registered_at: '2026-11-11T12:00:00.000Z',
});

beforeEach(() => { store.clear(); failReads = false; failWrites = false; });

test('normalizePasskey returns every PASSKEY_FIELDS key and refuses a bag missing the public key', () => {
    assert.deepEqual(Object.keys(normalizePasskey({ ...PASSKEY(), source: 'registered' })), Object.keys(PASSKEY_FIELDS));
    const { public_key, ...noKey } = PASSKEY();
    assert.throws(() => normalizePasskey(noKey), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /public_key/.test(e.message));
});

test('normalizePasskey refuses a record with no source or an unknown one (no default); createForPasskey refuses a caller-set source', async () => {
    assert.throws(() => normalizePasskey(PASSKEY()), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /source/.test(e.message));
    assert.throws(() => normalizePasskey({ ...PASSKEY(), source: 'imported' }), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /source/.test(e.message));
    await assert.rejects(() => User.createForPasskey({ ...PASSKEY(), source: 'recovered' }), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /source/.test(e.message));
    assert.equal(USERS().has(CRED), false);
});

test('createForPasskey creates the account holding the passkey; passkeyOf reads it back REGISTERED', async () => {
    const uid = await User.createForPasskey(PASSKEY());
    assert.equal(uid, CRED);
    const doc = USERS().get(CRED);
    assert.equal(doc.id, CRED);
    assert.deepEqual(doc.user_info, { credentialId: CRED });
    assert.deepEqual(doc.auth_providers, ['powch']);
    assert.deepEqual(doc.passkey, { ...PASSKEY(), source: 'registered' });
    const r = await User.passkeyOf(CRED);
    assert.equal(r.state, PasskeyState.REGISTERED);
    assert.deepEqual(r.passkey, { ...PASSKEY(), source: 'registered' });
});

test('createForPasskey refuses an existing account and leaves it untouched (no overwrite of a key or wallet)', async () => {
    USERS().set(CRED, { id: CRED, wallet_address: '0xvictim', passkey: { ...PASSKEY(), public_key: 'b3JpZ2luYWw' } });
    const before = structuredClone(USERS().get(CRED));
    await assert.rejects(() => User.createForPasskey({ ...PASSKEY(), public_key: 'YXR0YWNrZXI' }), (e) => e.code === 'PASSKEY_ALREADY_REGISTERED');
    assert.deepEqual(USERS().get(CRED), before);
});

test('createForPasskey fails loud on a write failure and creates nothing', async () => {
    failWrites = true;
    await assert.rejects(() => User.createForPasskey(PASSKEY()), /no account was created/);
    assert.equal(USERS().has(CRED), false);
});

test('passkeyOf: no account -> NOT_REGISTERED; account without a key -> NO_PUBLIC_KEY', async () => {
    assert.equal((await User.passkeyOf(CRED)).state, PasskeyState.NOT_REGISTERED);
    USERS().set(CRED, { id: CRED, user_info: { credentialId: CRED } });
    assert.equal((await User.passkeyOf(CRED)).state, PasskeyState.NO_PUBLIC_KEY);
});

test('passkeyOf throws on a failed read (never reads an outage as "not registered")', async () => {
    failReads = true;
    await assert.rejects(() => User.passkeyOf(CRED), /UNAVAILABLE/);
});

test('passkeyOf refuses a non-base64url credential id', async () => {
    await assert.rejects(() => User.passkeyOf('a/b+c'), (e) => e.code === 'PASSKEY_RECORD_INVALID');
});

test('recordPasskeyCounter stores the counter; a failed write throws', async () => {
    await User.createForPasskey(PASSKEY());
    await User.recordPasskeyCounter(CRED, 7);
    assert.equal(USERS().get(CRED).passkey.counter, 7);
    assert.equal(USERS().get(CRED).passkey.public_key, PASSKEY().public_key);
    failWrites = true;
    await assert.rejects(() => User.recordPasskeyCounter(CRED, 8), /counter was not stored/);
});

test('recordPasskeyCounter never lowers the stored counter, also under concurrent sign-ins', async () => {
    await User.createForPasskey(PASSKEY());
    await User.recordPasskeyCounter(CRED, 7);
    await User.recordPasskeyCounter(CRED, 5);
    assert.equal(USERS().get(CRED).passkey.counter, 7, 'a lower counter is not written');
    await Promise.all([User.recordPasskeyCounter(CRED, 9), User.recordPasskeyCounter(CRED, 8)]);
    assert.equal(USERS().get(CRED).passkey.counter, 9, 'the higher of two concurrent counters stays');
});

test('recordPasskeyCounter refuses an account that holds no passkey (nothing written)', async () => {
    USERS().set(CRED, { id: CRED });
    await assert.rejects(() => User.recordPasskeyCounter(CRED, 3), /holds no passkey; the counter was not stored|holds no passkey\)/);
    assert.deepEqual(USERS().get(CRED), { id: CRED });
});

test('recordPasskeyCounter refuses an account holding another credential\'s passkey; nothing written', async () => {
    USERS().set(CRED, { id: CRED, passkey: { ...PASSKEY(), credential_id: 'b3RoZXItY3JlZA', source: 'registered' } });
    const before = structuredClone(USERS().get(CRED));
    await assert.rejects(() => User.recordPasskeyCounter(CRED, 3), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /another credential/.test(e.message));
    assert.deepEqual(USERS().get(CRED), before);
});

test('recordPasskeyCounter refuses a stored counter that is not an integer instead of overwriting it', async () => {
    USERS().set(CRED, { id: CRED, passkey: { ...PASSKEY(), counter: '5', source: 'registered' } });
    const before = structuredClone(USERS().get(CRED));
    await assert.rejects(() => User.recordPasskeyCounter(CRED, 9), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /counter/.test(e.message));
    assert.deepEqual(USERS().get(CRED), before);
});
