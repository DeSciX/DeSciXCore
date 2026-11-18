/**
 * The operator upgrade of a key-less Powch account: User.attachRecoveredPasskey
 * writes USERS.passkey only for an account in NO_PUBLIC_KEY, in one transaction; User.removeRecoveredPasskey
 * deletes it only when the account holds exactly the record that was written; User.passkeyRecoveryStatus and
 * User.passkeyRecoveryCandidates read where accounts stand for it. And no package in this repo reaches any of
 * them except the owner itself.
 *
 * Firestore is an in-memory fake standing in for CacheFirestore (its `.db` supports doc get/create, string range
 * queries, and runTransaction with get/update, honouring FieldValue.delete()). Nothing leaves the process.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/user-passkey-recovery-owner.test.js
 */
import { test, mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const real = await import('@descix/cloud-core');

const store = new Map();
let writes = 0;
const coll = (p) => { if (!store.has(p)) store.set(p, new Map()); return store.get(p); };
const isDelete = (v) => typeof v?.isEqual === 'function' && v.isEqual(real.FieldValue.delete());

const created = new Map(); // `${collection}/${id}` -> ISO time the fake doc was created
const createTimeOf = (p, id) => (created.has(`${p}/${id}`) ? { toDate: () => new Date(created.get(`${p}/${id}`)) } : undefined);
let failQueries = null; // an Error the next range read throws

function docRef(p, id) {
    return {
        p, id,
        async create(data) {
            if (coll(p).has(id)) throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 });
            writes += 1;
            coll(p).set(id, structuredClone(data));
        },
        async get() {
            const d = coll(p).get(id);
            return { exists: !!d, data: () => (d ? structuredClone(d) : undefined), createTime: d ? createTimeOf(p, id) : undefined };
        },
    };
}

/** A range query over string fields (the only shape the owner's listing uses: >= and <). */
function query(p, filters = []) {
    return {
        where: (field, op, value) => {
            if (!['>=', '<'].includes(op)) throw new Error(`fake query: unsupported op ${op}`);
            return query(p, [...filters, [field, op, value]]);
        },
        async get() {
            reads += 1;
            if (failQueries) throw failQueries;
            const hit = (d) => filters.every(([f, op, v]) => typeof d[f] === 'string' && (op === '>=' ? d[f] >= v : d[f] < v));
            const docs = [...coll(p)].filter(([, d]) => hit(d))
                .map(([id, d]) => ({ id, exists: true, data: () => structuredClone(d), createTime: createTimeOf(p, id) }));
            return { docs, empty: docs.length === 0 };
        },
    };
}
let reads = 0;

class FakeCacheFirestore {
    get db() {
        return {
            collection: (p) => ({ doc: (id) => docRef(p, id), where: (...a) => query(p).where(...a) }),
            async runTransaction(fn) {
                const pending = [];
                await fn({
                    get: (ref) => ref.get(),
                    update: (ref, data) => { pending.push([ref, data]); },
                });
                for (const [ref, data] of pending) {
                    if (!coll(ref.p).has(ref.id)) throw Object.assign(new Error('NOT_FOUND'), { code: 5 });
                    const doc = structuredClone(coll(ref.p).get(ref.id));
                    for (const [k, v] of Object.entries(data)) {
                        if (isDelete(v)) delete doc[k]; else doc[k] = structuredClone(v);
                    }
                    writes += 1;
                    coll(ref.p).set(ref.id, doc);
                }
            },
        };
    }
    async get_doc(p, id) { const d = coll(p).get(id); return d ? structuredClone(d) : null; }
}

mock.module('@descix/cloud-core', { namedExports: { ...real, CacheFirestore: FakeCacheFirestore } });

let User, PasskeyState, PasskeyRecordRefusal, recoveredPasskeyDifferences;
before(async () => {
    ({ User, PasskeyState, PasskeyRecordRefusal, recoveredPasskeyDifferences } = await import('../src/index.js'));
});

const USERS = () => coll(real.FirestoreCollections.USERS());
const ID = 'Q3JlZEFfX2lk';
const OTHER = 'T3RoZXJDcmVk';
const bag = (o = {}) => ({
    credential_id: ID,
    public_key: 'cHViLWtleS1yZWNvdmVyZWQ',
    counter: 0,
    transports: [],
    rp_id: 'powch.example',
    registered_at: '2026-11-12T10:00:00.000Z',
    ...o,
});
const legacy = (id = ID) => USERS().set(id, { id, user_info: { credentialId: id }, wallet_address: '0xaa', auth_providers: ['powch'] });
const snapshot = () => structuredClone([...USERS()]);

beforeEach(() => { store.clear(); created.clear(); writes = 0; reads = 0; failQueries = null; });

test('attach: a key-less account gains exactly the passkey field; every other field is untouched', async () => {
    legacy();
    const before = structuredClone(USERS().get(ID));
    assert.equal((await User.passkeyOf(ID)).state, PasskeyState.NO_PUBLIC_KEY);
    assert.equal(await User.attachRecoveredPasskey(bag()), ID);
    const after = structuredClone(USERS().get(ID));
    assert.deepEqual(after.passkey, bag({ source: 'recovered' }));
    delete after.passkey;
    assert.deepEqual(after, before);
    const { state, passkey } = await User.passkeyOf(ID);
    assert.equal(state, PasskeyState.REGISTERED);
    assert.deepEqual(passkey, bag({ source: 'recovered' }));
});

test('attach refuses an account that already holds a key (KEY_ALREADY_ON_FILE); nothing is written', async () => {
    legacy();
    await User.attachRecoveredPasskey(bag());
    const before = snapshot(); const w = writes;
    await assert.rejects(User.attachRecoveredPasskey(bag({ public_key: 'YW5vdGhlci1rZXk' })), (e) => e.code === PasskeyRecordRefusal.KEY_ALREADY_ON_FILE);
    assert.equal(writes, w);
    assert.deepEqual(snapshot(), before);
});

test('attach refuses an account registered with a key at registration (createForPasskey); nothing is written', async () => {
    await User.createForPasskey(bag({ public_key: 'b3JpZ2luYWwta2V5' }));
    const before = snapshot(); const w = writes;
    await assert.rejects(User.attachRecoveredPasskey(bag()), (e) => e.code === PasskeyRecordRefusal.KEY_ALREADY_ON_FILE);
    assert.equal(writes, w);
    assert.deepEqual(snapshot(), before);
});

test('attach refuses a non-Powch account whose id looks like a credential id (a Discord-only doc); nothing is written', async () => {
    const DISCORD = '123456789012345678';
    USERS().set(DISCORD, { id: DISCORD, discord_user_id: DISCORD, auth_providers: ['discord'], user_info: { id: DISCORD, username: 'someone' }, wallet_address: '0xbb' });
    const before = snapshot(); const w = writes;
    await assert.rejects(User.attachRecoveredPasskey(bag({ credential_id: DISCORD })), (e) => e.code === 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT');
    assert.equal(writes, w);
    assert.deepEqual(snapshot(), before);
});

test('attach refuses a Powch account whose user_info.credentialId is another credential, and one missing either field; nothing is written', async () => {
    for (const doc of [
        { id: ID, user_info: { credentialId: OTHER }, auth_providers: ['powch'] },
        { id: ID, user_info: { credentialId: ID }, auth_providers: ['discord'] },
        { id: ID, user_info: { credentialId: ID } },
        { id: ID, auth_providers: ['powch'] },
    ]) {
        store.clear();
        USERS().set(ID, doc);
        const before = snapshot(); const w = writes;
        await assert.rejects(User.attachRecoveredPasskey(bag()), (e) => e.code === 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT', JSON.stringify(doc));
        assert.equal(writes, w);
        assert.deepEqual(snapshot(), before);
    }
});

test('attach accepts the genuine legacy shape (User.to_firestore(id, { credentialId }, powch), also with powch added to another provider)', async () => {
    legacy();
    assert.equal(await User.attachRecoveredPasskey(bag()), ID);
    store.clear();
    USERS().set(ID, { id: ID, discord_user_id: null, user_info: { credentialId: ID }, auth_providers: ['discord', 'powch'] });
    assert.equal(await User.attachRecoveredPasskey(bag()), ID);
});

test('attach refuses a credential with no account (ACCOUNT_NOT_FOUND); no account is created', async () => {
    await assert.rejects(User.attachRecoveredPasskey(bag()), (e) => e.code === PasskeyRecordRefusal.ACCOUNT_NOT_FOUND);
    assert.equal(USERS().size, 0);
    assert.equal(writes, 0);
});

test('attach refuses a malformed bag before any read (PASSKEY_RECORD_INVALID)', async () => {
    legacy();
    await assert.rejects(User.attachRecoveredPasskey(bag({ public_key: 'not base64url!' })), (e) => e.code === PasskeyRecordRefusal.INVALID);
    assert.equal(writes, 0);
});

test('remove: deletes the record it is given back, returning the account to NO_PUBLIC_KEY, even after the counter advanced', async () => {
    legacy();
    const before = structuredClone(USERS().get(ID));
    await User.attachRecoveredPasskey(bag());
    USERS().get(ID).passkey.counter = 7; // a verified sign-in advanced it (recordPasskeyCounter, tested in user-passkey-owner.test.js)
    assert.equal(await User.removeRecoveredPasskey(bag()), ID);
    assert.equal((await User.passkeyOf(ID)).state, PasskeyState.NO_PUBLIC_KEY);
    assert.deepEqual(USERS().get(ID), before);
});

test('remove refuses a record that differs in any identity field (ROLLBACK_MISMATCH); nothing is written', async () => {
    legacy();
    await User.attachRecoveredPasskey(bag());
    for (const change of [{ public_key: 'b3RoZXI' }, { rp_id: 'other.example' }, { registered_at: '2026-11-12T10:00:01.000Z' }, { transports: ['internal'] }]) {
        const before = snapshot(); const w = writes;
        await assert.rejects(User.removeRecoveredPasskey(bag(change)), (e) => e.code === PasskeyRecordRefusal.ROLLBACK_MISMATCH && e.message.includes(Object.keys(change)[0]));
        assert.equal(writes, w);
        assert.deepEqual(snapshot(), before);
    }
});

test('remove refuses a key-less account and a missing account; nothing is written', async () => {
    legacy();
    await assert.rejects(User.removeRecoveredPasskey(bag()), (e) => e.code === PasskeyRecordRefusal.ROLLBACK_MISMATCH);
    await assert.rejects(User.removeRecoveredPasskey(bag({ credential_id: OTHER })), (e) => e.code === PasskeyRecordRefusal.ACCOUNT_NOT_FOUND);
    assert.equal(writes, 0);
});

// --- The read-ahead: passkeyRecoveryStatus runs attach's own check, writing nothing ---

const FIXTURES = {
    'genuine legacy Powch account': () => legacy(),
    'Discord-only account': () => USERS().set(ID, { id: ID, discord_user_id: ID, auth_providers: ['discord'], user_info: { id: ID, username: 'someone' } }),
    'Powch account of another credential': () => USERS().set(ID, { id: ID, user_info: { credentialId: OTHER }, auth_providers: ['powch'] }),
    'Powch account with no credentialId': () => USERS().set(ID, { id: ID, user_info: {}, auth_providers: ['powch'] }),
    'Powch account with a null credentialId': () => USERS().set(ID, { id: ID, user_info: { credentialId: null }, auth_providers: ['powch'] }),
    'account already holding a key': () => { legacy(); USERS().get(ID).passkey = { ...bag(), source: 'registered' }; },
    'missing account': () => {},
};
const EXPECTED = {
    'genuine legacy Powch account': null,
    'Discord-only account': 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT',
    'Powch account of another credential': 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT',
    'Powch account with no credentialId': 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT',
    'Powch account with a null credentialId': 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT',
    'account already holding a key': 'PASSKEY_KEY_ALREADY_ON_FILE',
    'missing account': 'PASSKEY_ACCOUNT_NOT_FOUND',
};
const outcome = async (fn) => { try { await fn(); return null; } catch (e) { return e.code ?? `uncoded: ${e.message}`; } };

test('passkeyRecoveryStatus answers the genuine legacy shape with no refusal and the others with their codes; it writes nothing', async () => {
    for (const [name, seed] of Object.entries(FIXTURES)) {
        store.clear(); seed();
        const before = snapshot(); const w = writes;
        const status = await User.passkeyRecoveryStatus(ID);
        assert.equal(status.refusal, EXPECTED[name], name);
        assert.equal(status.user_id, ID, name);
        assert.equal(status.credential_id, EXPECTED[name] === null || EXPECTED[name] === 'PASSKEY_KEY_ALREADY_ON_FILE' ? ID : null, name);
        assert.equal(writes, w, name);
        assert.deepEqual(snapshot(), before, name);
    }
    await assert.rejects(User.passkeyRecoveryStatus('a/b+c'), (e) => e.code === 'PASSKEY_RECORD_INVALID');
});

test('passkeyRecoveryStatus carries the normalized verified_email (the one address the upgrade judges by, never the unverified email) and the doc\'s create time', async () => {
    legacy();
    Object.assign(USERS().get(ID), { email: 'bob@example.org', verified_email: ' OPERATOR@ExAmPle.org ' });
    created.set(`${real.FirestoreCollections.USERS()}/${ID}`, '2026-03-01T12:00:00.000Z');
    assert.deepEqual(await User.passkeyRecoveryStatus(ID), {
        user_id: ID, credential_id: ID, verified_email: 'operator@example.org', created_at: '2026-03-01T12:00:00.000Z', refusal: null,
    });
    created.clear();
    USERS().get(ID).verified_email = 42; // not an address
    const s = await User.passkeyRecoveryStatus(ID);
    assert.equal(s.verified_email, null);
    assert.equal('email' in s, false, 'the unverified email is not part of the status');
    assert.equal(s.created_at, null, 'a read with no createTime says so, never invents one');
});

test('attachRecoveredPasskey and passkeyRecoveryStatus agree on every fixture', async () => {
    for (const [name, seed] of Object.entries(FIXTURES)) {
        store.clear(); seed();
        const read = (await User.passkeyRecoveryStatus(ID)).refusal;
        const attach = await outcome(() => User.attachRecoveredPasskey(bag()));
        assert.equal(attach, read, name);
    }
});

test('the superseded read-ahead is gone: User.assertPasskeyRecoverable does not exist', () => {
    assert.equal(User.assertPasskeyRecoverable, undefined);
});

// --- The listing: passkeyRecoveryCandidates ---

const A = 'QWFhYV9jcmVk', B = 'QmJiYl9jcmVk', C = 'Q2NjY19jcmVk', D = 'RGRkZF9jcmVk', E = 'RWVlZV9jcmVk', F = 'RmZmZl9jcmVk', G = 'R2dnZ19jcmVk';
function seedPeople() {
    const legacyWith = (id, extra) => USERS().set(id, { id, user_info: { credentialId: id }, auth_providers: ['powch'], ...extra });
    legacyWith(A, { email: 'operator@example.org', verified_email: 'operator@example.org' });                 // eligible
    legacyWith(B, { email: 'operator+x@example.com', verified_email: 'operator+x@example.com', passkey: { ...bag({ credential_id: B }), source: 'registered' } }); // has a key
    legacyWith(C, { email: 'operators@example.org', verified_email: 'operators@example.org' });       // another person
    USERS().set('412345678901234567', { id: '412345678901234567', auth_providers: ['discord'], user_info: { id: '412345678901234567' }, email: 'operator@example.net', verified_email: 'operator@example.net' }); // not Powch
    legacyWith(D, { email: null, verified_email: 'operator+tag@example.net' });                         // verified only
    legacyWith(E, { email: 'bob@example.org', verified_email: 'bob@example.org' });                 // unrelated
    legacyWith(F, { email: 'operator@example.org', verified_email: null });                               // email only: never listed
    legacyWith(G, { email: 'bob@example.com', verified_email: 'operator+g@example.com' });             // verified operator+ under another email
    created.set(`${real.FirestoreCollections.USERS()}/${A}`, '2026-02-02T00:00:00.000Z');
}

test('passkeyRecoveryCandidates returns every doc whose verified_email starts with a prefix (never by the unverified email), eligible or not, with its refusal; writes nothing', async () => {
    seedPeople();
    const before = snapshot(); const w = writes;
    const got = await User.passkeyRecoveryCandidates({ emailPrefixes: ['operator@', 'operator+'] });
    assert.deepEqual(got.map((s) => [s.user_id, s.refusal]), [
        ['412345678901234567', 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT'],
        [A, null],
        [B, 'PASSKEY_KEY_ALREADY_ON_FILE'],
        [G, null],
        [D, null],
    ]);
    assert.equal(got.find((s) => s.user_id === A).created_at, '2026-02-02T00:00:00.000Z');
    assert.equal(got.find((s) => s.user_id === D).verified_email, 'operator+tag@example.net');
    assert.equal(writes, w);
    assert.deepEqual(snapshot(), before);
});

test('negative control: operators@ and bob@ are reached only by their own prefixes', async () => {
    seedPeople();
    assert.deepEqual((await User.passkeyRecoveryCandidates({ emailPrefixes: ['operators@'] })).map((s) => s.user_id), [C]);
    assert.deepEqual((await User.passkeyRecoveryCandidates({ emailPrefixes: ['bob@'] })).map((s) => s.user_id), [E]);
});

test('passkeyRecoveryCandidates refuses a missing, empty or malformed prefix list before any read (PASSKEY_RECORD_INVALID): there is no unfiltered listing', async () => {
    seedPeople();
    for (const args of [undefined, {}, { emailPrefixes: [] }, { emailPrefixes: '' }, { emailPrefixes: [''] }, { emailPrefixes: ['@'] }, { emailPrefixes: ['operator'] }, { emailPrefixes: ['OPERATOR@'] }, { emailPrefixes: ['operator@', 7] }, { emailPrefixes: ['s am@'] }]) {
        await assert.rejects(User.passkeyRecoveryCandidates(args), (e) => e.code === 'PASSKEY_RECORD_INVALID', JSON.stringify(args));
    }
    assert.equal(reads, 0);
});

test('passkeyRecoveryCandidates fails loud when a read fails; never an empty list', async () => {
    seedPeople();
    failQueries = new Error('UNAVAILABLE');
    await assert.rejects(User.passkeyRecoveryCandidates({ emailPrefixes: ['operator@'] }), /the USERS read on verified_email for 'operator@' failed \(UNAVAILABLE\); no listing/);
});

// --- Provenance: remove deletes only a record attach wrote (USERS.passkey.source) ---

test('reviewer probe: remove refuses a key registered at registration; the account keeps it and attach of another key is refused', async () => {
    await User.createForPasskey(bag({ public_key: 'a2V5LUEtcmVnaXN0ZXJlZA' }));
    const { passkey: held } = await User.passkeyOf(ID);
    const before = snapshot(); const w = writes;
    await assert.rejects(User.removeRecoveredPasskey(held), (e) => e.code === 'PASSKEY_RECORD_INVALID' && /source/.test(e.message));
    const { source, ...receiptShape } = held;
    await assert.rejects(User.removeRecoveredPasskey(receiptShape), (e) => e.code === 'PASSKEY_NOT_RECOVERED');
    assert.equal(writes, w);
    assert.deepEqual(snapshot(), before);
    await assert.rejects(User.attachRecoveredPasskey(bag({ public_key: 'a2V5LUItb3BlcmF0b3I' })), (e) => e.code === PasskeyRecordRefusal.KEY_ALREADY_ON_FILE);
    assert.equal((await User.passkeyOf(ID)).passkey.public_key, 'a2V5LUEtcmVnaXN0ZXJlZA');
});

test('remove refuses a stored record that carries no source marker (fail closed); nothing is written', async () => {
    legacy();
    USERS().get(ID).passkey = bag();
    const before = snapshot(); const w = writes;
    await assert.rejects(User.removeRecoveredPasskey(bag()), (e) => e.code === 'PASSKEY_NOT_RECOVERED');
    assert.equal(writes, w);
    assert.deepEqual(snapshot(), before);
});

test('the recovered path round-trips: attach marks the record recovered, remove returns the account key-less', async () => {
    legacy();
    const before = structuredClone(USERS().get(ID));
    await User.attachRecoveredPasskey(bag());
    assert.equal(USERS().get(ID).passkey.source, 'recovered');
    assert.equal(await User.removeRecoveredPasskey(bag()), ID);
    assert.equal((await User.passkeyOf(ID)).state, PasskeyState.NO_PUBLIC_KEY);
    assert.deepEqual(USERS().get(ID), before);
});

// --- Reach: nothing in this repo calls the operator methods except their owner ---

const coreRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OPERATOR_METHODS = /\b(attachRecoveredPasskey|removeRecoveredPasskey|passkeyRecoveryStatus|passkeyRecoveryCandidates)\b/;
const OWNER = path.join(coreRoot, 'descix-platform-api', 'src', 'models', 'index.js');

function sourceFiles(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === 'tests' || e.name === 'test' || e.name.startsWith('.')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) sourceFiles(p, out);
        else if (/\.(m?js|jsx|ts|json)$/.test(e.name)) out.push(p);
    }
    return out;
}

function reachers(files) {
    return files.filter((f) => f !== OWNER && OPERATOR_METHODS.test(fs.readFileSync(f, 'utf8')));
}

test('no CLI, MCP, SDK, app-sdk, cloud-core or platform-api module references the operator methods; only the owner defines them', () => {
    const packages = fs.readdirSync(coreRoot).filter((d) => d.startsWith('descix-') && fs.statSync(path.join(coreRoot, d)).isDirectory());
    assert.ok(packages.includes('descix-cli') && packages.includes('descix-sdk') && packages.includes('descix-platform-api'), `scanned ${packages.join(', ')}`);
    const files = packages.flatMap((d) => sourceFiles(path.join(coreRoot, d)));
    assert.ok(files.includes(OWNER), 'the owner is among the scanned files');
    assert.deepEqual(reachers(files).map((f) => path.relative(coreRoot, f)), []);
});

test('negative control: the reach scan FAILS on a module that calls the operator method', () => {
    const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'reach-'));
    const bad = path.join(tmp, 'commandHandler.js');
    fs.writeFileSync(bad, "export const h = (p) => User.attachRecoveredPasskey(p);\n");
    try {
        assert.deepEqual(reachers([bad]), [bad]);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('recoveredPasskeyDifferences: [] only for the exact record attach wrote from the receipt; counter ignored', async () => {
    legacy();
    await User.attachRecoveredPasskey(bag());
    const stored = USERS().get(ID).passkey;
    assert.deepEqual(recoveredPasskeyDifferences(stored, bag()), []);
    assert.deepEqual(recoveredPasskeyDifferences({ ...stored, counter: stored.counter + 7 }, bag()), [], 'sign-ins move the counter');
    assert.deepEqual(recoveredPasskeyDifferences(stored, bag({ registered_at: '2030-01-01T00:00:00.000Z' })), ['registered_at'], 'the same key written by another run is not this receipt\'s record');
    assert.deepEqual(recoveredPasskeyDifferences({ ...stored, source: 'registered' }, bag()), ['source']);
    assert.ok(recoveredPasskeyDifferences(null, bag()).includes('public_key'), 'nothing on file differs in every field');
});

test('removeRecoveredPasskey refuses a record that differs only in registered_at (the comparison is the exported one)', async () => {
    legacy();
    await User.attachRecoveredPasskey(bag());
    await assert.rejects(User.removeRecoveredPasskey(bag({ registered_at: '2030-01-01T00:00:00.000Z' })), (e) => e.code === PasskeyRecordRefusal.ROLLBACK_MISMATCH && /registered_at/.test(e.message));
    assert.ok(USERS().get(ID).passkey, 'nothing removed');
});
