/**
 * The operator account admin (src/account-admin) over the User owner (userAccountOwner, src/models) and
 * two in-memory dependent store owners built on the contract: `cloudPurchases` (deletes the account's
 * Purchases subcollection; a paid one blocks) and `products` (moves product ownership on merge). Firestore is
 * the in-memory fake in helpers/fake-firestore.js; nothing leaves the process.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/account-admin.test.js
 */
import { test, mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createFakeFirestore } from './helpers/fake-firestore.js';

const real = await import('@descix/cloud-core');
const fake = createFakeFirestore(real);
/** The booted service config the package's cloud-core instance answers (getCloudConfig); a test may replace it. */
const DEV_LAYER = Object.freeze({ env: 'dev', file: '/svc/defaults-config-dev.json', values: Object.freeze({ FIRESTORE_DATABASE_ID: 'descix-dev' }) });
let booted;
const bootDev = () => { booted = { DEPLOY_ENV: 'dev', envDefaultsLayer: () => DEV_LAYER }; };
mock.module('@descix/cloud-core', { namedExports: { ...real, CacheFirestore: fake.FakeCacheFirestore, getCloudConfig: () => (typeof booted === 'function' ? booted() : booted) } });

let P;
before(async () => { P = await import('../src/index.js'); });

const { Timestamp } = real;
const R = () => P.AccountAdminRefusal;
const TARGET = { projectId: 'descix', databaseId: 'descix-dev', secretName: 'descix_config_dev' };
const CEO_RULE = { localPart: 'operator', plusAddressing: true, domains: ['example.org', 'example.net', 'example.com'] };
const refusedWith = (code) => (e) => { assert.equal(e.code, code, e.message); return true; };

// ------------------------------------------------------------------------- fixtures

const PASSKEY = 'UGFzc2tleUE';        // a test passkey account (operator+test@example.org)
const SURVIVOR = 'S2V5ZWRQYXNz';      // the passkey account of operator@example.org
const LEGACY = 'operator@example.org';      // the legacy email-keyed record of operator@example.org
const OTHER_PERSON = 'U2FtYW50aGE';
const BOB = 'Qm9i';
const U = (id) => `UserCache/${id}`;
let emailRow;

function seed() {
    fake.reset();
    bootDev();
    emailRow = `ProviderIndex/${P.User.emailIndexKey('operator@example.org')}`;
    const t = Timestamp.fromDate(new Date('2026-05-01T00:00:00Z'));
    fake.put(U(PASSKEY), { id: PASSKEY, auth_providers: ['powch'], user_info: { credentialId: PASSKEY }, verified_email: 'operator+test@example.org', email: 'operator+test@example.org', wallet_address: '0xaaa', signature: '0xsig-live', roles: {}, api_signatures: [{ id: 's1', signature: '0xapi-live', name: 'cli' }] });
    fake.put(`${U(PASSKEY)}/Sessions/tok-live-1`, { access_token: 'tok-live-1', refresh_token: 'refresh-live', provider: 'descix', user_id: PASSKEY, create_datetime: t });
    fake.put(`ProviderIndex/${P.User.emailIndexKey('operator+test@example.org')}`, { descix_user_id: PASSKEY, provider_type: 'email', provider_id: 'operator+test@example.org' });
    fake.put('WalletIndex/0xaaa', { descix_user_id: PASSKEY, wallet_address: '0xaaa' });
    fake.put('SignatureIndex/abc123', { user_id: PASSKEY, signature_id: 's1', wallet_address: '0xaaa' });
    fake.put(`${U(PASSKEY)}/Purchases/pu1`, { ProductPath: 'Community/daita', purchase_price: 0 });

    fake.put(U(SURVIVOR), { id: SURVIVOR, auth_providers: ['powch'], user_info: { credentialId: SURVIVOR }, verified_email: 'operator@example.org', email: 'operator@example.org', roles: { community_daita_chat: { acquired_date: t } }, passkey: { credential_id: SURVIVOR } });
    fake.put(U(LEGACY), { id: LEGACY, email: 'operator@example.org', auth_providers: ['google'], wallet_address: '0xbbb', roles: { community_egpt_chat: { acquired_date: t }, community_daita_chat: { acquired_date: t } } });
    fake.put(`${U(LEGACY)}/Sessions/tok-legacy`, { access_token: 'tok-legacy', provider: 'descix', user_id: LEGACY });
    fake.put('WalletIndex/0xbbb', { descix_user_id: LEGACY, wallet_address: '0xbbb' });
    fake.put('ProviderIndex/google_123', { descix_user_id: LEGACY, provider_type: 'google', provider_id: '123' });
    fake.put('Community/egpt/Apps/egpt-godsworld', { owner_id: LEGACY });

    fake.put(U(OTHER_PERSON), { id: OTHER_PERSON, auth_providers: ['powch'], user_info: { credentialId: OTHER_PERSON }, verified_email: 'operators@example.org' });
    fake.put(U(BOB), { id: BOB, auth_providers: ['powch'], user_info: { credentialId: BOB }, verified_email: 'bob@example.org', email: 'operator@example.net' });
}

/** A read through the fake that fails as the contract says: ACCOUNT_STORE_READ_FAILED, never an empty answer. */
async function ownerRead(what, fn) {
    try {
        return await fn();
    } catch (e) {
        throw new P.AccountAdminError(R().ACCOUNT_STORE_READ_FAILED, `${what} read failed (${e.message})`, { cause: e });
    }
}
const samePaths = (a, b) => Array.isArray(b) && JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());

/** A dependent store owner over UserCache/<id>/Purchases, written to the contract. */
function purchasesOwner({ lie = false, failDelete = false } = {}) {
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const fp = async (user) => {
        const snap = await ownerRead('Purchases', () => db().collection(`${U(user.user_id)}/Purchases`).limit(P.ACCOUNT_READ_LIMIT).get());
        const blockers = snap.docs.filter((d) => d.data().purchase_price > 0).map((d) => P.accountAdminBlocker(R().ACCOUNT_PAID_PURCHASES, `${d.id} paid`));
        return { entries: snap.docs.map((d) => ({ path: d.ref.path, kind: 'purchase', summary: 'a purchase', data: P.receiptData(d.data()) })), leftovers: [], blockers };
    };
    return {
        name: 'cloudPurchases',
        storeTarget: () => ({ databaseId: db().databaseId, projectId: db().projectId }),
        footprintForUser: fp,
        async deleteForUser(user, { expectPaths, expectData } = {}) {
            const now = await fp(user);
            P.assertDeletePlanCurrent('cloudPurchases', now.entries, { expectPaths, expectData });
            if (now.blockers.length) throw new P.AccountAdminError(now.blockers[0].code, 'blocked');
            if (failDelete) throw new P.AccountAdminError(R().ACCOUNT_STORE_WRITE_FAILED, 'Purchases delete failed');
            if (!lie) for (const p of expectPaths) await db().doc(p).delete();
            const remaining = [];
            for (const p of expectPaths) if ((await ownerRead(p, () => db().doc(p).get())).exists) remaining.push(p);
            return { deleted: lie ? expectPaths : expectPaths.filter((p) => !remaining.includes(p)), remaining: lie ? [] : remaining };
        },
    };
}

/** A dependent store owner that moves product ownership (owner_id) on merge, written to the contract. */
function productsOwner({ failMerge = false } = {}) {
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const owned = async (id) => (await ownerRead('Apps', () => db().collection('Community/egpt/Apps').where('owner_id', '==', id).limit(P.ACCOUNT_READ_LIMIT).get())).docs;
    const mergeFp = async ({ from, into }) => ({ entries: (await owned(from.user_id)).map((d) => ({ path: d.ref.path, field: 'owner_id', from: from.user_id, to: into.user_id, summary: 'product owner' })), leftovers: [], blockers: [] });
    const validateRollbackMoves = (moves, { from, into }) => {
        for (const m of moves) {
            if (!m.path.startsWith('Community/egpt/Apps/') || m.field !== 'owner_id' || m.from !== from.user_id || m.to !== into.user_id) {
                throw new P.AccountAdminError(R().ACCOUNT_RECEIPT_INVALID, `not a products move of this pair: ${JSON.stringify(m)}`);
            }
        }
    };
    return {
        name: 'products',
        storeTarget: () => ({ databaseId: db().databaseId }),
        async footprintForUser(user) {
            const docs = await owned(user.user_id);
            return { entries: [], leftovers: [], blockers: docs.length ? [P.accountAdminBlocker(R().ACCOUNT_OWNS_PRODUCTS, `${docs.length} product(s)`)] : [] };
        },
        async deleteForUser(user, plan = {}) {
            P.assertDeletePlanCurrent('products', [], plan);
            return { deleted: [], remaining: [] };
        },
        footprintForMerge: mergeFp,
        async mergeForUser(pair, { expectPaths } = {}) {
            const fp = await mergeFp(pair);
            if (!samePaths(fp.entries.map((m) => m.path), expectPaths)) throw new P.AccountAdminError(R().ACCOUNT_PLAN_STALE, 'stale');
            if (failMerge) throw new P.AccountAdminError(R().ACCOUNT_STORE_WRITE_FAILED, 'products write failed');
            for (const m of fp.entries) await db().doc(m.path).update({ owner_id: m.to });
            return { moved: fp.entries.map(({ summary, ...m }) => m), remaining: [] };
        },
        validateRollbackMoves,
        async rollbackMergeForUser(moves, pair) {
            validateRollbackMoves(moves, pair);
            const restored = [];
            const remaining = [];
            for (const m of moves) {
                const s = await db().doc(m.path).get();
                if (s.data()?.owner_id === m.to) await db().doc(m.path).update({ owner_id: m.from });
                ((await db().doc(m.path).get()).data()?.owner_id === m.from ? restored : remaining).push({ path: m.path, field: m.field });
            }
            return { restored, remaining };
        },
    };
}

/** A footprint-only owner: no entries, a leftover it names (e.g. Cloud's unread stores). */
function leftoversOwner() {
    return {
        name: 'unread',
        storeTarget: () => ({ databaseId: fake.FakeCacheFirestore.prototype.db.databaseId }),
        async footprintForUser() { return { entries: [], leftovers: [{ what: 'Google Groups membership', why: 'external; never touched' }], blockers: [] }; },
        async deleteForUser(user, plan = {}) {
            P.assertDeletePlanCurrent('unread', [], plan);
            return { deleted: [], remaining: [] };
        },
    };
}

let walletAnswer;
const walletValueReader = async (address) => (typeof walletAnswer === 'function' ? walletAnswer(address) : walletAnswer);
const admin = (o = {}) => P.createAccountAdmin({ userOwner: P.userAccountOwner, storeOwners: [purchasesOwner(), productsOwner()], walletValueReader, env: 'dev', target: TARGET, rule: CEO_RULE, ...o });

/** An in-memory receipt keeper that logs the save into the store's write log (to order it against writes). */
function keeper() {
    const kept = new Map();
    return { kept, save: (r) => { const label = `receipt-${kept.size + 1}`; fake.log.push({ op: 'receipt', path: label }); kept.set(label, r); return label; } };
}

const SCOPE = 'registered assets on polygon for this address';
beforeEach(() => { seed(); walletAnswer = { measured: true, holdsValue: false, summary: '0 POL, no tokens', scope: SCOPE }; });

// ------------------------------------------------------------------------- the factory

test('factory: no rule, an invalid rule, a bad env or another database refuses before any read', () => {
    let reads = 0;
    fake.faults.read = () => { reads += 1; return false; };
    for (const rule of [undefined, null, { localPart: 'operator', plusAddressing: true, domains: [] }]) {
        assert.throws(() => admin({ rule }), refusedWith(R().ACCOUNT_RULE_INVALID));
    }
    assert.throws(() => admin({ env: 'staging' }), refusedWith(R().ACCOUNT_TARGET_INVALID));
    assert.throws(() => admin({ env: 'prod' }), refusedWith(R().ACCOUNT_TARGET_INVALID), 'prod on a service booted for dev');
    assert.throws(() => admin({ target: { ...TARGET, projectId: '' } }), refusedWith(R().ACCOUNT_TARGET_INVALID));
    assert.throws(() => admin({ target: { ...TARGET, databaseId: 'descix-prod' } }), refusedWith(R().ACCOUNT_TARGET_INVALID), 'a target other than the booted env\'s database');
    assert.equal(reads, 0);
    assert.doesNotThrow(() => admin(), 'positive control: the valid configuration builds');
});

test('B3 factory: the expected database is MEASURED from the booted cloud-core config, never caller-asserted', () => {
    assert.throws(() => admin({ expectedDatabaseIdFor: () => 'descix-dev' }), /expectedDatabaseIdFor is not an option/, 'the retired option fails loud');
    booted = { DEPLOY_ENV: 'prod', envDefaultsLayer: () => ({ env: 'prod', file: '/svc/defaults-config-prod.json', values: { FIRESTORE_DATABASE_ID: 'descix-prod' } }) };
    assert.throws(() => admin(), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /DEPLOY_ENV "prod", not dev/.test(e.message), 'the booted env is not the named env');
    booted = { DEPLOY_ENV: 'dev', envDefaultsLayer: () => null };
    assert.throws(() => admin(), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /loaded no defaults-config-dev\.json/.test(e.message));
    booted = { DEPLOY_ENV: 'dev', envDefaultsLayer: () => ({ env: 'dev', file: '/svc/defaults-config-dev.json', values: { FIRESTORE_DATABASE_ID: null } }) };
    assert.throws(() => admin(), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /names no FIRESTORE_DATABASE_ID/.test(e.message));
    booted = { DEPLOY_ENV: 'dev', FIRESTORE_DATABASE_ID: 'descix-dev' };
    assert.throws(() => admin(), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /no CloudConfig\.envDefaultsLayer\(\)/.test(e.message), 'a cloud-core without the accessor');
    booted = () => { throw new Error('[CloudConfig] Must call createCloudConfig({ rootPath }) before getCloudConfig()'); };
    assert.throws(() => admin(), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /two module instances/.test(e.message) && /cloud-core/.test(e.message), 'a second, never-booted cloud-core instance');
    booted = { DEPLOY_ENV: 'dev', FIRESTORE_DATABASE_ID: 'descix-prod', envDefaultsLayer: () => DEV_LAYER };
    assert.throws(() => admin({ target: { ...TARGET, databaseId: 'descix-prod' } }), refusedWith(R().ACCOUNT_TARGET_INVALID), 'an override moved the MERGED value; the per-env layer still names descix-dev');
    bootDev();
    assert.doesNotThrow(() => admin(), 'positive control');
    assert.deepEqual(P.bootedEnvDatabaseId('dev'), { databaseId: 'descix-dev', file: '/svc/defaults-config-dev.json' });
});

test('B3 every act: an owner whose client targets another database (a second cloud-core instance) is refused before any read, naming it', async () => {
    const elsewhere = { ...purchasesOwner(), storeTarget: () => ({ databaseId: 'descix-prod' }) };
    const before = fake.snapshot();
    let reads = 0;
    fake.faults.read = () => { reads += 1; return false; };
    const a = admin({ storeOwners: [elsewhere, productsOwner()] });
    for (const act of [() => a.listAccounts(), () => a.planDelete({ accountId: PASSKEY }), () => a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR }), () => a.commitDelete({ planId: 'x' }), () => a.rollbackMerge({}), () => a.restoreDelete({})]) {
        await assert.rejects(act(), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /'cloudPurchases' reads and writes database 'descix-prod', not 'descix-dev'/.test(e.message));
    }
    assert.equal(reads, 0, 'refused before any read');
    for (const t of [() => { throw new Error('no client'); }, () => ({}), () => ({ databaseId: '' }), () => ({ databaseId: 'descix-dev', projectId: 'other' })]) {
        await assert.rejects(admin({ storeOwners: [{ ...purchasesOwner(), storeTarget: t }] }).planDelete({ accountId: PASSKEY }), refusedWith(R().ACCOUNT_TARGET_INVALID));
    }
    fake.FakeCacheFirestore.prototype.db.databaseId = 'descix-demo';
    await assert.rejects(admin({ storeOwners: [] }).planDelete({ accountId: PASSKEY }), (e) => refusedWith(R().ACCOUNT_TARGET_INVALID)(e) && /'user' reads and writes database 'descix-demo'/.test(e.message), 'the User owner reports its real client\'s databaseId');
    fake.FakeCacheFirestore.prototype.db.databaseId = 'descix-dev';
    fake.faults.read = () => false;
    assert.deepEqual(P.userAccountOwner.storeTarget(), { databaseId: 'descix-dev', projectId: 'descix' });
    assert.equal((await admin().planDelete({ accountId: PASSKEY })).refused, false, 'positive control');
    assert.deepEqual(fake.snapshot(), before);
});

test('conformance: a store owner missing a contract method is refused at factory time, naming it', () => {
    const { deleteForUser, ...noDelete } = purchasesOwner();
    assert.throws(() => admin({ storeOwners: [noDelete] }), /lacks deleteForUser/);
    const { rollbackMergeForUser, ...halfMerge } = productsOwner();
    assert.throws(() => admin({ storeOwners: [halfMerge] }), /rollbackMergeForUser/);
    const { readMergeFields, ...userMirror } = P.userAccountOwner;
    assert.throws(() => admin({ userOwner: userMirror }), /lacks readMergeFields/);
    assert.throws(() => admin({ storeOwners: [purchasesOwner(), purchasesOwner()] }), /two store owners are named/);
    assert.throws(() => admin({ storeOwners: [{ ...purchasesOwner(), name: 'user' }] }), /cannot be named 'user'/);
    assert.throws(() => admin({ storeOwners: undefined }), /must be an array/);
    assert.throws(() => admin({ walletValueReader: undefined }), /walletValueReader/);
    assert.throws(() => admin({ storeOwners: [{ ...purchasesOwner(), irrecoverable: 'yes' }] }), /irrecoverable must be true or false/);
    assert.throws(() => admin({ storeOwners: [{ ...purchasesOwner(), restoreForUser: {} }] }), /restoreForUser is not a function/);
    assert.throws(() => admin({ userOwner: { ...P.userAccountOwner, irrecoverable: true } }), /User owner declares neither/);
    assert.throws(() => admin({ userOwner: { ...P.userAccountOwner, restoreForUser: async () => ({}) } }), /User owner declares neither/);
    const { preflightDelete, ...noPreflight } = P.userAccountOwner;
    assert.throws(() => admin({ userOwner: noPreflight }), /lacks preflightDelete/);
    assert.ok(preflightDelete);
    for (const m of P.STORE_OWNER_METHODS) {
        const o = purchasesOwner();
        delete o[m];
        assert.throws(() => admin({ storeOwners: [o] }), new RegExp(`lacks ${m}`), m);
    }
});

// ------------------------------------------------------------------------- listing

test('listAccounts: every account the rule names (verified_email, or a legacy email-keyed id), duplicates linked; operators and bob absent; writes nothing', async () => {
    const before = fake.snapshot();
    const listed = await admin().listAccounts();
    assert.deepEqual(listed.map((a) => a.accountId), [SURVIVOR, PASSKEY, LEGACY].sort());
    const byId = Object.fromEntries(listed.map((a) => [a.accountId, a]));
    assert.equal(byId[LEGACY].emailKeyed, true);
    assert.equal(byId[LEGACY].email, 'operator@example.org');
    assert.deepEqual(byId[LEGACY].duplicatesOf, [SURVIVOR]);
    assert.deepEqual(byId[SURVIVOR].duplicatesOf, [LEGACY]);
    assert.equal(byId[SURVIVOR].hasPasskeyCredential, true);
    assert.equal(byId[SURVIVOR].hasPasskeyKey, true);
    assert.equal(byId[PASSKEY].hasPasskeyKey, false);
    assert.equal(byId[PASSKEY].walletAddress, '0xaaa');
    assert.deepEqual(byId[PASSKEY].providers, ['powch']);
    assert.ok(typeof byId[PASSKEY].createdAt === 'string');
    assert.ok(!listed.some((a) => a.accountId === BOB), 'bob\'s unverified email field is operator@example.net; he is judged by verified_email only');
    assert.deepEqual(fake.snapshot(), before);
    assert.equal(fake.log.length, 0);
});

test('a MALFORMED stamp never aborts the listing: that account is listed flagged stampMalformed; planning, restoring and clearing on it refuse ACCOUNT_STAMP_MALFORMED naming the account', async () => {
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), admin_delete: true });
    const listed = await admin().listAccounts();
    const flagged = listed.filter((a) => a.stampMalformed === true).map((a) => a.accountId);
    assert.deepEqual(flagged, [PASSKEY]);
    assert.ok(listed.length > 1, 'the other accounts are still listed');
    await assert.rejects(admin().planDelete({ accountId: PASSKEY }), (e) => e.code === R().ACCOUNT_STAMP_MALFORMED && e.message.includes(PASSKEY));
    await assert.rejects(P.userAccountOwner.clearDeleteStamp({ user_id: PASSKEY }, { planHash: 'a'.repeat(64) }), (e) => e.code === R().ACCOUNT_STAMP_MALFORMED && e.message.includes(PASSKEY));
    assert.throws(() => P.accountLifecycleOf(fake.get(U(PASSKEY))), (e) => e.code === R().ACCOUNT_STAMP_MALFORMED && e.message.includes(PASSKEY));
    seed();
    assert.ok(!(await admin().listAccounts()).some((a) => 'stampMalformed' in a), 'negative control: no flag without a malformed stamp');
});

test('listAccounts: a one-address rule lists only that address', async () => {
    const listed = await admin({ rule: { localPart: 'operator+test', plusAddressing: false, domains: ['example.org'] } }).listAccounts();
    assert.deepEqual(listed.map((a) => a.accountId), [PASSKEY]);
});

// ------------------------------------------------------------------------- delete: plan

test('planDelete: every owner\'s footprint, session paths by digest, credentials redacted; writes nothing', async () => {
    const before = fake.snapshot();
    const plan = await admin().planDelete({ accountId: PASSKEY });
    assert.equal(plan.refused, false, JSON.stringify(plan.blockers));
    const paths = plan.entries.map((e) => e.path).sort();
    const session = paths.find((p) => p.includes('/Sessions/'));
    assert.match(session, /^UserCache\/UGFzc2tleUE\/Sessions\/redacted-[0-9a-f]{16}$/);
    assert.deepEqual(paths.filter((p) => p !== session), [
        `ProviderIndex/${P.User.emailIndexKey('operator+test@example.org')}`, 'SignatureIndex/abc123', U(PASSKEY), `${U(PASSKEY)}/Purchases/pu1`, 'WalletIndex/0xaaa',
    ].sort());
    const json = JSON.stringify(plan);
    for (const secret of ['tok-live-1', 'refresh-live', '0xsig-live', '0xapi-live']) assert.ok(!json.includes(secret), `the plan never carries ${secret}`);
    const userEntry = plan.entries.find((e) => e.path === U(PASSKEY));
    assert.equal(userEntry.data.signature, P.REDACTED);
    assert.equal(userEntry.data.api_signatures[0].signature, P.REDACTED);
    assert.equal(userEntry.data.wallet_address, '0xaaa', 'non-credential fields are kept for the receipt');
    assert.deepEqual(plan.entries.find((e) => e.path === session).data.create_datetime, { __timestamp: { seconds: 1777593600, nanoseconds: 0 } });
    assert.equal(plan.entries.find((e) => e.path.endsWith('pu1')).owner, 'cloudPurchases');
    assert.deepEqual(fake.snapshot(), before);
    assert.equal(fake.log.length, 0);
});

test('encodeStoreValue: a Timestamp is carried to the nanosecond and decodeStoreTimestamp rebuilds it exactly', () => {
    const ns = new Timestamp(1777593600, 123456789);
    const enc = P.encodeStoreValue(ns);
    assert.deepEqual(enc, { __timestamp: { seconds: 1777593600, nanoseconds: 123456789 } });
    assert.equal(P.nonJsonValuePath(enc), null, 'the encoding is plain JSON');
    const back = P.decodeStoreTimestamp(enc, Timestamp);
    assert.ok(back instanceof Timestamp, 'decoded with the caller\'s own Timestamp class');
    assert.equal(back.seconds, 1777593600);
    assert.equal(back.nanoseconds, 123456789);
    assert.ok(back.isEqual(ns), 'round trip is exact');
    // Two values a millisecond encoding could not tell apart are two encodings (and two hashes).
    const near = new Timestamp(1777593600, 123456000);
    assert.notEqual(P.canonicalJson(P.encodeStoreValue(near)), P.canonicalJson(enc));
    assert.notEqual(P.accountAdminHash(P.encodeStoreValue(near)), P.accountAdminHash(enc));
    // Pre-1970 and a JS Date (millisecond source) are exact too.
    const old = new Timestamp(-1, 999999999);
    assert.ok(P.decodeStoreTimestamp(P.encodeStoreValue(old), Timestamp).isEqual(old));
    assert.deepEqual(P.encodeStoreValue(new Date(-1)), { __timestamp: { seconds: -1, nanoseconds: 999000000 } });
    assert.deepEqual(P.encodeStoreValue(new Date('2026-05-01T00:00:00.007Z')), { __timestamp: { seconds: 1777593600, nanoseconds: 7000000 } });
    // A timestamp-like value without integer seconds/nanoseconds is refused, never rounded through toDate().
    assert.throws(() => P.encodeStoreValue({ toDate: () => new Date(0) }), /seconds\/nanoseconds/);
    // Decode refuses anything but the exact encoding.
    for (const bad of [
        { __timestamp: '2026-05-01T00:00:00.000Z' },
        { __timestamp: { seconds: 1, nanoseconds: 1e9 } },
        { __timestamp: { seconds: 1.5, nanoseconds: 0 } },
        { __timestamp: { seconds: 1, nanoseconds: -1 } },
        { __timestamp: { seconds: 1, nanoseconds: 0, extra: 1 } },
        { __timestamp: { seconds: 1, nanoseconds: 0 }, other: 1 },
        null, 'x', { seconds: 1, nanoseconds: 0 },
    ]) {
        assert.throws(() => P.decodeStoreTimestamp(bad, Timestamp), /decodeStoreTimestamp/, JSON.stringify(bad));
    }
    assert.throws(() => P.decodeStoreTimestamp(enc, undefined), /Timestamp class/);
});

test('planDelete: gathers ALL blockers (never stops at the first): email-keyed, roles, unmeasured wallet, an owner\'s own', async () => {
    walletAnswer = undefined;
    fake.put(`${U(LEGACY)}/Purchases/paid`, { purchase_price: 10 });
    const plan = await admin().planDelete({ accountId: LEGACY });
    assert.equal(plan.refused, true);
    assert.deepEqual(plan.blockers.map((b) => b.code).sort(), [
        R().ACCOUNT_EMAIL_KEYED_LEGACY, R().ACCOUNT_HOLDS_ROLES, R().ACCOUNT_OWNS_PRODUCTS, R().ACCOUNT_PAID_PURCHASES, R().ACCOUNT_WALLET_VALUE_UNMEASURED,
    ].sort());
});

test('wallet value: a failed, absent or malformed read is UNMEASURED (never zero); a measured holding blocks; measured empty passes', async () => {
    for (const answer of [() => { throw new Error('rpc down'); }, undefined, null, { measured: false }, { measured: true }, { holdsValue: false }]) {
        walletAnswer = answer;
        const plan = await admin().planDelete({ accountId: PASSKEY });
        assert.deepEqual(plan.blockers.map((b) => b.code), [R().ACCOUNT_WALLET_VALUE_UNMEASURED], String(answer));
    }
    walletAnswer = { measured: true, holdsValue: true, summary: '12 EGPT', scope: SCOPE };
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).blockers.map((b) => [b.code, b.detail]), [[R().ACCOUNT_WALLET_HOLDS_VALUE, `wallet 0xaaa: 12 EGPT (${SCOPE})`]]);
    walletAnswer = { measured: true, holdsValue: false, summary: 'empty', scope: SCOPE };
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).blockers, []);
});

test('wallet value: measured:true without a BOOLEAN holdsValue is UNMEASURED (negative control: the boolean passes)', async () => {
    for (const holdsValue of [undefined, null, 'false', 0, 1, 'true']) {
        walletAnswer = { measured: true, holdsValue, summary: 'x', scope: SCOPE };
        const plan = await admin().planDelete({ accountId: PASSKEY });
        assert.deepEqual(plan.blockers.map((b) => b.code), [R().ACCOUNT_WALLET_VALUE_UNMEASURED], JSON.stringify(holdsValue));
        assert.equal(plan.wallet.measured, false);
    }
    walletAnswer = { measured: true, holdsValue: false, scope: SCOPE };
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).blockers.map((b) => b.code), [R().ACCOUNT_WALLET_VALUE_UNMEASURED], 'no summary string: not a reading');
    walletAnswer = { measured: true, holdsValue: false, summary: 'x', scope: SCOPE };
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).blockers, [], 'negative control: a boolean holdsValue is a measurement');
});

test('B1 wallet scope: a reading without a non-empty `scope` (what exactly was measured) is UNMEASURED; the scope is shown with the wallet section', async () => {
    for (const scope of [undefined, null, '', '   ', 3]) {
        walletAnswer = { measured: true, holdsValue: false, summary: '0 POL', scope };
        const plan = await admin().planDelete({ accountId: PASSKEY });
        assert.deepEqual(plan.blockers.map((b) => b.code), [R().ACCOUNT_WALLET_VALUE_UNMEASURED], JSON.stringify(scope));
        assert.match(plan.wallet.failure, /no scope/);
    }
    walletAnswer = { measured: true, holdsValue: false, summary: '0 POL', scope: SCOPE };
    const plan = await admin().planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.blockers, [], 'negative control: with a scope it is a measurement');
    assert.equal(plan.wallet.scope, SCOPE);
});

test('wallet value: the reader\'s details pass through into the plan for display; non-JSON details are UNMEASURED; no wallet and no wallet material -> wallet null', async () => {
    const details = { chain: 'polygon', native: '0', tokens: [{ symbol: 'EGPT', balance: '0' }], readAt: '2026-11-13T00:00:00.000Z' };
    walletAnswer = { measured: true, holdsValue: false, summary: '0 POL, no tokens', scope: SCOPE, details };
    let plan = await admin().planDelete({ accountId: PASSKEY });
    const notMeasured = ['wallet 0xaaa: value outside the reading\'s scope (wallet.scope) was not measured: any EVM network the scope does not name, and any token it does not cover'];
    assert.deepEqual(plan.wallet, { address: '0xaaa', measured: true, holdsValue: false, summary: '0 POL, no tokens', scope: SCOPE, details, walletMaterial: [{ owner: 'user', path: 'WalletIndex/0xaaa' }], blockers: [], notMeasured });
    assert.deepEqual(plan.notMeasured, notMeasured, 'the plan carries notMeasured at its top level');
    walletAnswer = { measured: true, holdsValue: false, summary: 'x', scope: SCOPE };
    assert.equal((await admin().planDelete({ accountId: PASSKEY })).wallet.details, null, 'absent details read as null, never invented');
    walletAnswer = { measured: true, holdsValue: false, summary: 'x', scope: SCOPE, details: { native: 10n } };
    plan = await admin().planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.blockers.map((b) => b.code), [R().ACCOUNT_WALLET_VALUE_UNMEASURED]);
    assert.match(plan.blockers[0].detail, /details.*native/);
    walletAnswer = () => { throw new Error('rpc down'); };
    plan = await admin().planDelete({ accountId: PASSKEY });
    assert.equal(plan.wallet.measured, false);
    assert.equal(plan.wallet.failure, 'the value read failed (rpc down)');
    assert.deepEqual(plan.wallet.blockers.map((b) => b.code), [R().ACCOUNT_WALLET_VALUE_UNMEASURED]);
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), wallet_address: null });
    fake.docs.delete('WalletIndex/0xaaa');
    const none = await admin().planDelete({ accountId: PASSKEY });
    assert.equal(none.wallet, null);
    assert.deepEqual(none.notMeasured, ['the account has no wallet_address: no wallet reading was taken'], 'notMeasured is present even without a wallet section');
});

/**
 * A dependent owner holding wallet material (e.g. Powch's vault or xPubs): one entry marked walletMaterial,
 * optionally an own blocker. Its delete re-reads, compares and deletes each document in ONE transaction (the
 * contract for an irrecoverable owner); `pathsOnly` is the pre-NF1 owner that compared paths alone (the negative
 * control). Its restore refuses an entry that is not this account's vault before any write.
 */
function walletMaterialOwner({ blocker = null, irrecoverable = false, restore = false, deleteHook = null, pathsOnly = false, unmeasuredNote = null } = {}) {
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const fp = async (user) => {
        const s = await ownerRead('Vaults', () => db().doc(`Vaults/${user.user_id}`).get());
        return {
            entries: s.exists ? [{ path: `Vaults/${user.user_id}`, kind: 'vault', summary: 'wallet material', data: P.receiptData(s.data()), walletMaterial: true, ...(unmeasuredNote ? { unmeasuredNote } : {}) }] : [],
            leftovers: [],
            blockers: blocker ? [P.accountAdminBlocker(blocker, 'a derived-address chain nobody measures')] : [],
        };
    };
    return {
        name: 'vault',
        ...(irrecoverable ? { irrecoverable: true } : {}),
        storeTarget: () => ({ databaseId: db().databaseId }),
        footprintForUser: fp,
        async deleteForUser(user, { expectPaths, expectData } = {}) {
            const now = await fp(user);
            if (pathsOnly) {
                if (!samePaths(now.entries.map((e) => e.path), expectPaths)) throw new P.AccountAdminError(R().ACCOUNT_PLAN_STALE, 'stale');
            } else {
                P.assertDeletePlanCurrent('vault', now.entries, { expectPaths, expectData });
            }
            if (deleteHook) await deleteHook(user);
            for (const p of expectPaths) {
                await db().runTransaction(async (tx) => {
                    const snap = await tx.get(db().doc(p));
                    if (!pathsOnly) P.assertDocumentAsPlanned('vault', p, snap.exists ? P.receiptData(snap.data()) : null, expectData);
                    tx.delete(db().doc(p));
                });
            }
            return { deleted: [...expectPaths], remaining: [] };
        },
        ...(restore ? {
            async restoreForUser(user, entries) {
                const foreign = entries.filter((e) => e.path !== `Vaults/${user.user_id}`);
                if (foreign.length) throw new P.AccountAdminError(R().ACCOUNT_RECEIPT_INVALID, `not this account's vault: ${foreign.map((e) => e.path).join(', ')}; nothing was written`);
                const restored = [];
                for (const e of entries) {
                    await db().runTransaction(async (tx) => { const s = await tx.get(db().doc(e.path)); if (!s.exists) tx.set(db().doc(e.path), e.data); });
                    restored.push(e.path);
                }
                return { restored, remaining: [] };
            },
        } : {}),
    };
}

test('B1 wallet material: an account with NO wallet_address whose stores hold wallet material is ACCOUNT_WALLET_VALUE_UNMEASURED (negative control: no material, no blocker)', async () => {
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), wallet_address: null });
    fake.docs.delete('WalletIndex/0xaaa');
    let reads = 0;
    walletAnswer = () => { reads += 1; return { measured: true, holdsValue: false, summary: 'x', scope: SCOPE }; };
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).blockers, [], 'negative control: no wallet_address, no wallet material');
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const plan = await admin({ storeOwners: [purchasesOwner(), productsOwner(), walletMaterialOwner()] }).planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.blockers.map((b) => [b.owner, b.code]), [['wallet', R().ACCOUNT_WALLET_VALUE_UNMEASURED]]);
    assert.match(plan.blockers[0].detail, /no wallet_address, but its stores hold wallet material \(vault: Vaults\/UGFzc2tleUE\)/);
    assert.equal(plan.wallet.address, null);
    assert.equal(plan.wallet.measured, false);
    assert.deepEqual(plan.wallet.walletMaterial, [{ owner: 'vault', path: `Vaults/${PASSKEY}` }]);
    assert.equal(reads, 0, 'no address: the reader is not asked');
});

test('B1 owner wallet blockers (the xPub owner\'s ACCOUNT_WALLET_VALUE_UNMEASURED) are shown with the wallet section and block', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const plan = await admin({ storeOwners: [purchasesOwner(), productsOwner(), walletMaterialOwner({ blocker: 'ACCOUNT_WALLET_VALUE_UNMEASURED' })] }).planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.blockers.map((b) => [b.owner, b.code]), [['vault', R().ACCOUNT_WALLET_VALUE_UNMEASURED]]);
    assert.deepEqual(plan.wallet.blockers, [{ owner: 'vault', code: R().ACCOUNT_WALLET_VALUE_UNMEASURED, detail: 'a derived-address chain nobody measures' }]);
    assert.equal(plan.wallet.measured, true, 'the account\'s own address was measured');
});

test('B1 a WalletIndex row for an address other than the account\'s wallet_address is ACCOUNT_WALLET_VALUE_UNMEASURED from the User owner', async () => {
    fake.put('WalletIndex/0xold', { descix_user_id: PASSKEY, wallet_address: '0xold' });
    const plan = await admin().planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.blockers.map((b) => [b.owner, b.code]), [['user', R().ACCOUNT_WALLET_VALUE_UNMEASURED]]);
    assert.match(plan.blockers[0].detail, /wallet 0xold is indexed to this account but is not its wallet_address/);
    assert.deepEqual(plan.wallet.walletMaterial.map((w) => w.path).sort(), ['WalletIndex/0xaaa', 'WalletIndex/0xold']);
});

test('planDelete: documents under the USERS doc that no owner covers are ACCOUNT_STORE_UNOWNED and listed in `unowned` (negative control: covered when the owner is present)', async () => {
    const without = await admin({ storeOwners: [] }).planDelete({ accountId: PASSKEY });
    assert.deepEqual(without.blockers.map((b) => b.code), [R().ACCOUNT_STORE_UNOWNED]);
    assert.match(without.blockers[0].detail, /UserCache\/UGFzc2tleUE\/Purchases \(1\)/);
    assert.deepEqual(without.unowned, [`${U(PASSKEY)}/Purchases/pu1`]);
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).unowned, [], 'negative control: the purchases owner covers it');
    fake.put(`${U(PASSKEY)}/RoomConversation/egpt/Interactions/i1`, { text: 'hi' });
    const deep = await admin().planDelete({ accountId: PASSKEY });
    assert.match(deep.blockers.map((b) => b.detail).join(' '), /RoomConversation\/egpt\/Interactions \(1\)/, 'a nested doc under a phantom parent is found');
    assert.deepEqual(deep.unowned, [`${U(PASSKEY)}/RoomConversation/egpt/Interactions/i1`]);
});

test('planDelete: a subcollection LISTING failure is an ACCOUNT_STORE_READ_FAILED blocker and `unowned` is null (unknown), never an empty list', async () => {
    fake.faults.read = (p) => p.endsWith('/*');
    const plan = await admin().planDelete({ accountId: PASSKEY });
    assert.equal(plan.refused, true);
    assert.deepEqual(plan.blockers.map((b) => [b.owner, b.code]), [['user', R().ACCOUNT_STORE_READ_FAILED]]);
    assert.equal(plan.unowned, null);
    fake.faults.read = () => false;
    assert.deepEqual((await admin().planDelete({ accountId: PASSKEY })).unowned, [], 'negative control: the listing succeeds');
});

test('the rule is enforced at plan: an account it does not name (by verified_email) and a missing one are refused without printing the address', async () => {
    await assert.rejects(admin().planDelete({ accountId: OTHER_PERSON }), (e) => refusedWith(R().ACCOUNT_NOT_IN_RULE)(e) && !e.message.includes('operators'));
    await assert.rejects(admin().planDelete({ accountId: BOB }), refusedWith(R().ACCOUNT_NOT_IN_RULE));
    await assert.rejects(admin().planDelete({ accountId: 'Tm9uZQ' }), refusedWith(R().ACCOUNT_NOT_FOUND));
    await assert.rejects(admin().planMerge({ fromAccountId: OTHER_PERSON, intoAccountId: SURVIVOR }), refusedWith(R().ACCOUNT_NOT_IN_RULE));
});

// ------------------------------------------------------------------------- delete: commit

test('commitDelete: DELETED; receipt (every entry with data) saved before the first write; dependents first, USERS doc last; nothing else touched', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    const others = [...fake.snapshot()].filter(([p]) => !plan.entries.some((e) => e.path === p) && !p.startsWith(`${U(PASSKEY)}/`));
    const k = keeper();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: ` ${PASSKEY} `, receipt: k });
    assert.equal(res.outcome, P.DELETE_OUTCOME.DELETED, `${res.line} ${res.notes.join(' | ')}`);
    assert.deepEqual(res.orphaned, []);
    assert.equal(res.accountDeleted, true);
    assert.equal(res.remaining.length, 0);
    assert.equal(res.deleted.length, plan.entries.length);
    assert.match(res.line, /^DELETED: /);
    assert.equal(fake.log[0].op, 'receipt', 'the receipt is saved before any write');
    assert.deepEqual(fake.log.slice(0, 2).map((l) => [l.op, l.path]), [['receipt', 'receipt-1'], ['tx-update', U(PASSKEY)]], 'the receipt, then the admin_delete stamp, before any delete');
    const deletes = fake.log.filter((l) => /delete/.test(l.op)).map((l) => l.path);
    assert.equal(deletes[0], `${U(PASSKEY)}/Purchases/pu1`, 'the dependent owner runs first');
    assert.equal(deletes.at(-1), U(PASSKEY), 'the USERS doc is deleted last');
    const r = k.kept.get(res.receiptLabel);
    assert.equal(r.kind, 'delete');
    assert.equal(r.env, 'dev');
    assert.deepEqual(r.entries.map((e) => e.path).sort(), plan.entries.map((e) => e.path).sort());
    assert.ok(r.entries.every((e) => e.data && typeof e.data === 'object'));
    assert.ok(!JSON.stringify(r).includes('tok-live-1'));
    for (const [p, d] of others) assert.equal(fake.snapshot().get(p), d, `${p} untouched`);
    for (const e of plan.entries.filter((x) => !x.path.includes('redacted-'))) assert.equal(fake.get(e.path), undefined, e.path);
    assert.equal(fake.get(`${U(PASSKEY)}/Sessions/tok-live-1`), undefined);
});

test('commitDelete: a wrong typed id refuses and keeps the plan; the plan then answers once', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: SURVIVOR, receipt: keeper() }), refusedWith(R().ACCOUNT_CONFIRMATION_MISMATCH));
    assert.equal(fake.log.length, 0);
    assert.equal((await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() })).outcome, 'DELETED');
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), refusedWith(R().ACCOUNT_PLAN_STALE));
    await assert.rejects(admin().commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), refusedWith(R().ACCOUNT_PLAN_STALE), 'another instance never knew the plan');
});

test('commitDelete: a plan expires after ACCOUNT_PLAN_TTL_SECONDS', async () => {
    let t = 1_000_000;
    const a = admin({ now: () => t });
    const plan = await a.planDelete({ accountId: PASSKEY });
    t += (P.ACCOUNT_PLAN_TTL_SECONDS + 1) * 1000;
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), refusedWith(R().ACCOUNT_PLAN_STALE));
    assert.equal(fake.log.length, 0);
});

test('commitDelete: the store changed since the plan (a changed index row, a new document) -> ACCOUNT_PLAN_STALE, no receipt, nothing written', async () => {
    for (const change of [
        () => fake.put('WalletIndex/0xaaa', { descix_user_id: PASSKEY, wallet_address: '0xaaa', linked_at: 'later' }),
        () => fake.put(`${U(PASSKEY)}/Purchases/pu2`, { purchase_price: 0 }),
    ]) {
        seed();
        const a = admin();
        const plan = await a.planDelete({ accountId: PASSKEY });
        change();
        const before = fake.snapshot();
        const k = keeper();
        await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k }), refusedWith(R().ACCOUNT_PLAN_STALE));
        assert.equal(k.kept.size, 0);
        assert.deepEqual(fake.snapshot(), before);
    }
});

test('B2c sessions are deleted BY QUERY: a sign-in or an expiry between plan and commit does not make the delete stale', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    fake.put(`${U(PASSKEY)}/Sessions/tok-new`, { access_token: 'tok-new', provider: 'descix' });
    fake.docs.delete(`${U(PASSKEY)}/Sessions/tok-live-1`);
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.DELETED, res.line);
    assert.equal(fake.get(`${U(PASSKEY)}/Sessions/tok-new`), undefined, 'the session signed in since the plan is deleted too');
    assert.equal(fake.get(U(PASSKEY)), undefined);
});

test('B2c the race: a sign-in and an expiry DURING the irrecoverable owner\'s turn (after the commit re-read) do not strand it: the User owner still deletes; DELETED', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const raceHook = async () => {
        fake.put(`${U(PASSKEY)}/Sessions/tok-race`, { access_token: 'tok-race', provider: 'descix' });
        fake.docs.delete(`${U(PASSKEY)}/Sessions/tok-live-1`);
    };
    const a = admin({ storeOwners: [purchasesOwner(), productsOwner(), walletMaterialOwner({ irrecoverable: true, deleteHook: raceHook })] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.DELETED, `${res.line} ${res.notes.join(' | ')}`);
    assert.equal(res.cause, null);
    assert.equal(fake.get(`Vaults/${PASSKEY}`), undefined);
    assert.equal(fake.get(U(PASSKEY)), undefined, 'the User owner was not stranded by the session change');
    assert.equal(fake.get(`${U(PASSKEY)}/Sessions/tok-race`), undefined, 'the session signed in during the window is deleted by query');
    assert.match(res.notes.join(' '), /user also deleted 1 path\(s\) that appeared since the plan \(deleted by query\): UserCache\/UGFzc2tleUE\/Sessions\/redacted-[0-9a-f]{16}/);
    assert.ok(!res.notes.join(' ').includes('tok-race'), 'named by digest, never the token');
});

test('commitDelete: a plan with blockers is refused with the first code and all of them in details; no receipt, nothing written', async () => {
    walletAnswer = undefined;
    const a = admin();
    const plan = await a.planDelete({ accountId: LEGACY });
    const before = fake.snapshot();
    const k = keeper();
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: LEGACY, receipt: k }), (e) => {
        assert.equal(e.code, plan.blockers[0].code);
        assert.deepEqual(e.details.map((b) => b.code), plan.blockers.map((b) => b.code));
        return true;
    });
    assert.equal(k.kept.size, 0);
    assert.deepEqual(fake.snapshot(), before);
});

test('commitDelete: a blocker that appears after the plan (wallet now holds value) refuses; nothing written', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    walletAnswer = { measured: true, holdsValue: true, summary: '1 POL', scope: SCOPE };
    const before = fake.snapshot();
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), refusedWith(R().ACCOUNT_WALLET_HOLDS_VALUE));
    assert.deepEqual(fake.snapshot(), before);
});

test('the rule is enforced at commit: the account\'s verified email changed after the plan -> ACCOUNT_NOT_IN_RULE, nothing written', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), verified_email: 'bob@example.org' });
    const before = fake.snapshot();
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), refusedWith(R().ACCOUNT_NOT_IN_RULE));
    assert.deepEqual(fake.snapshot(), before);
});

test('receipt-before-write: a save that throws or returns no label writes nothing', async () => {
    for (const save of [() => { throw new Error('disk full'); }, () => '', () => undefined]) {
        seed();
        const a = admin();
        const plan = await a.planDelete({ accountId: PASSKEY });
        const before = fake.snapshot();
        await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: { save } }));
        assert.deepEqual(fake.snapshot(), before);
        assert.equal(fake.log.filter((l) => l.op !== 'receipt').length, 0);
    }
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: {} }), refusedWith(R().ACCOUNT_RECEIPT_INVALID));
});

test('DELETED needs a read-back: the USERS doc delete fails -> PARTIAL; a read-back that fails -> UNVERIFIED; never DELETED', async () => {
    let a = admin();
    let plan = await a.planDelete({ accountId: PASSKEY });
    let usersWrites = 0;
    fake.faults.write = (p) => p === U(PASSKEY) && (usersWrites += 1) > 1; // the stamp lands; the USERS delete fails
    let res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.remaining, [U(PASSKEY)]);
    assert.equal(res.cause.code, R().ACCOUNT_STORE_WRITE_FAILED);

    seed();
    a = admin();
    plan = await a.planDelete({ accountId: PASSKEY });
    let deletes = 0;
    fake.faults.read = (p) => deletes >= 6 && p === U(PASSKEY);
    fake.faults.write = () => { deletes += 1; return false; };
    res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.UNVERIFIED, res.line);
    assert.match(res.line, /^UNVERIFIED: the read-back failed/);
});

test('DELETED needs a read-back: every owner returns without error but one delete did not land -> PARTIAL naming it', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    fake.faults.drop = (p) => p === 'WalletIndex/0xaaa';
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.cause, null, 'no owner threw');
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.remaining, ['WalletIndex/0xaaa']);
    assert.match(res.notes.join(' '), /user reported 1 path\(s\) remaining/);
});

test('a dependent owner that fails stops the sequence: the User owner never runs; NOT_DELETED, the USERS doc intact', async () => {
    const a = admin({ storeOwners: [purchasesOwner({ failDelete: true }), productsOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const before = fake.snapshot();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.NOT_DELETED, res.line);
    assert.deepEqual(fake.snapshot(), before);
    assert.match(res.notes.join(' '), /cloudPurchases failed .* no later owner ran/);
});

test('a dependent owner that reports success but deletes nothing: the User owner refuses to orphan its documents; the read-back says NOT_DELETED', async () => {
    const a = admin({ storeOwners: [purchasesOwner({ lie: true }), productsOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const before = fake.snapshot();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.NOT_DELETED, res.line);
    assert.equal(res.cause.code, R().ACCOUNT_STORE_UNOWNED);
    assert.deepEqual(fake.snapshot(), before);
});

test('userAccountOwner.deleteForUser: expectPaths other than its current footprint -> ACCOUNT_PLAN_STALE before any write', async () => {
    fake.put(`${U(OTHER_PERSON)}/Sessions/x`, { access_token: 'x' });
    const user = { user_id: OTHER_PERSON };
    const fp = await P.userAccountOwner.footprintForUser(user);
    await assert.rejects(P.userAccountOwner.deleteForUser(user, { expectPaths: fp.entries.slice(1).map((e) => e.path) }), refusedWith(R().ACCOUNT_PLAN_STALE));
    await assert.rejects(P.userAccountOwner.deleteForUser(user, {}), refusedWith(R().ACCOUNT_PLAN_STALE));
    assert.equal(fake.log.length, 0);
});

test('a footprint read that fails is a blocker naming the owner (ACCOUNT_STORE_READ_FAILED), never an empty footprint', async () => {
    fake.faults.read = (p) => p === 'SignatureIndex';
    const plan = await admin().planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.blockers.map((b) => [b.owner, b.code]), [['user', R().ACCOUNT_STORE_READ_FAILED]]);
    assert.match(plan.blockers[0].detail, /SignatureIndex/);
});

// ------------------------------------------------------------------------- delete: pre-flight, order, restore

const vaultAdmin = (vault) => admin({ storeOwners: [vault, purchasesOwner(), productsOwner()] });

test('B2b order: dependents first, then the irrecoverable owner, then the User owner (whatever order they were passed in)', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const a = vaultAdmin(walletMaterialOwner({ irrecoverable: true }));
    const plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, 'DELETED', res.line);
    const deletes = fake.log.filter((l) => /delete/.test(l.op)).map((l) => l.path);
    const at = (p) => deletes.indexOf(p);
    assert.ok(at(`${U(PASSKEY)}/Purchases/pu1`) < at(`Vaults/${PASSKEY}`), 'a recoverable dependent before the irrecoverable one');
    assert.ok(at(`Vaults/${PASSKEY}`) < Math.min(...deletes.filter((p) => !p.startsWith('Vaults/') && !p.endsWith('/pu1')).map(at)), 'the irrecoverable one immediately before the User owner');
    assert.equal(deletes.at(-1), U(PASSKEY));
});

test('B2a pre-flight: a User-owner blocker that appears after the commit re-read is refused by the pre-flight BEFORE the first dependent write', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const a = vaultAdmin(walletMaterialOwner({ irrecoverable: true }));
    const plan = await a.planDelete({ accountId: PASSKEY });
    // The receipt is kept after the re-read and before the pre-flight: a role granted then is what the pre-flight must see.
    const k = { kept: new Map(), save(r) { this.kept.set('r1', r); fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), roles: { app_x: { acquired_date: 'now' } } }); return 'r1'; } };
    const before = [...fake.snapshot()].filter(([p]) => p !== U(PASSKEY));
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k }), (e) => refusedWith(R().ACCOUNT_HOLDS_ROLES)(e) && /refused by the User owner before any dependent write \(userAccountOwner\.preflightDelete/.test(e.message) && /Receipt r1 was kept; nothing was written/.test(e.message));
    assert.deepEqual([...fake.snapshot()].filter(([p]) => p !== U(PASSKEY)), before, 'no dependent wrote');
    assert.equal(fake.log.filter((l) => /delete/.test(l.op)).length, 0);
});

test('B2a pre-flight again before the irrecoverable owner: a blocker raised during a dependent\'s turn stops the sequence with the vault intact (PARTIAL, both ways on named)', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const o = purchasesOwner();
    const grantsDuringDelete = { ...o, async deleteForUser(user, opts) { const r = await o.deleteForUser(user, opts); fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), roles: { app_x: { acquired_date: 'now' } } }); return r; } };
    const a = admin({ storeOwners: [walletMaterialOwner({ irrecoverable: true, restore: true }), grantsDuringDelete, productsOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'AAAA' }, 'the irrecoverable store was never touched');
    assert.ok(fake.get(U(PASSKEY)), 'the USERS doc stays');
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.remaining.includes(`${U(PASSKEY)}/Purchases/pu1`), false);
    assert.equal(res.cause.code, R().ACCOUNT_HOLDS_ROLES);
    assert.match(res.notes.join(' '), /pre-flight before the irrecoverable owner 'vault' refused/);
    assert.match(res.line, /Two ways on: finish forward \(planDelete again, then commitDelete\), or restoreDelete\(\{ receipt, confirmAccountId \}\) to re-create nothing: no owner of a deleted entry can restore it\./);
});

/** A PARTIAL delete: the vault (restorable, NOT irrecoverable so it runs before the purchases owner that fails) deleted, the purchases owner failing. */
async function partialDelete({ restore = true } = {}) {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const a = admin({ storeOwners: [walletMaterialOwner({ restore }), purchasesOwner({ failDelete: true }), productsOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const k = keeper();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    return { res, receipt: JSON.parse(JSON.stringify(k.kept.get(res.receiptLabel))), owners: () => [walletMaterialOwner({ restore }), purchasesOwner(), productsOwner()] };
}

test('B2d PARTIAL names the two ways on, with the restorable entries; restoreDelete re-creates them (RESTORED) and the account can then be planned again', async () => {
    const { res, receipt, owners } = await partialDelete();
    assert.deepEqual(res.restorable, [{ owner: 'vault', path: `Vaults/${PASSKEY}` }]);
    assert.match(res.line, /Two ways on: finish forward \(planDelete again, then commitDelete\), or restoreDelete\(\{ receipt, confirmAccountId \}\) to re-create the 1 restorable entry \(vault: Vaults\/UGFzc2tleUE\)\./);
    assert.equal(receipt.planHash, P.deletePlanHash(PASSKEY, receipt.entries), 'the receipt is bound');
    assert.equal(fake.get(`Vaults/${PASSKEY}`), undefined);
    const r = await admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY });
    assert.equal(r.outcome, P.RESTORE_OUTCOME.RESTORED, r.line);
    assert.deepEqual(r.restored, [`Vaults/${PASSKEY}`]);
    assert.deepEqual(r.remaining, []);
    assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'AAAA' });
    assert.match(r.line, /^RESTORED: account UGFzc2tleUE: 1 of 1 absent receipt entry read back restored; the admin_delete stamp is cleared\.$/);
    assert.equal(fake.get(U(PASSKEY)).admin_delete, undefined, 'everything restorable is back: the stamp is cleared');
});

test('a MALFORMED stamp refuses commitDelete (set between plan and commit) and restoreDelete (set after a PARTIAL) with ACCOUNT_STAMP_MALFORMED naming the account; nothing is written', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), admin_delete: { planHash: 7 } });
    const before = fake.snapshot();
    const logged = fake.log.length;
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), (e) => e.code === R().ACCOUNT_STAMP_MALFORMED && e.message.includes(PASSKEY));
    assert.deepEqual(fake.snapshot(), before, 'commitDelete wrote nothing');
    assert.equal(fake.log.length, logged, 'not even a receipt');
    seed();
    const { receipt, owners } = await partialDelete();
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), admin_delete: 'x' });
    const mid = fake.snapshot();
    await assert.rejects(admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY }), (e) => e.code === R().ACCOUNT_STAMP_MALFORMED && e.message.includes(PASSKEY));
    assert.deepEqual(fake.snapshot(), mid, 'restoreDelete wrote nothing');
    assert.equal(fake.get(`Vaults/${PASSKEY}`), undefined, 'the vault was not re-created');
});

test('B2d restoreDelete: entries of an owner without restoreForUser stay absent and are reported (NOT_RESTORED, with the reason)', async () => {
    const { receipt, owners } = await partialDelete({ restore: false });
    const r = await admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY });
    assert.equal(r.outcome, P.RESTORE_OUTCOME.NOT_RESTORED, r.line);
    assert.deepEqual(r.remaining, [{ owner: 'vault', path: `Vaults/${PASSKEY}`, reason: 'vault implements no restoreForUser' }]);
});

test('B2d restoreDelete never overwrites: an entry present again is not absent, the owner is not asked for it, the document is untouched', async () => {
    const { receipt, owners } = await partialDelete();
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'NEWER' });
    const r = await admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY });
    assert.equal(r.outcome, P.RESTORE_OUTCOME.RESTORED, r.line);
    assert.match(r.line, /no receipt entry was absent; nothing to restore/);
    assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'NEWER' });
});

test('B2d restoreDelete refusals, nothing written: a full delete (USERS doc gone), another env/target, an edited receipt, a wrong typed id, an account outside the rule, an unknown owner', async () => {
    const { receipt, owners } = await partialDelete();
    const a = () => admin({ storeOwners: owners() });
    const before = fake.snapshot();
    for (const bad of [{ ...receipt, env: 'prod' }, { ...receipt, target: { ...receipt.target, databaseId: 'descix-prod' } }, { ...receipt, kind: 'merge' }, { ...receipt, planHash: undefined }, null]) {
        await assert.rejects(a().restoreDelete({ receipt: bad, confirmAccountId: PASSKEY }), refusedWith(R().ACCOUNT_RECEIPT_INVALID));
    }
    const edited = structuredClone(receipt);
    edited.entries.find((e) => e.owner === 'vault').data = { encryptedBlob: 'FORGED' };
    await assert.rejects(a().restoreDelete({ receipt: edited, confirmAccountId: PASSKEY }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /edited/.test(e.message));
    const retargeted = structuredClone(receipt);
    retargeted.accountId = BOB;
    await assert.rejects(a().restoreDelete({ receipt: retargeted, confirmAccountId: BOB }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /edited/.test(e.message), 'the account id is bound by the planHash');
    await assert.rejects(a().restoreDelete({ receipt, confirmAccountId: SURVIVOR }), refusedWith(R().ACCOUNT_CONFIRMATION_MISMATCH));
    await assert.rejects(admin({ storeOwners: [purchasesOwner(), productsOwner()] }).restoreDelete({ receipt, confirmAccountId: PASSKEY }), refusedWith(R().ACCOUNT_RECEIPT_INVALID), 'the vault owner is not held');
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), verified_email: 'bob@example.org' });
    await assert.rejects(a().restoreDelete({ receipt, confirmAccountId: PASSKEY }), refusedWith(R().ACCOUNT_NOT_IN_RULE));
    fake.docs.delete(U(PASSKEY));
    await assert.rejects(a().restoreDelete({ receipt, confirmAccountId: PASSKEY }), (e) => refusedWith(R().ACCOUNT_NOT_FOUND)(e) && /a full delete is not undone by this act/.test(e.message));
    const after = fake.snapshot();
    after.set(U(PASSKEY), before.get(U(PASSKEY)));
    assert.deepEqual(after, before, 'nothing but the test\'s own edits changed');
});

// ------------------------------------------------------------------------- delete: staleness, orphans, bound receipts (review round 3)

/** Fail every write of the USERS doc after its first (the admin_delete stamp lands; the USERS delete fails): a PARTIAL that keeps the account. */
const failUsersDeleteAfterStamp = () => { let n = 0; fake.faults.write = (p) => p === U(PASSKEY) && (n += 1) > 1; };
/** A dependent owner wrapper that runs `after` once its own delete returned. */
const afterDelete = (o, after) => ({ ...o, async deleteForUser(user, plan) { const r = await o.deleteForUser(user, plan); await after(); return r; } });

test('NF1 probe 1: the user saves the vault AFTER the receipt and BEFORE the vault delete -> the irrecoverable owner refuses ACCOUNT_PLAN_STALE; the newest vault survives and restoreDelete never rolls it back (negative control: a paths-only owner deletes it and restore plants the old blob)', async () => {
    for (const pathsOnly of [false, true]) {
        seed();
        fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'OLD' });
        const owners = () => [walletMaterialOwner({ irrecoverable: true, restore: true, pathsOnly }), afterDelete(purchasesOwner(), async () => fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'NEWEST' })), productsOwner()];
        const a = admin({ storeOwners: owners() });
        const plan = await a.planDelete({ accountId: PASSKEY });
        assert.equal(plan.entries.find((e) => e.owner === 'vault').dataHash, P.entryDataHash({ encryptedBlob: 'OLD' }), 'the plan records the vault\'s data hash');
        failUsersDeleteAfterStamp();
        const k = keeper();
        const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k });
        fake.faults.write = () => false;
        assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
        const receipt = JSON.parse(JSON.stringify(k.kept.get(res.receiptLabel)));
        assert.equal(receipt.entries.find((e) => e.owner === 'vault').data.encryptedBlob, 'OLD', 'the receipt holds the planned (older) blob');
        const back = await admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY });
        if (!pathsOnly) {
            assert.equal(res.cause.code, R().ACCOUNT_PLAN_STALE, res.notes.join(' | '));
            assert.match(res.notes.join(' '), /vault failed \(ACCOUNT_PLAN_STALE: vault: 1 document\(s\) changed since the plan \(Vaults\/UGFzc2tleUE\)/);
            assert.ok(fake.get(U(PASSKEY)), 'the User owner never ran');
            assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'NEWEST' }, 'the newest vault survives the delete');
            assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'NEWEST' }, 'and the restore (present, never overwritten)');
            assert.equal(back.restored.includes(`Vaults/${PASSKEY}`), false);
        } else {
            assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'OLD' }, 'negative control: the paths-only owner deleted NEWEST and the restore planted the older blob');
        }
    }
});

test('NF1 the irrecoverable owner compares INSIDE its deleting transaction: a save between its own pre-check and the delete is refused (negative control: paths only, the save is lost)', async () => {
    for (const pathsOnly of [false, true]) {
        seed();
        fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'OLD' });
        const a = vaultAdmin(walletMaterialOwner({ irrecoverable: true, pathsOnly, deleteHook: async () => fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'SAVED-IN-THE-WINDOW' }) }));
        const plan = await a.planDelete({ accountId: PASSKEY });
        const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
        if (!pathsOnly) {
            assert.equal(res.cause?.code, R().ACCOUNT_PLAN_STALE, res.line);
            assert.match(res.cause.message, /read in the transaction that would delete it/);
            assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'SAVED-IN-THE-WINDOW' });
            assert.ok(fake.get(U(PASSKEY)), 'the User owner did not run: the account is not stranded without its vault');
        } else {
            assert.equal(fake.get(`Vaults/${PASSKEY}`), undefined, 'negative control: the save in the window was deleted');
        }
    }
});

test('NF1 the User owner compares data too: the USERS doc saved after the receipt (preflight) or during a dependent\'s turn (its own transaction) is ACCOUNT_PLAN_STALE; the USERS doc stays', async () => {
    let a = admin();
    let plan = await a.planDelete({ accountId: PASSKEY });
    const k = { kept: new Map(), save(r) { this.kept.set('r1', r); fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), display_name: 'saved after the receipt' }); return 'r1'; } };
    const before = [...fake.snapshot()].filter(([p]) => p !== U(PASSKEY));
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k }), (e) => refusedWith(R().ACCOUNT_PLAN_STALE)(e) && /UserCache\/UGFzc2tleUE/.test(e.message) && /nothing was written/.test(e.message));
    assert.deepEqual([...fake.snapshot()].filter(([p]) => p !== U(PASSKEY)), before, 'no write at all');
    assert.equal(fake.get(U(PASSKEY)).admin_delete, undefined, 'not even the stamp');

    seed();
    a = admin({ storeOwners: [afterDelete(purchasesOwner(), async () => fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), display_name: 'saved meanwhile' })), productsOwner()] });
    plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.equal(res.cause.code, R().ACCOUNT_PLAN_STALE);
    assert.equal(fake.get(U(PASSKEY)).display_name, 'saved meanwhile', 'the USERS doc and its newest data stay');

    seed();
    a = admin();
    plan = await a.planDelete({ accountId: PASSKEY });
    const db = fake.FakeCacheFirestore.prototype.db;
    const realTx = db.runTransaction;
    let txs = 0;
    db.runTransaction = async (fn) => { if ((txs += 1) === 3) fake.put('WalletIndex/0xaaa', { ...fake.get('WalletIndex/0xaaa'), linked_at: 'relinked meanwhile' }); return realTx(fn); };
    try {
        const r = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
        assert.equal(r.cause?.code, R().ACCOUNT_PLAN_STALE, r.line);
        assert.match(r.cause.message, /WalletIndex\/0xaaa changed since the plan \(read in the transaction that would delete it\)/);
    } finally {
        db.runTransaction = realTx;
    }
    assert.equal(fake.get('WalletIndex/0xaaa').linked_at, 'relinked meanwhile', 'an index row changed inside the window is left');
    assert.ok(fake.get(U(PASSKEY)), 'and the USERS doc stays');

    // inside the User owner's own turn, after its pre-check: the USERS doc saved just before its deleting transaction
    seed();
    a = admin();
    plan = await a.planDelete({ accountId: PASSKEY });
    let saved = false;
    db.runTransaction = async (fn) => {
        const rowsGone = ['WalletIndex/0xaaa', 'SignatureIndex/abc123'].every((x) => fake.get(x) === undefined);
        if (rowsGone && !saved && fake.get(U(PASSKEY))) { saved = true; fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), display_name: 'saved in the last window' }); }
        return realTx(fn);
    };
    try {
        const r = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
        assert.ok(saved, 'the fixture reached the window');
        assert.equal(r.cause?.code, R().ACCOUNT_PLAN_STALE, r.line);
        assert.match(r.cause.message, /UserCache\/UGFzc2tleUE changed since the plan \(read in the transaction that would delete it\)/);
    } finally {
        db.runTransaction = realTx;
    }
    assert.equal(fake.get(U(PASSKEY)).display_name, 'saved in the last window', 'the USERS doc saved in the window is never deleted');
});

test('NF1 deletePlanHash already covers every entry\'s data: the commit re-read refuses a change made BEFORE it; the per-owner comparison closes the window after it', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'OLD' });
    const a = vaultAdmin(walletMaterialOwner({ irrecoverable: true }));
    const plan = await a.planDelete({ accountId: PASSKEY });
    const entries = plan.entries.map((e) => (e.owner === 'vault' ? { ...e, data: { encryptedBlob: 'NEW' } } : e));
    assert.notEqual(P.deletePlanHash(PASSKEY, entries), plan.planHash, 'a data change changes the plan hash');
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'NEW' });
    await assert.rejects(a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() }), refusedWith(R().ACCOUNT_PLAN_STALE));
    assert.equal(fake.log.length, 0, 'refused at the re-read, before the receipt');
});

test('NF3 probe 2: the vault re-created after the vault delete while the User owner then deletes the account -> PARTIAL with the orphaned vault named; neither finish forward nor restoreDelete is offered (both refuse)', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'OLD' });
    const vault = walletMaterialOwner({ irrecoverable: true, restore: true });
    const recreates = { ...vault, async deleteForUser(user, plan) { const r = await vault.deleteForUser(user, plan); fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'PUT-AFTER-DELETE' }); return r; } };
    const a = vaultAdmin(recreates);
    const plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(fake.get(U(PASSKEY)), undefined, 'the account is deleted');
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.equal(res.accountDeleted, true);
    assert.deepEqual(res.orphaned, [{ owner: 'vault', path: `Vaults/${PASSKEY}` }]);
    assert.deepEqual(res.restorable, []);
    assert.match(res.line, /^PARTIAL: account UGFzc2tleUE is deleted \(its USERS doc is gone\), but 1 document\(s\) were left behind: vault: Vaults\/UGFzc2tleUE\. They are orphaned: neither finish forward nor restoreDelete applies to a deleted account\. Receipt kept: receipt-1\.$/);
    assert.doesNotMatch(res.line, /Two ways on/);
    await assert.rejects(admin({ storeOwners: [vault, purchasesOwner(), productsOwner()] }).planDelete({ accountId: PASSKEY }), refusedWith(R().ACCOUNT_NOT_FOUND), 'finish forward refuses');
});

test('NF3 the final read-back asks EVERY owner, not only those with planned paths: a document that appears for the account at an owner with nothing planned is orphaned, never DELETED', async () => {
    const a = admin({ storeOwners: [afterDelete(purchasesOwner(), async () => fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'APPEARED' })), productsOwner(), walletMaterialOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    assert.equal(plan.entries.some((e) => e.owner === 'vault'), false, 'the vault owner planned nothing');
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.orphaned, [{ owner: 'vault', path: `Vaults/${PASSKEY}` }]);
    assert.deepEqual(res.remaining, [], 'every planned path is gone; the orphan was never planned');
});

test('NF3 a PARTIAL whose USERS doc stands still names the two ways on (negative control of the orphan wording)', async () => {
    failUsersDeleteAfterStamp();
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL);
    assert.equal(res.accountDeleted, false);
    assert.deepEqual(res.orphaned, []);
    assert.match(res.line, /its USERS doc stands\. Receipt kept: receipt-1\. Two ways on/);
});

test('NF4 commitDelete stamps the USERS doc admin_delete { planHash, startedAt } after the receipt and before the first dependent write', async () => {
    let t = Date.UTC(2026, 10, 13, 12, 0, 0);
    const a = admin({ now: () => t });
    const plan = await a.planDelete({ accountId: PASSKEY });
    failUsersDeleteAfterStamp();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL);
    assert.deepEqual(fake.get(U(PASSKEY)).admin_delete, { planHash: plan.planHash, startedAt: '2026-11-13T12:00:00.000Z' });
    const order = fake.log.map((l) => `${l.op} ${l.path}`);
    assert.deepEqual(order.slice(0, 3), ['receipt receipt-1', `tx-update ${U(PASSKEY)}`, `delete ${U(PASSKEY)}/Purchases/pu1`]);
    t += 1;
});

test('NF4 probe 4: a hand-made receipt with a recomputed planHash cannot plant a vault for another in-rule account (no admin_delete stamp of that plan); nothing written', async () => {
    const OTHER = SURVIVOR;
    const entries = [{ owner: 'vault', path: `Vaults/${OTHER}`, kind: 'vault', summary: 'x', data: { encryptedBlob: 'PLANTED' } }];
    entries[0].dataHash = P.entryDataHash(entries[0].data);
    const receipt = { kind: 'delete', env: 'dev', target: TARGET, accountId: OTHER, entries, planHash: P.deletePlanHash(OTHER, entries) };
    const before = fake.snapshot();
    await assert.rejects(vaultAdmin(walletMaterialOwner({ restore: true })).restoreDelete({ receipt, confirmAccountId: OTHER }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /carries no admin_delete stamp/.test(e.message));
    assert.deepEqual(fake.snapshot(), before);
    assert.equal(fake.get(`Vaults/${OTHER}`), undefined);
    // the stamp of ANOTHER plan does not admit it either
    fake.put(U(OTHER), { ...fake.get(U(OTHER)), admin_delete: { planHash: 'f'.repeat(64), startedAt: '2026-11-13T00:00:00.000Z' } });
    await assert.rejects(vaultAdmin(walletMaterialOwner({ restore: true })).restoreDelete({ receipt, confirmAccountId: OTHER }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /the admin_delete stamp of another plan/.test(e.message));
    assert.equal(fake.get(`Vaults/${OTHER}`), undefined);
    // an entry whose dataHash does not match its data is an edited receipt
    const bent = structuredClone(receipt);
    bent.entries[0].dataHash = P.entryDataHash({ encryptedBlob: 'OTHER' });
    await assert.rejects(vaultAdmin(walletMaterialOwner({ restore: true })).restoreDelete({ receipt: bent, confirmAccountId: OTHER }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /dataHash does not match its data/.test(e.message));
});

test('NF4 crash between the vault delete and the User owner: a FRESH instance restores from the receipt alone (the stamp names its plan), then clears the stamp; the account is usable throughout', async () => {
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'OLD' });
    const crashing = walletMaterialOwner({ irrecoverable: true, restore: true });
    const a = vaultAdmin({ ...crashing, async deleteForUser(user, plan) { await crashing.deleteForUser(user, plan); throw new Error('process exit (simulated crash)'); } });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const k = keeper();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k });
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.equal(fake.get(U(PASSKEY)).admin_delete.planHash, plan.planHash);
    const stamped = await P.User.from_firestore(PASSKEY);
    assert.equal(stamped.id, PASSKEY, 'a stamped account hydrates');
    assert.equal('admin_delete' in stamped.to_dict(), false, 'and no whole-document write carries the stamp');
    await stamped.to_firestore();
    assert.equal(fake.get(U(PASSKEY)).admin_delete.planHash, plan.planHash, 'a whole-document write leaves the stamp');
    assert.equal((await P.userAccountOwner.account(PASSKEY)).adminDelete.planHash, plan.planHash);
    const receipt = JSON.parse(JSON.stringify(k.kept.get(res.receiptLabel)));
    const fresh = vaultAdmin(walletMaterialOwner({ irrecoverable: true, restore: true }));
    const back = await fresh.restoreDelete({ receipt, confirmAccountId: PASSKEY });
    assert.equal(back.outcome, P.RESTORE_OUTCOME.PARTIAL, back.line);
    assert.deepEqual(back.restored, [`Vaults/${PASSKEY}`]);
    assert.deepEqual(back.remaining, [{ owner: 'cloudPurchases', path: `${U(PASSKEY)}/Purchases/pu1`, reason: 'cloudPurchases implements no restoreForUser' }]);
    assert.equal(back.stamp, 'cleared', 'everything RESTORABLE is back: the stamp comes off');
    assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'OLD' });
    assert.equal(fake.get(U(PASSKEY)).admin_delete, undefined);
    await assert.rejects(fresh.restoreDelete({ receipt, confirmAccountId: PASSKEY }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /no admin_delete stamp/.test(e.message), 'a used receipt cannot be replayed');
});

test('NF4 finish forward over a stamp: re-plan and re-commit replace the stamp with the new plan\'s; the earlier receipt no longer restores', async () => {
    const { receipt, owners } = await partialDelete();
    assert.equal(fake.get(U(PASSKEY)).admin_delete.planHash, receipt.planHash);
    const a = admin({ storeOwners: owners() });
    const plan2 = await a.planDelete({ accountId: PASSKEY });
    assert.notEqual(plan2.planHash, receipt.planHash);
    assert.equal(plan2.entries.find((e) => e.owner === 'user' && e.kind === 'user').data.admin_delete, undefined, 'the plan does not record the stamp as account data');
    failUsersDeleteAfterStamp();
    const res = await a.commitDelete({ planId: plan2.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    fake.faults.write = () => false;
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.equal(fake.get(U(PASSKEY)).admin_delete.planHash, plan2.planHash, 'the existing stamp was accepted and replaced');
    await assert.rejects(admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /another plan/.test(e.message));
});

test('NF4 a delete that deleted nothing clears its stamp (NOT_DELETED); the stamp writer and clearer are the User owner\'s, transactional, and refuse a missing account', async () => {
    const a = admin({ storeOwners: [purchasesOwner({ failDelete: true }), productsOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    assert.equal(res.outcome, P.DELETE_OUTCOME.NOT_DELETED);
    assert.equal(fake.get(U(PASSKEY)).admin_delete, undefined);
    assert.match(res.notes.join(' '), /nothing was deleted; the admin_delete stamp was cleared/);
    const user = { user_id: BOB };
    await assert.rejects(P.userAccountOwner.stampDelete({ user_id: 'Tm9uZQ' }, { planHash: 'a'.repeat(64), startedAt: '2026-11-13T00:00:00.000Z', expectData: {} }), refusedWith(R().ACCOUNT_NOT_FOUND));
    await assert.rejects(P.userAccountOwner.stampDelete(user, { planHash: 'nope', startedAt: '2026-11-13T00:00:00.000Z', expectData: {} }), refusedWith(R().ACCOUNT_PLAN_STALE));
    await assert.rejects(P.userAccountOwner.stampDelete(user, { planHash: 'a'.repeat(64), startedAt: '2026-11-13T00:00:00.000Z', expectData: { [U(BOB)]: P.entryDataHash({ other: 1 }) } }), refusedWith(R().ACCOUNT_PLAN_STALE));
    assert.equal(fake.get(U(BOB)).admin_delete, undefined, 'refused: nothing written');
    fake.put(U(BOB), { ...fake.get(U(BOB)), admin_delete: { planHash: 'b'.repeat(64), startedAt: 'x' } });
    assert.equal(await P.userAccountOwner.clearDeleteStamp(user, { planHash: 'a'.repeat(64) }), false, 'another plan\'s stamp is left');
    assert.ok(fake.get(U(BOB)).admin_delete);
    assert.equal(await P.userAccountOwner.clearDeleteStamp(user, { planHash: 'b'.repeat(64) }), true);
    assert.equal(fake.get(U(BOB)).admin_delete, undefined);
});

test('NF5 (mutant N23) restoreDelete: a FAILED "before" footprint read refuses ACCOUNT_STORE_READ_FAILED before any write; it is never read as absent', async () => {
    const { receipt, owners } = await partialDelete();
    assert.equal(fake.get(`Vaults/${PASSKEY}`), undefined);
    let vaultReads = 0;
    fake.faults.read = (p) => p === `Vaults/${PASSKEY}` && (vaultReads += 1) === 1;
    fake.log.length = 0;
    await assert.rejects(admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY }), (e) => refusedWith(R().ACCOUNT_STORE_READ_FAILED)(e) && /vault's footprint read failed/.test(e.message) && /nothing was written/.test(e.message));
    assert.equal(vaultReads, 1, 'the failing read is the "before" read');
    assert.equal(fake.get(`Vaults/${PASSKEY}`), undefined, 'nothing was restored');
    assert.deepEqual(fake.log, [], 'no write at all');
    fake.faults.read = () => false;
    assert.equal((await admin({ storeOwners: owners() }).restoreDelete({ receipt, confirmAccountId: PASSKEY })).outcome, P.RESTORE_OUTCOME.RESTORED, 'negative control: with the read answering, the same receipt restores');
});

test('NF2 notMeasured: always present at the plan\'s top level, built in one place; a vault-like owner\'s unmeasuredNote is carried; the shape rule validates the note', async () => {
    const NOTE = 'this vault may hold imported wallets on other chains (for example Bitcoin) and external wallet cards; their value is not measured';
    fake.put(`Vaults/${PASSKEY}`, { encryptedBlob: 'AAAA' });
    const plan = await vaultAdmin(walletMaterialOwner({ irrecoverable: true, unmeasuredNote: NOTE })).planDelete({ accountId: PASSKEY });
    assert.deepEqual(plan.notMeasured, [
        'wallet 0xaaa: value outside the reading\'s scope (wallet.scope) was not measured: any EVM network the scope does not name, and any token it does not cover',
        `vault: Vaults/UGFzc2tleUE: ${NOTE}`,
    ]);
    assert.deepEqual(plan.wallet.notMeasured, plan.notMeasured);
    assert.deepEqual(plan.wallet.walletMaterial.find((w) => w.owner === 'vault'), { owner: 'vault', path: `Vaults/${PASSKEY}`, unmeasuredNote: NOTE });
    walletAnswer = () => { throw new Error('rpc down'); };
    assert.match((await vaultAdmin(walletMaterialOwner({ irrecoverable: true })).planDelete({ accountId: PASSKEY })).notMeasured[0], /^wallet 0xaaa: not measured at all \(wallet\.failure\)$/);
    const fp = { entries: [{ path: 'Vaults/x', kind: 'vault', summary: '', data: {}, unmeasuredNote: NOTE }], leftovers: [], blockers: [] };
    assert.match(P.footprintViolation(fp), /unmeasuredNote but is not walletMaterial/);
    assert.match(P.footprintViolation({ ...fp, entries: [{ ...fp.entries[0], walletMaterial: true, unmeasuredNote: ' ' }] }), /not a non-empty string/);
    assert.equal(P.footprintViolation({ ...fp, entries: [{ ...fp.entries[0], walletMaterial: true }] }), null, 'negative control: a note on wallet material passes');
});

/** A device-login-like owner whose document id IS the device code (Cloud's DeviceLoginRequests); `secret` names it by secretPath. */
function deviceLoginOwner({ secret = true, declare = secret, collection = 'DeviceLoginRequests', withField = true } = {}) {
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const rows = async (user) => (await ownerRead(collection, () => db().collection(collection).where('user_id', '==', user.user_id).limit(P.ACCOUNT_READ_LIMIT).get())).docs;
    const pub = (d) => (secret ? P.secretPath(collection, d.id) : d.ref.path);
    const fp = async (user) => ({ entries: (await rows(user)).map((d) => ({ path: pub(d), kind: 'device_login', summary: 'a device login', data: P.receiptData(d.data()), ...(secret ? { pathIsSecret: true } : {}) })), leftovers: [], blockers: [] });
    return {
        name: 'deviceLogin',
        ...(declare ? { credentialIdCollections: [collection] } : {}),
        storeTarget: () => ({ databaseId: db().databaseId }),
        footprintForUser: fp,
        async deleteForUser(user, plan = {}) {
            const docs = await rows(user);
            P.assertDeletePlanCurrent('deviceLogin', (await fp(user)).entries, plan);
            // the real path is resolved privately, from this re-read; never from the plan
            for (const d of docs) if (plan.expectPaths.includes(pub(d))) await d.ref.delete();
            const left = new Set((await rows(user)).map(pub));
            return { deleted: plan.expectPaths.filter((p) => !left.has(p)), remaining: plan.expectPaths.filter((p) => left.has(p)) };
        },
        _withField: withField,
    };
}

test('NF7 secretPath: ONE digest form (the User owner\'s sessions use it); a device code never appears in a plan, receipt or line; the orchestrator refuses a declared credential collection named by its raw id', async () => {
    assert.equal(P.secretPath('DeviceLoginRequests', 'dc-live-123'), `DeviceLoginRequests/redacted-${crypto.createHash('sha256').update('dc-live-123').digest('hex').slice(0, 16)}`);
    assert.ok(P.isSecretPath(P.secretPath('A/b/C', 'x')));
    assert.throws(() => P.secretPath('A/b', 'x'), /collection path/);
    assert.throws(() => P.secretPath('A', ''), /document id/);
    const plan0 = await admin().planDelete({ accountId: PASSKEY });
    const session = plan0.entries.find((e) => e.kind === 'session');
    assert.equal(session.path, P.secretPath(`${U(PASSKEY)}/Sessions`, 'tok-live-1'));
    assert.equal(session.pathIsSecret, true);
    fake.put('DeviceLoginRequests/dc-live-123', { device_code: 'dc-live-123', user_code: 'ABCD', user_id: PASSKEY, status: 'complete' });
    const a = admin({ storeOwners: [purchasesOwner(), productsOwner(), deviceLoginOwner()] });
    const plan = await a.planDelete({ accountId: PASSKEY });
    const k = keeper();
    const res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: k });
    assert.equal(res.outcome, P.DELETE_OUTCOME.DELETED, `${res.line} ${res.notes.join(' | ')}`);
    assert.equal(fake.get('DeviceLoginRequests/dc-live-123'), undefined, 'deleted through the privately resolved path');
    for (const shown of [plan, k.kept.get(res.receiptLabel), res]) assert.ok(!JSON.stringify(shown).includes('dc-live-123'), 'the device code is never shown');
    seed();
    fake.put('DeviceLoginRequests/dc-live-123', { device_code: 'dc-live-123', user_id: PASSKEY });
    await assert.rejects(admin({ storeOwners: [purchasesOwner(), productsOwner(), deviceLoginOwner({ secret: false, declare: true })] }).planDelete({ accountId: PASSKEY }), /malformed footprint: .*DeviceLoginRequests, a collection whose document id is a credential/);
    assert.throws(() => admin({ storeOwners: [{ ...deviceLoginOwner(), credentialIdCollections: ['A/B'] }] }), /credentialIdCollections must be an array of collection ids/);
});

test('NF7 checker (n): a path naming a credential its document holds is RED (Cloud\'s DeviceLoginRequests/<device_code>); an undeclared secret collection or a declared one with raw ids is RED; the secretPath owner passes', async () => {
    const seedRows = () => {
        for (const [id, uid] of [['dc-a', PASSKEY], ['dc-b', BYSTANDER_A], ['dc-c', BYSTANDER_B], ['dc-d', BYSTANDER_C]]) fake.put(`DeviceLoginRequests/${id}`, { device_code: id, user_id: uid });
    };
    const fixture = fx({ user: PASSKEY_USER, snapshot: () => new Map([...fake.docs].map(([p, d]) => { const m = /^DeviceLoginRequests\/(.+)$/.exec(p); return [m ? P.secretPath('DeviceLoginRequests', m[1]) : p, d]; })) });
    seedRows();
    assert.equal(statuses(await P.assertAccountStoreOwnerConforms(deviceLoginOwner(), fixture)).n, 'passed');
    seed(); seedRows();
    const raw = fx({ user: PASSKEY_USER, snapshot: () => new Map(fake.docs) });
    await assert.rejects(P.assertAccountStoreOwnerConforms(deviceLoginOwner({ secret: false, declare: false }), raw), (e) => nonConforming('n', /has a segment equal to a credential its document holds/)(e) && !e.message.includes('dc-a'), 'the reviewer\'s finding: the document id IS the device code; the failure never prints it');
    seed(); seedRows();
    await assert.rejects(P.assertAccountStoreOwnerConforms(deviceLoginOwner({ secret: false, declare: true }), raw), nonConforming('n', /declared in credentialIdCollections, is not a secretPath/));
    seed(); seedRows();
    await assert.rejects(P.assertAccountStoreOwnerConforms(deviceLoginOwner({ secret: true, declare: false }), fixture), nonConforming('n', /credentialIdCollections does not declare DeviceLoginRequests/));
    // an auth code: the id is the credential and NO field holds it, so only the declaration can catch it
    seed();
    for (const [id, uid] of [['ac-a', PASSKEY], ['ac-b', BYSTANDER_A], ['ac-c', BYSTANDER_B], ['ac-d', BYSTANDER_C]]) fake.put(`OAuthAuthCodes/${id}`, { client_id: 'c', user_id: uid });
    const codes = fx({ user: PASSKEY_USER, snapshot: () => new Map(fake.docs) });
    assert.equal(statuses(await P.assertAccountStoreOwnerConforms(deviceLoginOwner({ secret: false, declare: false, collection: 'OAuthAuthCodes' }), codes)).n, 'passed', 'undeclared and field-less: the checker cannot see it (why the owner must declare)');
    seed();
    for (const [id, uid] of [['ac-a', PASSKEY], ['ac-b', BYSTANDER_A], ['ac-c', BYSTANDER_B], ['ac-d', BYSTANDER_C]]) fake.put(`OAuthAuthCodes/${id}`, { client_id: 'c', user_id: uid });
    await assert.rejects(P.assertAccountStoreOwnerConforms(deviceLoginOwner({ secret: false, declare: true, collection: 'OAuthAuthCodes' }), codes), nonConforming('n', /OAuthAuthCodes, declared in credentialIdCollections, is not a secretPath/));
});

// ------------------------------------------------------------------------- merge

const mergeAdmin = (o = {}) => admin({ storeOwners: [purchasesOwner(), productsOwner()], ...o });

const SIGN_IN_STAYS = 'the legacy wallet remains a sign-in identity until its services are re-keyed';

test('planMerge: the legacy email-keyed record into its passkey account: moves, and what stays (sessions, wallet, its index rows); no revokes; writes nothing', async () => {
    fake.put(`${U(LEGACY)}/Purchases/lp1`, { purchase_price: 0 });
    fake.put('SignatureIndex/leg1', { user_id: LEGACY, signature_id: 'l1', wallet_address: '0xbbb' });
    const before = fake.snapshot();
    const plan = await mergeAdmin({ storeOwners: [purchasesOwner(), productsOwner(), leftoversOwner()] }).planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    assert.equal(plan.refused, false, JSON.stringify(plan.blockers));
    const moves = plan.moves.map((m) => [m.owner, m.path, m.field, m.key ?? null, m.from, typeof m.to === 'string' ? m.to : 'value']);
    assert.deepEqual(moves, [
        ['products', 'Community/egpt/Apps/egpt-godsworld', 'owner_id', null, LEGACY, SURVIVOR],
        ['user', U(SURVIVOR), 'roles', 'community_egpt_chat', null, 'value'],
        ['user', emailRow, 'descix_user_id', null, null, SURVIVOR],
        ['user', U(LEGACY), 'migrated_to', null, null, SURVIVOR],
    ]);
    assert.equal('revokes' in plan, false, 'merge v1 revokes nothing');
    const why = (re) => plan.leftovers.filter((l) => re.test(l.what));
    const session = why(/\/Sessions\/redacted-/);
    assert.equal(session.length, 1);
    assert.match(session[0].what, /^UserCache\/operator@example\.org\/Sessions\/redacted-[0-9a-f]{16}$/);
    for (const re of [/\/Sessions\//, /^wallet_address 0xbbb$/, /^WalletIndex\/0xbbb$/, /^SignatureIndex\/leg1$/]) {
        assert.equal(why(re).length, 1, String(re));
        assert.equal(why(re)[0].why, SIGN_IN_STAYS, String(re));
        assert.equal(why(re)[0].owner, 'user');
    }
    assert.ok(!JSON.stringify(plan).includes('tok-legacy'), 'a session leftover names a digest, never the token');
    const stays = plan.leftovers.map((l) => l.what).join(' | ');
    assert.match(stays, /ProviderIndex\/google_123/);
    assert.match(stays, /role community_daita_chat/, 'a role the survivor holds keeps the survivor\'s grant');
    assert.match(stays, /UserCache\/operator@example\.org\/Purchases\/lp1/, 'an owner without merge methods lists its footprint entries as staying');
    assert.ok(plan.leftovers.some((l) => l.owner === 'unread' && l.what === 'Google Groups membership'), 'and its own leftovers');
    assert.deepEqual(fake.snapshot(), before);
    assert.equal(fake.log.length, 0);
});

/** Red when a merge touched any session of the from-record: every one is still there, byte for byte, and no write named one. */
function assertFromSessionsIntact(before) {
    const prefix = `${U(LEGACY)}/Sessions/`;
    const sessions = (m) => [...m].filter(([p]) => p.startsWith(prefix));
    assert.ok(sessions(before).length > 0, 'the fixture has a from-record session to protect');
    assert.deepEqual(sessions(fake.snapshot()), sessions(before), 'a merge never revokes or rewrites a session of the from-record');
    assert.deepEqual(fake.log.filter((l) => l.path.startsWith(prefix)), [], 'a merge writes no session of the from-record');
}

test('commitMerge: the from-record keeps every session (negative control: a merge that revokes one is RED)', async () => {
    let before = fake.snapshot();
    let a = mergeAdmin();
    let plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    assert.equal((await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() })).outcome, 'MERGED');
    assertFromSessionsIntact(before);

    seed();
    before = fake.snapshot();
    const revoking = { ...P.userAccountOwner, async mergeForUser(pair, opts) {
        await fake.FakeCacheFirestore.prototype.db.doc(`${U(LEGACY)}/Sessions/tok-legacy`).delete();
        return P.userAccountOwner.mergeForUser(pair, opts);
    } };
    a = mergeAdmin({ userOwner: revoking });
    plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() });
    assert.throws(() => assertFromSessionsIntact(before), /never revokes|writes no session/);
});

test('commitMerge: MERGED; receipt before any write; roles unioned, email row moved, record marked migrated last; sessions and the wallet stay', async () => {
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const k = keeper();
    const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: k });
    assert.equal(res.outcome, P.MERGE_OUTCOME.MERGED, res.line);
    assert.equal(fake.log[0].op, 'receipt');
    const writes = fake.log.filter((l) => l.op !== 'receipt').map((l) => l.path);
    assert.equal(writes[0], 'Community/egpt/Apps/egpt-godsworld', 'the dependent owner moves first');
    assert.equal(writes.at(-1), U(LEGACY), 'the migration mark is the last write');
    const survivor = fake.get(U(SURVIVOR));
    assert.deepEqual(Object.keys(survivor.roles).sort(), ['community_daita_chat', 'community_egpt_chat']);
    assert.equal(fake.get(emailRow).descix_user_id, SURVIVOR);
    const legacy = fake.get(U(LEGACY));
    assert.equal(legacy.migrated_to, SURVIVOR);
    assert.ok(legacy.migrated_at && typeof legacy.migrated_at.toDate === 'function');
    assert.equal(legacy.wallet_address, '0xbbb');
    assert.equal(fake.get('WalletIndex/0xbbb').descix_user_id, LEGACY, 'WalletIndex stays on the record');
    assert.equal(fake.get('ProviderIndex/google_123').descix_user_id, LEGACY);
    assert.equal(fake.get(`${U(LEGACY)}/Sessions/tok-legacy`).access_token, 'tok-legacy', 'the record\'s sessions stay: the legacy wallet is still a sign-in identity');
    assert.equal(fake.get('Community/egpt/Apps/egpt-godsworld').owner_id, SURVIVOR);
    const r = k.kept.get(res.receiptLabel);
    assert.equal(r.kind, 'merge');
    assert.equal(r.moves.length, 4);
    assert.equal('revokes' in r, false);
    assert.ok(r.leftovers.some((l) => /\/Sessions\/redacted-/.test(l.what)));
    assert.ok(!JSON.stringify(r).includes('tok-legacy'));
    assert.match(res.line, /^MERGED: .*4 of 4 planned move\(s\) read back done/);
});

test('userAccountOwner.footprintForMerge: a completed merge lists no move (the record is migrated: a blocker, not a pending migrated_to move)', async () => {
    const pair = { from: { user_id: LEGACY }, into: { user_id: SURVIVOR } };
    assert.equal((await P.userAccountOwner.footprintForMerge(pair)).entries.length, 3);
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() });
    const after = await P.userAccountOwner.footprintForMerge(pair);
    assert.deepEqual(after.entries, []);
    assert.deepEqual(after.blockers.map((b) => b.code), [R().ACCOUNT_MERGE_ALREADY_MIGRATED]);
});

test('merge preconditions are coded: same record, email mismatch, target not passkey, already migrated, the email row held by a third account', async () => {
    await assert.rejects(mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: LEGACY }), refusedWith(R().ACCOUNT_MERGE_SAME_RECORD));
    const codes = async (from, into) => (await mergeAdmin().planMerge({ fromAccountId: from, intoAccountId: into })).blockers.map((b) => b.code);
    assert.deepEqual(await codes(PASSKEY, SURVIVOR), [R().ACCOUNT_MERGE_EMAIL_MISMATCH, R().ACCOUNT_MERGE_SOURCE_NOT_LEGACY], 'operator+test@ is not operator@, and a passkey account is not a legacy record');
    assert.deepEqual(await codes(SURVIVOR, LEGACY), [R().ACCOUNT_MERGE_EMAIL_MISMATCH, R().ACCOUNT_MERGE_TARGET_NOT_PASSKEY, R().ACCOUNT_MERGE_SOURCE_NOT_LEGACY], 'the email-keyed record has no verified email and is not a passkey account');
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), auth_providers: ['discord'] });
    fake.put(U(LEGACY), { ...fake.get(U(LEGACY)), verified_email: 'operator+test@example.org' });
    assert.deepEqual(await codes(LEGACY, PASSKEY), [R().ACCOUNT_MERGE_TARGET_NOT_PASSKEY], 'a same-email target without the powch provider');
    seed();
    fake.put(U(LEGACY), { ...fake.get(U(LEGACY)), migrated_to: 'c29tZW9uZQ' });
    assert.deepEqual(await codes(LEGACY, SURVIVOR), [R().ACCOUNT_MERGE_ALREADY_MIGRATED]);
    seed();
    fake.put(emailRow, { descix_user_id: BOB, provider_type: 'email' });
    assert.deepEqual(await codes(LEGACY, SURVIVOR), [R().ACCOUNT_MERGE_EMAIL_MISMATCH]);
    seed();
    assert.deepEqual(await codes(LEGACY, SURVIVOR), [], 'positive control: the genuine pair has no blocker');
});

test('a merge whose record or surviving account carries the delete stamp is ACCOUNT_MERGE_DELETE_IN_PROGRESS; a malformed stamp refuses the plan ACCOUNT_STAMP_MALFORMED', async () => {
    const codes = async () => (await mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR })).blockers.map((b) => b.code);
    const stamp = { planHash: 'c'.repeat(64), startedAt: '2026-11-18T00:00:00.000Z' };
    fake.put(U(LEGACY), { ...fake.get(U(LEGACY)), admin_delete: stamp });
    assert.deepEqual(await codes(), [R().ACCOUNT_MERGE_DELETE_IN_PROGRESS], 'the record to merge is being deleted');
    seed();
    fake.put(U(SURVIVOR), { ...fake.get(U(SURVIVOR)), admin_delete: stamp });
    assert.deepEqual(await codes(), [R().ACCOUNT_MERGE_DELETE_IN_PROGRESS], 'the surviving account is being deleted');
    seed();
    fake.put(U(SURVIVOR), { ...fake.get(U(SURVIVOR)), admin_delete: true });
    await assert.rejects(mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR }), refusedWith(R().ACCOUNT_STAMP_MALFORMED));
    seed();
    assert.deepEqual(await codes(), [], 'negative control: no stamp, no blocker');
});

test('S1 merge source must be LEGACY: a record with the powch provider or a passkey credential is ACCOUNT_MERGE_SOURCE_NOT_LEGACY, at plan and at the User owner\'s own turn', async () => {
    // A second passkey account of operator@example.org (same verified email): every other precondition holds.
    const TWIN = 'VHdpbg';
    fake.put(U(TWIN), { id: TWIN, auth_providers: ['powch'], user_info: { credentialId: TWIN }, verified_email: 'operator@example.org' });
    const plan = await mergeAdmin().planMerge({ fromAccountId: TWIN, intoAccountId: SURVIVOR });
    assert.deepEqual(plan.blockers.map((b) => b.code), [R().ACCOUNT_MERGE_SOURCE_NOT_LEGACY]);
    fake.put(U(TWIN), { ...fake.get(U(TWIN)), auth_providers: ['powch'], user_info: {} });
    assert.deepEqual((await mergeAdmin().planMerge({ fromAccountId: TWIN, intoAccountId: SURVIVOR })).blockers.map((b) => b.code), [R().ACCOUNT_MERGE_SOURCE_NOT_LEGACY], 'the powch provider alone');
    fake.put(U(TWIN), { ...fake.get(U(TWIN)), auth_providers: ['google'] });
    assert.deepEqual((await mergeAdmin().planMerge({ fromAccountId: TWIN, intoAccountId: SURVIVOR })).blockers, [], 'negative control: a google-only record is legacy');
    // At the User owner's turn: the record became a passkey account after the plan.
    const before = fake.snapshot();
    const k = keeper();
    const pair = { from: { user_id: TWIN }, into: { user_id: SURVIVOR } };
    const fp = await P.userAccountOwner.footprintForMerge(pair);
    fake.put(U(TWIN), { ...fake.get(U(TWIN)), auth_providers: ['powch'] });
    await assert.rejects(P.userAccountOwner.mergeForUser(pair, { expectPaths: [...new Set(fp.entries.map((e) => e.path))] }), refusedWith(R().ACCOUNT_MERGE_SOURCE_NOT_LEGACY));
    assert.equal(k.kept.size, 0);
    assert.deepEqual([...fake.snapshot()].filter(([p]) => p !== U(TWIN)), [...before].filter(([p]) => p !== U(TWIN)));
});

test('M5 the email rule is enforced on the INTO side of a merge too, at plan and at commit (a record keyed by an address outside the rule)', async () => {
    // from: an email-keyed record whose verified email is the rule's; into: the passkey account of the keyed address.
    const KEYED = 'bob@example.org';
    const BOBPK = 'Qm9iUGs';
    fake.put(U(KEYED), { id: KEYED, auth_providers: ['google'], verified_email: 'operator@example.org' });
    fake.put(U(BOBPK), { id: BOBPK, auth_providers: ['powch'], user_info: { credentialId: BOBPK }, verified_email: 'bob@example.org' });
    await assert.rejects(mergeAdmin().planMerge({ fromAccountId: KEYED, intoAccountId: BOBPK }), (e) => refusedWith(R().ACCOUNT_NOT_IN_RULE)(e) && /surviving account/.test(e.message));
    // At commit: the surviving account's verified email leaves the rule after the plan.
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    fake.put(U(SURVIVOR), { ...fake.get(U(SURVIVOR)), verified_email: 'bob@example.org' });
    const before = fake.snapshot();
    await assert.rejects(a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() }), (e) => refusedWith(R().ACCOUNT_NOT_IN_RULE)(e) && /surviving account/.test(e.message));
    assert.deepEqual(fake.snapshot(), before);
});

test('M11 a read failure in an owner that moves nothing BLOCKS a merge (ACCOUNT_STORE_READ_FAILED naming it), never an empty list of what stays', async () => {
    fake.faults.read = (p) => p === `${U(LEGACY)}/Purchases`;
    const plan = await mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    assert.deepEqual(plan.blockers.map((b) => [b.owner, b.code]), [['cloudPurchases', R().ACCOUNT_STORE_READ_FAILED]]);
    fake.faults.read = () => false;
    assert.deepEqual((await mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR })).blockers, [], 'negative control: the read succeeds');
});

test('F1 an UNBOUNDED read of an owner that moves nothing surfaces as leftoversIncomplete on a merge (not a blocker, never dropped); its delete blockers do not bear on a merge', async () => {
    const o = purchasesOwner();
    const unbounded = { ...o, async footprintForUser(u) { const fp = await o.footprintForUser(u); return { ...fp, blockers: [P.accountAdminBlocker(R().ACCOUNT_FOOTPRINT_UNBOUNDED, 'Purchases reached 500 documents'), P.accountAdminBlocker(R().ACCOUNT_PAID_PURCHASES, 'a paid one')] }; } };
    const plan = await mergeAdmin({ storeOwners: [unbounded, productsOwner()] }).planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    assert.deepEqual(plan.blockers, []);
    assert.deepEqual(plan.leftoversIncomplete, [{ owner: 'cloudPurchases', detail: 'Purchases reached 500 documents' }]);
    assert.deepEqual((await mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR })).leftoversIncomplete, [], 'negative control');
});

test('F6 the merge plan lists every moved field individually (one move per document and field, never collapsed)', async () => {
    fake.put('Community/egpt/Apps/egpt-two', { owner_id: LEGACY });
    const plan = await mergeAdmin().planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    assert.deepEqual(plan.moves.filter((m) => m.owner === 'products').map((m) => [m.path, m.field]), [['Community/egpt/Apps/egpt-godsworld', 'owner_id'], ['Community/egpt/Apps/egpt-two', 'owner_id']]);
});

test('commitMerge refuses a plan with blockers, a wrong typed id (plan kept), and a stale store; nothing written', async () => {
    let a = mergeAdmin();
    let plan = await a.planMerge({ fromAccountId: PASSKEY, intoAccountId: SURVIVOR });
    const before = fake.snapshot();
    await assert.rejects(a.commitMerge({ planId: plan.planId, confirmFromAccountId: PASSKEY, confirmIntoAccountId: SURVIVOR, receipt: keeper() }), refusedWith(R().ACCOUNT_MERGE_EMAIL_MISMATCH));
    a = mergeAdmin();
    plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    await assert.rejects(a.commitMerge({ planId: plan.planId, confirmFromAccountId: SURVIVOR, confirmIntoAccountId: LEGACY, receipt: keeper() }), refusedWith(R().ACCOUNT_CONFIRMATION_MISMATCH));
    fake.put(U(LEGACY), { ...fake.get(U(LEGACY)), roles: { ...fake.get(U(LEGACY)).roles, app_x: { acquired_date: 'now' } } });
    const changed = fake.snapshot();
    await assert.rejects(a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() }), refusedWith(R().ACCOUNT_PLAN_STALE));
    assert.deepEqual(fake.snapshot(), changed);
    assert.equal(fake.log.length, 0);
    assert.notDeepEqual(before, changed);
});

test('commitMerge: a dependent owner that fails stops the sequence; the record is not marked migrated; NOT_MERGED', async () => {
    const a = mergeAdmin({ storeOwners: [purchasesOwner(), productsOwner({ failMerge: true })] });
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const before = fake.snapshot();
    const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() });
    assert.equal(res.outcome, P.MERGE_OUTCOME.NOT_MERGED, res.line);
    assert.deepEqual(fake.snapshot(), before);
});

test('commitMerge: the migration mark fails -> PARTIAL (read back), never MERGED', async () => {
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    fake.faults.write = (p) => p === U(LEGACY);
    const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() });
    assert.equal(res.outcome, P.MERGE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.notMoved, [`${U(LEGACY)}#migrated_to`]);
    assert.equal(fake.get(U(LEGACY)).migrated_to, undefined);
});

test('commitMerge: every owner returns but the email-row move did not land -> PARTIAL (read back), never MERGED', async () => {
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const realTx = fake.FakeCacheFirestore.prototype.db.runTransaction;
    fake.faults.write = () => false;
    const db = fake.FakeCacheFirestore.prototype.db;
    db.runTransaction = async (fn) => realTx(async (tx) => fn({ ...tx, set: (ref, data) => (ref.path === emailRow ? undefined : tx.set(ref, data)) }));
    try {
        const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() });
        assert.equal(res.cause, null);
        assert.equal(res.outcome, P.MERGE_OUTCOME.PARTIAL, res.line);
        assert.deepEqual(res.notMoved, [`${emailRow}#descix_user_id`]);
    } finally {
        db.runTransaction = realTx;
    }
});

test('rollbackMerge restores EXACTLY the pre-merge store, sessions included (nothing was revoked)', async () => {
    const before = fake.snapshot();
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const k = keeper();
    const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: k });
    assert.equal(res.outcome, 'MERGED');
    const receipt = JSON.parse(JSON.stringify(k.kept.get(res.receiptLabel)));
    const rb = await mergeAdmin().rollbackMerge({ receipt, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR });
    assert.equal(rb.outcome, P.MERGE_ROLLBACK_OUTCOME.ROLLED_BACK, rb.line);
    assert.doesNotMatch(rb.line, /revoked/);
    assert.deepEqual(fake.snapshot(), before);
    assert.equal(fake.get(emailRow), undefined, 'the email row the merge created is deleted');
});

test('rollbackMerge: a value changed since the merge is left (PARTIAL), never overwritten', async () => {
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const k = keeper();
    const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: k });
    fake.put(emailRow, { descix_user_id: BOB, provider_type: 'email' });
    const rb = await mergeAdmin().rollbackMerge({ receipt: k.kept.get(res.receiptLabel), confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR });
    assert.equal(rb.outcome, P.MERGE_ROLLBACK_OUTCOME.PARTIAL, rb.line);
    assert.deepEqual(rb.notRestored, [`${emailRow}#descix_user_id`]);
    assert.equal(fake.get(emailRow).descix_user_id, BOB);
    assert.equal(fake.get(U(LEGACY)).migrated_to, undefined);
});

/** A committed merge of LEGACY into SURVIVOR and its kept receipt (a JSON copy). */
async function mergedWithReceipt() {
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const k = keeper();
    const res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: k });
    assert.equal(res.outcome, 'MERGED', res.line);
    return JSON.parse(JSON.stringify(k.kept.get(res.receiptLabel)));
}
const rollback = (receipt, o = {}) => mergeAdmin().rollbackMerge({ receipt, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, ...o });

test('rollbackMerge refuses a receipt for another env or database, a delete receipt, or an owner this instance lacks; nothing written', async () => {
    const receipt = await mergedWithReceipt();
    const before = fake.snapshot();
    for (const bad of [{ ...receipt, env: 'prod' }, { ...receipt, target: { ...receipt.target, databaseId: 'descix-prod' } }, { ...receipt, kind: 'delete' }, null]) {
        await assert.rejects(rollback(bad), refusedWith(R().ACCOUNT_RECEIPT_INVALID));
    }
    await assert.rejects(admin({ storeOwners: [purchasesOwner()] }).rollbackMerge({ receipt, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR }), refusedWith(R().ACCOUNT_RECEIPT_INVALID));
    assert.deepEqual(fake.snapshot(), before);
});

test('S5 rollbackMerge requires the typed ids of both accounts (ACCOUNT_CONFIRMATION_MISMATCH, nothing written)', async () => {
    const receipt = await mergedWithReceipt();
    const before = fake.snapshot();
    for (const o of [{ confirmFromAccountId: undefined }, { confirmIntoAccountId: undefined }, { confirmFromAccountId: SURVIVOR, confirmIntoAccountId: LEGACY }]) {
        await assert.rejects(rollback(receipt, o), refusedWith(R().ACCOUNT_CONFIRMATION_MISMATCH));
    }
    assert.deepEqual(fake.snapshot(), before);
    assert.equal((await rollback(receipt)).outcome, 'ROLLED_BACK', 'positive control');
});

test('S5 an EDITED receipt is refused before any write: a changed move (the planHash binding), a re-hashed move outside the pair (owner validation), a swapped account', async () => {
    const receipt = await mergedWithReceipt();
    const before = fake.snapshot();
    const log0 = fake.log.length;
    // 1. a move pointed at a third account's doc, planHash untouched: the binding refuses.
    const edited = structuredClone(receipt);
    edited.moves.find((m) => m.field === 'roles').path = U(BOB);
    await assert.rejects(rollback(edited), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /planHash/.test(e.message));
    // 2. the same edit with the planHash recomputed (a forger who knows the formula): the owners' validation refuses.
    const rehashed = { ...edited, planHash: P.mergePlanHash(edited.fromAccountId, edited.intoAccountId, edited.moves) };
    await assert.rejects(rollback(rehashed), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /'user' rejected/.test(e.message));
    const productEdit = structuredClone(receipt);
    productEdit.moves.find((m) => m.owner === 'products').path = 'Community/other/Apps/x';
    productEdit.moves.find((m) => m.owner === 'products').to = BOB;
    await assert.rejects(rollback({ ...productEdit, planHash: P.mergePlanHash(productEdit.fromAccountId, productEdit.intoAccountId, productEdit.moves) }), (e) => refusedWith(R().ACCOUNT_RECEIPT_INVALID)(e) && /'products' rejected/.test(e.message));
    // 3. a migration-mark move re-targeted at another account.
    const mark = structuredClone(receipt);
    mark.moves.find((m) => m.field === 'migrated_to').to = BOB;
    await assert.rejects(rollback({ ...mark, planHash: P.mergePlanHash(mark.fromAccountId, mark.intoAccountId, mark.moves) }), refusedWith(R().ACCOUNT_RECEIPT_INVALID));
    assert.deepEqual(fake.snapshot(), before, 'nothing written');
    assert.equal(fake.log.length, log0);
    assert.equal((await rollback(receipt)).outcome, 'ROLLED_BACK', 'positive control: the untouched receipt rolls back');
});

test('S5 rollbackMerge re-checks the rule for BOTH accounts (ACCOUNT_NOT_IN_RULE, nothing written)', async () => {
    const receipt = await mergedWithReceipt();
    fake.put(U(SURVIVOR), { ...fake.get(U(SURVIVOR)), verified_email: 'bob@example.org' });
    const before = fake.snapshot();
    await assert.rejects(rollback(receipt), (e) => refusedWith(R().ACCOUNT_NOT_IN_RULE)(e) && /surviving account/.test(e.message));
    assert.deepEqual(fake.snapshot(), before);
});

test('M7 role rollback never removes a role whose value changed since the merge', async () => {
    const receipt = await mergedWithReceipt();
    const changed = { acquired_date: 'regranted-after-the-merge' };
    fake.put(U(SURVIVOR), { ...fake.get(U(SURVIVOR)), roles: { ...fake.get(U(SURVIVOR)).roles, community_egpt_chat: changed } });
    const rb = await rollback(receipt);
    assert.equal(rb.outcome, P.MERGE_ROLLBACK_OUTCOME.PARTIAL, rb.line);
    assert.deepEqual(rb.notRestored, [`${U(SURVIVOR)}#roles#community_egpt_chat`]);
    assert.deepEqual(fake.get(U(SURVIVOR)).roles.community_egpt_chat, changed);
});

test('M8 unmarkMigrated never clears a mark that names another account', async () => {
    const receipt = await mergedWithReceipt();
    fake.put(U(LEGACY), { ...fake.get(U(LEGACY)), migrated_to: BOB });
    const rb = await rollback(receipt);
    assert.equal(rb.outcome, P.MERGE_ROLLBACK_OUTCOME.PARTIAL, rb.line);
    assert.ok(rb.notRestored.includes(`${U(LEGACY)}#migrated_to`));
    assert.equal(fake.get(U(LEGACY)).migrated_to, BOB);
    await assert.rejects(new P.User(LEGACY).unmarkMigrated(SURVIVOR), refusedWith(R().ACCOUNT_PLAN_STALE));
    assert.equal(fake.get(U(LEGACY)).migrated_to, BOB);
});

test('M9 the merge\'s email-row move is a transaction that re-reads the row: a third account taking it after the footprint read leaves it, reported with the reason', async () => {
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    const db = fake.FakeCacheFirestore.prototype.db;
    const realTx = db.runTransaction;
    db.runTransaction = async (fn) => {
        // The row is taken by a third account between mergeForUser's footprint read and its transaction.
        if (!fake.get(emailRow)) fake.put(emailRow, { descix_user_id: BOB, provider_type: 'email' });
        return realTx(fn);
    };
    let res;
    try {
        res = await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() });
    } finally {
        db.runTransaction = realTx;
    }
    assert.equal(fake.get(emailRow).descix_user_id, BOB, 'the third account\'s row is never moved');
    assert.equal(res.outcome, P.MERGE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.notMoved, [`${emailRow}#descix_user_id`]);
    assert.match(res.notes.join(' '), /the email row now names "Qm9i", not null; left in place/);
});

test('S3 an index row is deleted only while it still names the account (a transaction re-reads it): a row taken by another account is left, reported with the reason', async () => {
    const a = admin();
    const plan = await a.planDelete({ accountId: PASSKEY });
    const db = fake.FakeCacheFirestore.prototype.db;
    const realTx = db.runTransaction;
    let txs = 0;
    db.runTransaction = async (fn) => {
        const row = `ProviderIndex/${P.User.emailIndexKey('operator+test@example.org')}`;
        // The first transaction is the User owner's admin_delete stamp; the race is inside the row's own.
        if ((txs += 1) > 1 && fake.get(row)?.descix_user_id === PASSKEY) fake.put(row, { ...fake.get(row), descix_user_id: BOB });
        return realTx(fn);
    };
    let res;
    try {
        res = await a.commitDelete({ planId: plan.planId, confirmAccountId: PASSKEY, receipt: keeper() });
    } finally {
        db.runTransaction = realTx;
    }
    const row = `ProviderIndex/${P.User.emailIndexKey('operator+test@example.org')}`;
    assert.equal(fake.get(row).descix_user_id, BOB, 'never deleted from under the account it now names');
    assert.equal(res.outcome, P.DELETE_OUTCOME.PARTIAL, res.line);
    assert.deepEqual(res.remaining, [row]);
    assert.match(res.notes.join(' '), /its descix_user_id now names "Qm9i", not UGFzc2tleUE; left in place/);
});

// ------------------------------------------------------------------------- what a merged pair looks like

test('User.markMigrated: one transaction that refuses an already-migrated record and a missing one (it overwrote before)', async () => {
    const legacy = await P.User.from_firestore(LEGACY);
    assert.equal(await legacy.markMigrated(SURVIVOR), true);
    const first = fake.get(U(LEGACY));
    const again = await P.User.from_firestore(LEGACY);
    await assert.rejects(again.markMigrated('T3RoZXI'), refusedWith(R().ACCOUNT_MERGE_ALREADY_MIGRATED));
    assert.deepEqual(fake.get(U(LEGACY)), first, 'the first mark stands');
    fake.docs.delete(U(OTHER_PERSON));
    const gone = new P.User(OTHER_PERSON);
    await assert.rejects(gone.markMigrated(SURVIVOR), refusedWith(R().ACCOUNT_NOT_FOUND));
    assert.equal(fake.get(U(OTHER_PERSON)), undefined);
    await assert.rejects(again.markMigrated(LEGACY), refusedWith(R().ACCOUNT_MERGE_SAME_RECORD));
});

test('S2 a stale whole-document write (User.to_firestore, put_doc = set merge:true) never undoes a merge stamp nor forges one', async () => {
    const staleBeforeMerge = await P.User.from_firestore(LEGACY);
    assert.equal('migrated_to' in staleBeforeMerge.to_dict(), false, 'to_dict carries no migration field');
    const receipt = await mergedWithReceipt();
    const stamp = fake.get(U(LEGACY)).migrated_to;
    assert.equal(stamp, SURVIVOR);
    await staleBeforeMerge.to_firestore();
    assert.equal(fake.get(U(LEGACY)).migrated_to, SURVIVOR, 'a write hydrated before the merge left the stamp');
    assert.ok(fake.get(U(LEGACY)).migrated_at, 'and its time');
    const staleAfterMerge = await P.User.from_firestore(LEGACY);
    assert.equal(staleAfterMerge.migrated_to, SURVIVOR, 'hydration still reads the stamp');
    assert.equal((await rollback(receipt)).outcome, 'ROLLED_BACK');
    await staleAfterMerge.to_firestore();
    assert.equal(fake.get(U(LEGACY)).migrated_to, undefined, 'a write hydrated before the rollback does not forge the stamp back');
    assert.deepEqual(P.User.OPERATOR_STAMP_FIELDS, ['migrated_to', 'migrated_at', 'admin_delete']);
    assert.equal(P.User.MIGRATION_FIELDS, undefined, 'one list: the old name is gone');
});

test('F3 static leftovers: every delete plan lists the top-level user-keyed collections ACCOUNT_STORE_UNOWNED cannot see (owner-contributed)', async () => {
    const plan = await admin({ storeOwners: [purchasesOwner(), productsOwner(), leftoversOwner()] }).planDelete({ accountId: PASSKEY });
    assert.ok(plan.leftovers.some((l) => l.owner === 'user' && /^EmailVerifications\//.test(l.what)), JSON.stringify(plan.leftovers));
    assert.ok(plan.leftovers.some((l) => l.owner === 'unread' && l.what === 'Google Groups membership'), 'a dependent owner\'s static leftovers show too');
});

test('after a merge: findByEmail resolves to the survivor; the one-email rule lets the survivor commit its email; a third account is still refused', async () => {
    assert.equal((await P.User.findByEmail('operator@example.org')).id, LEGACY, 'before: no email row, the email-keyed record answers');
    await assert.rejects(P.User.assertEmailFreeFor(SURVIVOR, 'operator@example.org'), (e) => e.code === P.EmailIdentityRefusal.ALREADY_REGISTERED_LEGACY);
    const a = mergeAdmin();
    const plan = await a.planMerge({ fromAccountId: LEGACY, intoAccountId: SURVIVOR });
    assert.equal((await a.commitMerge({ planId: plan.planId, confirmFromAccountId: LEGACY, confirmIntoAccountId: SURVIVOR, receipt: keeper() })).outcome, 'MERGED');
    assert.equal((await P.User.findByEmail('operator@example.org')).id, SURVIVOR);
    await P.User.assertEmailFreeFor(SURVIVOR, 'operator@example.org');
    await assert.rejects(P.User.assertEmailFreeFor(BOB, 'operator@example.org'), (e) => e.code === P.EmailIdentityRefusal.ALREADY_REGISTERED);
    assert.equal((await P.User.findByWallet('0xbbb')).id, LEGACY, 'the legacy wallet still resolves to the migrated record (sign-in hazard, reported)');
});

// ------------------------------------------------------------------------- the conformance checker

/** The caller's read-failure hook over the fake: every read throws while fn runs. */
const withFailingReads = async (fn) => {
    fake.faults.read = () => true;
    try { return await fn(); } finally { fake.faults.read = () => false; }
};
/** The fake store keyed as footprints name documents: a session by its digest path (the test's own copy of the format the plan test pins). */
const SESSION = /^UserCache\/([^/]+)\/Sessions\/([^/]+)$/;
const footprintSnapshot = () => new Map([...fake.snapshot()].map(([p, d]) => {
    const m = SESSION.exec(p);
    return [m ? `UserCache/${m[1]}/Sessions/redacted-${crypto.createHash('sha256').update(m[2]).digest('hex').slice(0, 16)}` : p, d];
}));
const countUnboundedReads = () => fake.counters.unboundedReads;
/** Writes a value other than the merge's at a move's path/field(/key). */
const changeAfterMerge = async (m) => {
    const d = fake.get(m.path);
    if (m.key !== undefined) d[m.field] = { ...d[m.field], [m.key]: { changed: 'after the merge' } };
    else d[m.field] = BOB;
    fake.put(m.path, d);
};
const SHARED = { verified_email: 'operators@example.org', wallet_address: '0xccc' };
const BYSTANDER_A = 'U2FtMg';
const LEGACY_PAIR = { from: { user_id: LEGACY, verified_email: null, wallet_address: '0xbbb' }, into: { user_id: SURVIVOR, verified_email: 'operator@example.org', wallet_address: null } };
const OTHER_USER_DOC = { user_id: OTHER_PERSON, ...SHARED };
const SURVIVOR_USER = { ...LEGACY_PAIR.into, wallet_address: '0xs' };
const BYSTANDER_B = 'U2FtMw';
const BYSTANDER_C = 'U2FtNA';
/** The three bystanders the checker requires for `u`: the same email and wallet, the same wallet only, the same email only. */
const trio = (u) => [{ ...u, user_id: BYSTANDER_A }, { ...u, user_id: BYSTANDER_B, verified_email: 'other3@example.org' }, { ...u, user_id: BYSTANDER_C, wallet_address: '0xddd' }];
/** The target the test reads from the client it injected (the fake's db), never from the owner. */
const liveTarget = () => { const db = fake.FakeCacheFirestore.prototype.db; return { databaseId: db.databaseId, projectId: db.projectId }; };
/** The checker's fixture over the fake: OTHER_PERSON (a session, her email row) and three bystanders sharing her email and/or wallet. */
function checkerSeed() {
    fake.put(`${U(OTHER_PERSON)}/Sessions/tok-s`, { access_token: 'tok-s', provider: 'descix', user_id: OTHER_PERSON });
    fake.put(`ProviderIndex/${P.User.emailIndexKey('operators@example.org')}`, { descix_user_id: OTHER_PERSON, provider_type: 'email' });
    fake.put(U(BYSTANDER_A), { id: BYSTANDER_A, auth_providers: ['powch'], user_info: { credentialId: BYSTANDER_A }, verified_email: 'operators@example.org', wallet_address: '0xccc' });
    fake.put('WalletIndex/0xccc', { descix_user_id: BYSTANDER_A, wallet_address: '0xccc' });
    fake.put(U(BYSTANDER_B), { id: BYSTANDER_B, auth_providers: ['powch'], user_info: { credentialId: BYSTANDER_B }, verified_email: 'other3@example.org', wallet_address: '0xccc' });
    fake.put(U(BYSTANDER_C), { id: BYSTANDER_C, auth_providers: ['powch'], user_info: { credentialId: BYSTANDER_C }, verified_email: 'operators@example.org', wallet_address: '0xddd' });
    fake.put('WalletIndex/0xddd', { descix_user_id: BYSTANDER_C, wallet_address: '0xddd' });
    for (const id of [BYSTANDER_A, BYSTANDER_B, BYSTANDER_C]) {
        fake.put(`${U(id)}/Sessions/tok-${id}`, { access_token: `tok-${id}`, provider: 'descix', user_id: id });
        fake.put(`${U(id)}/Purchases/b1`, { purchase_price: 0 });
    }
}
/** Writes different data (same path) at a footprint entry's document. */
const changeAfterFootprint = async (p) => { fake.put(p, { ...fake.get(p), changed_after_footprint: true }); };
const fx = (o) => ({ snapshot: footprintSnapshot, clientTarget: liveTarget(), bystanders: trio(o.user), ...o });
const userFixture = (o = {}) => fx({
    user: OTHER_USER_DOC, pair: LEGACY_PAIR, withFailingReads, countUnboundedReads, changeAfterMerge, changeAfterFootprint,
    async withBlocker(fn) {
        const d = fake.get(U(OTHER_PERSON));
        fake.put(U(OTHER_PERSON), { ...d, roles: { app_x: { acquired_date: 'now' } } });
        try { return await fn(); } finally { fake.put(U(OTHER_PERSON), d); }
    },
    ...o,
});
const PASSKEY_USER = { user_id: PASSKEY, verified_email: 'operator+test@example.org', wallet_address: '0xaaa' };
const purchasesFixture = (o = {}) => fx({
    user: PASSKEY_USER, withFailingReads, countUnboundedReads, changeAfterFootprint,
    async withBlocker(fn) { fake.put(`${U(PASSKEY)}/Purchases/pu1`, { purchase_price: 5 }); try { return await fn(); } finally { fake.put(`${U(PASSKEY)}/Purchases/pu1`, { ProductPath: 'Community/daita', purchase_price: 0 }); } },
    ...o,
});
const statuses = (s) => Object.fromEntries(s.checks.map((c) => [c.clause, c.status]));
const nonConforming = (clause, re) => (e) => {
    assert.equal(e.name, 'AccountStoreOwnerNonConformance', e.stack);
    assert.equal(e.clause, clause, e.message);
    if (re) assert.match(e.message, re);
    return true;
};
const ALL = (o = {}) => ({ a: 'passed', b: 'passed', c: 'passed', d: 'passed', e: 'passed', f: 'passed', g: 'passed', h: 'passed', i: 'passed', j: 'passed', k: 'skipped', l: 'passed', m: 'skipped', n: 'passed', ...o });

test('checker: userAccountOwner conforms on every clause it can exhibit, driven against the fake store (k skipped: it restores nothing in v1)', async () => {
    checkerSeed();
    const s = await P.assertAccountStoreOwnerConforms(P.userAccountOwner, userFixture());
    assert.equal(s.owner, 'user');
    assert.deepEqual(statuses(s), ALL());
    assert.equal(fake.get(U(OTHER_PERSON)), undefined, 'clause (c) really deleted through the owner');
    assert.ok(fake.get(U(BYSTANDER_A)), 'the bystander survived');
    assert.equal(fake.get(U(LEGACY)).migrated_to, undefined, 'clause (e)/(i) rolled its merges back');
    assert.deepEqual(fake.get(U(SURVIVOR)).roles.community_egpt_chat, { changed: 'after the merge' }, 'clause (i): the changed role was left');
});

test('checker: the test-local dependent owners conform; clauses without a hook, or a method, are reported SKIPPED, never passed', async () => {
    checkerSeed();
    let s = await P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture());
    assert.deepEqual(statuses(s), ALL({ e: 'skipped', i: 'skipped' }));
    assert.match(s.checks.find((c) => c.clause === 'e').reason, /not a merge owner/);
    seed();
    s = await P.assertAccountStoreOwnerConforms(productsOwner(), fx({ user: SURVIVOR_USER, pair: LEGACY_PAIR, emptyFootprint: true, countUnboundedReads }));
    assert.deepEqual(statuses(s), ALL({ d: 'skipped', h: 'skipped', i: 'skipped', l: 'skipped' }));
    for (const [c, re] of [['d', /withFailingReads/], ['h', /withBlocker/], ['i', /changeAfterMerge/], ['l', /emptyFootprint/]]) assert.match(s.checks.find((x) => x.clause === c).reason, re);
    seed();
    s = await P.assertAccountStoreOwnerConforms(productsOwner(), fx({ user: SURVIVOR_USER, pair: LEGACY_PAIR, emptyFootprint: true, changeAfterMerge }));
    assert.equal(statuses(s).i, 'passed');
    assert.equal(statuses(s).j, 'skipped');
    s = await P.assertAccountStoreOwnerConforms(leftoversOwner(), fx({ user: OTHER_USER_DOC, emptyFootprint: true }));
    assert.deepEqual(statuses(s), ALL({ d: 'skipped', e: 'skipped', h: 'skipped', i: 'skipped', j: 'skipped', l: 'skipped' }));
    checkerSeed();
    s = await P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ changeAfterFootprint: undefined }));
    assert.equal(statuses(s).l, 'skipped', 'a recoverable owner without the hook: (l) skipped, never passed');
    assert.match(s.checks.find((x) => x.clause === 'l').reason, /changeAfterFootprint/);
    await assert.rejects(P.assertAccountStoreOwnerConforms(leftoversOwner(), fx({ user: OTHER_USER_DOC, emptyFootprint: true, withFailingReads })), nonConforming('d'),
        'an owner that reads nothing cannot exhibit the read-failure clause: with a hook it is RED, never passed');
});

/** The seeded vaults of the user and its three bystanders. */
function seedVaults() {
    for (const [id, blob] of [[PASSKEY, 'AAAA'], [BYSTANDER_A, 'BBBB'], [BYSTANDER_B, 'CCCC'], [BYSTANDER_C, 'DDDD']]) fake.put(`Vaults/${id}`, { encryptedBlob: blob });
}
/** A restore that refuses an entry that is not this account's vault (as the contract requires) and then does `then`. */
const ownRestore = (then) => async (user, entries) => {
    if (entries.some((e) => e.path !== `Vaults/${user.user_id}`)) throw new P.AccountAdminError(R().ACCOUNT_RECEIPT_INVALID, 'not this account\'s vault');
    return then(user, entries);
};

test('checker: a restoring owner (k, m): restores absent entries create-only, refuses a foreign path; one that overwrites, restores nothing, or plants any path, is RED', async () => {
    seedVaults();
    const fixture = fx({ user: PASSKEY_USER, changeAfterFootprint });
    const s = await P.assertAccountStoreOwnerConforms(walletMaterialOwner({ restore: true, irrecoverable: true }), fixture);
    assert.deepEqual(statuses(s), ALL({ d: 'skipped', e: 'skipped', h: 'skipped', i: 'skipped', j: 'skipped', k: 'passed', m: 'passed' }));
    assert.deepEqual(fake.get(`Vaults/${PASSKEY}`), { encryptedBlob: 'AAAA', changed_after_footprint: true }, 'restored from the receipt copy taken at delete time');
    assert.deepEqual(fake.get(`Vaults/${BYSTANDER_A}`), { encryptedBlob: 'BBBB' }, 'the bystander\'s vault was never planted over');
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const overwrites = { ...walletMaterialOwner(), restoreForUser: ownRestore(async (user, entries) => { for (const e of entries) await db().doc(e.path).set({ ...e.data, restoredAt: String(Math.random()) }); return { restored: entries.map((e) => e.path), remaining: [] }; }) };
    seedVaults();
    await assert.rejects(P.assertAccountStoreOwnerConforms(overwrites, fixture), nonConforming('k', /overwrote an existing document/));
    seedVaults();
    const lies = { ...walletMaterialOwner(), restoreForUser: ownRestore(async (user, entries) => ({ restored: entries.map((e) => e.path), remaining: [] })) };
    await assert.rejects(P.assertAccountStoreOwnerConforms(lies, fixture), nonConforming('k', /does not list it/));
    seedVaults();
    const plantsAny = { ...walletMaterialOwner(), async restoreForUser(user, entries) { for (const e of entries) await db().runTransaction(async (tx) => { if (!(await tx.get(db().doc(e.path))).exists) tx.set(db().doc(e.path), e.data); }); return { restored: entries.map((e) => e.path), remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(plantsAny, fixture), nonConforming('m', /an entry re-pathed outside the store\) answered/), 'the reviewer\'s new3: a restore that writes whatever path a receipt names');
    seedVaults();
    const skipsForeign = { ...walletMaterialOwner(), async restoreForUser(user, entries) { const mine = entries.filter((e) => e.path === `Vaults/${user.user_id}`); return walletMaterialOwner({ restore: true }).restoreForUser(user, mine).then((r) => ({ ...r, remaining: entries.map((e) => e.path).filter((p) => !r.restored.includes(p)) })); } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(skipsForeign, fixture), nonConforming('m', /answered/), 'a foreign path silently skipped (written nothing) is not refused: RED');
    seedVaults();
    await assert.rejects(P.assertAccountStoreOwnerConforms({ ...walletMaterialOwner(), irrecoverable: 'yes' }, fixture), nonConforming('a', /irrecoverable/));
});

test('NF1 checker (l): a document changed after the footprint must make deleteForUser refuse; REQUIRED for an irrecoverable owner (negative controls: a paths-only owner is RED; no hook on an irrecoverable owner is RED)', async () => {
    seedVaults();
    const fixture = fx({ user: PASSKEY_USER, changeAfterFootprint });
    assert.equal(statuses(await P.assertAccountStoreOwnerConforms(walletMaterialOwner({ irrecoverable: true }), fixture)).l, 'passed');
    seedVaults();
    await assert.rejects(P.assertAccountStoreOwnerConforms(walletMaterialOwner({ irrecoverable: true, pathsOnly: true }), fixture), nonConforming('l', /answered .* instead of throwing ACCOUNT_PLAN_STALE/), 'the pre-NF1 owner: compares paths only');
    seedVaults();
    await assert.rejects(P.assertAccountStoreOwnerConforms(walletMaterialOwner({ irrecoverable: true }), fx({ user: PASSKEY_USER })), nonConforming('l', /an irrecoverable owner is checked with changeAfterFootprint/));
    seedVaults();
    assert.equal(statuses(await P.assertAccountStoreOwnerConforms(walletMaterialOwner(), fx({ user: PASSKEY_USER }))).l, 'skipped', 'a recoverable owner without the hook: skipped');
    seedVaults();
    await assert.rejects(P.assertAccountStoreOwnerConforms(walletMaterialOwner({ pathsOnly: true }), fx({ user: PASSKEY_USER })), nonConforming('c', /without expectData\) answered/), 'without the hook, (c) still catches an owner that ignores expectData');
});

test('checker: the fixture must be able to exhibit each clause (three bystanders, a client target, a snapshot, entries, a pair with a move)', async () => {
    checkerSeed();
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ user: OTHER_USER_DOC })), nonConforming('fixture', /no entry/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ emptyFootprint: true })), nonConforming('fixture', /emptyFootprint/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(productsOwner(), fx({ user: SURVIVOR_USER, emptyFootprint: true })), nonConforming('fixture', /pair/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(productsOwner(), fx({ user: SURVIVOR_USER, emptyFootprint: true, pair: { from: OTHER_USER_DOC, into: LEGACY_PAIR.into } })), nonConforming('fixture', /no move/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), {}), nonConforming('fixture', /user/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: undefined })), nonConforming('fixture', /bystanders: \[sameEmailAndWallet, sameWalletOnly, sameEmailOnly\]/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: trio(PASSKEY_USER).slice(0, 1) })), nonConforming('fixture', /three other accounts/), 'one bystander is not enough');
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystander: { ...PASSKEY_USER, user_id: BYSTANDER_A } })), nonConforming('fixture', /`bystander` is not an option/), 'the replaced option fails loud');
    const [both, walletOnly, emailOnly] = trio(PASSKEY_USER);
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: [{ ...both, verified_email: 'other@example.org' }, walletOnly, emailOnly] })), nonConforming('fixture', /bystanders\[0\] shares the user's verified_email and wallet_address/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: [both, { ...walletOnly, verified_email: PASSKEY_USER.verified_email }, emailOnly] })), nonConforming('fixture', /bystanders\[1\] shares the user's wallet_address and NOT/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: [both, walletOnly, { ...emailOnly, wallet_address: PASSKEY_USER.wallet_address }] })), nonConforming('fixture', /bystanders\[2\] shares the user's verified_email and NOT/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: [both, walletOnly, { ...emailOnly, user_id: BYSTANDER_A }] })), nonConforming('fixture', /four different accounts/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ bystanders: [both, { ...walletOnly, user_id: 'Tm9uZQ' }, emailOnly] })), nonConforming('fixture', /footprint of bystanders\[1\] \(same wallet only\) has no entry/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ clientTarget: undefined })), nonConforming('fixture', /clientTarget/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ snapshot: undefined })), nonConforming('fixture', /snapshot/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ withBlocker: (fn) => fn() })), nonConforming('fixture', /withBlocker set nothing/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner(), purchasesFixture({ changeAfterFootprint: async () => {} })), nonConforming('fixture', /changeAfterFootprint\(.*\) left the document as it was/));
});

/** The reviewer's probe owner (scratchpad probes/conformance-unsafe.mjs) over its own Map store: Things rows of A (the user) and its three bystanders. */
function probeStore({ footprintBy = 'id', deleteExtra = () => {}, target = 'descix-dev', restoreAnyPath = false } = {}) {
    const shared = { verified_email: 'operator@example.org', wallet_address: '0xw' };
    const user = { user_id: 'A', ...shared };
    const bystanders = [{ user_id: 'B', ...shared }, { user_id: 'C', verified_email: 'c@example.org', wallet_address: '0xw' }, { user_id: 'D', verified_email: 'operator@example.org', wallet_address: '0xd' }];
    const store = new Map([
        ['Things/a1', { user_id: 'A', email: shared.verified_email, wallet: '0xw' }],
        ['Things/b1', { user_id: 'B', email: shared.verified_email, wallet: '0xw' }],
        ['Things/c1', { user_id: 'C', email: 'c@example.org', wallet: '0xw' }],
        ['Things/d1', { user_id: 'D', email: shared.verified_email, wallet: '0xd' }],
        ['Victims/b-profile', { user_id: 'B' }],
    ]);
    const by = (u) => (d) => (footprintBy === 'email' ? d.email === u.verified_email : footprintBy === 'wallet' ? d.wallet === u.wallet_address : d.user_id === u.user_id);
    const fp = (u) => ({ entries: [...store].filter(([p, d]) => p.startsWith('Things/') && by(u)(d)).map(([path, d]) => ({ path, kind: 'thing', summary: 's', data: P.receiptData(d) })), leftovers: [], blockers: [] });
    const owner = {
        name: 'unsafe',
        storeTarget: () => ({ databaseId: target }),
        footprintForUser: async (u) => fp(u),
        async deleteForUser(u, plan = {}) {
            P.assertDeletePlanCurrent('unsafe', fp(u).entries, plan);
            for (const p of plan.expectPaths) store.delete(p);
            deleteExtra(store, u);
            return { deleted: [...plan.expectPaths], remaining: [] };
        },
        async restoreForUser(u, entries) {
            if (!restoreAnyPath) {
                const foreign = entries.filter((e) => !e.path.startsWith('Things/') || e.data?.user_id !== u.user_id);
                if (foreign.length) throw new P.AccountAdminError(R().ACCOUNT_RECEIPT_INVALID, 'not this account\'s');
            }
            const restored = [];
            for (const e of entries) if (!store.has(e.path)) { store.set(e.path, e.data); restored.push(e.path); }
            return { restored, remaining: entries.map((e) => e.path).filter((p) => !restored.includes(p)) };
        },
    };
    const fixture = { user, bystanders, snapshot: () => new Map(store), clientTarget: { databaseId: 'descix-dev' } };
    return { owner, fixture, store };
}

test('S7/NF8 the reviewer\'s unsafe owners FAIL the checker: a footprint by email or by wallet reaches a bystander (g); collateral on a third account sharing only the wallet (c); a lying storeTarget (f); a restore that plants any path (m)', async () => {
    const safe = probeStore();
    assert.deepEqual(statuses(await P.assertAccountStoreOwnerConforms(safe.owner, safe.fixture)), ALL({ d: 'skipped', e: 'skipped', h: 'skipped', i: 'skipped', j: 'skipped', l: 'skipped', m: 'passed', k: 'passed' }), 'negative control: the safe probe owner conforms');
    let x = probeStore({ footprintBy: 'email' });
    await assert.rejects(P.assertAccountStoreOwnerConforms(x.owner, x.fixture), nonConforming('g', /Things\/a1.*bystanders\[0\]/));
    x = probeStore({ footprintBy: 'wallet' });
    await assert.rejects(P.assertAccountStoreOwnerConforms(x.owner, x.fixture), nonConforming('g', /bystanders\[0\]/));
    x = probeStore({ deleteExtra: (store) => store.delete('Victims/b-profile') });
    await assert.rejects(P.assertAccountStoreOwnerConforms(x.owner, x.fixture), nonConforming('c', /Victims\/b-profile.*collateral/));
    // new1: deletes a THIRD account's row that shares the WALLET but not the email (the old single bystander shared both)
    x = probeStore({ deleteExtra: (store, u) => { for (const [p, d] of [...store]) if (d.wallet === u.wallet_address && d.email !== u.verified_email) store.delete(p); } });
    await assert.rejects(P.assertAccountStoreOwnerConforms(x.owner, x.fixture), nonConforming('c', /Things\/c1.*collateral/));
    // new2: storeTarget reports the expected database while the client the test injected is elsewhere
    x = probeStore({ target: 'descix-dev' });
    await assert.rejects(P.assertAccountStoreOwnerConforms(x.owner, { ...x.fixture, clientTarget: { databaseId: 'descix-prod' } }), nonConforming('f', /reports database 'descix-dev', but the client the caller injected targets 'descix-prod'/));
    // new3: restoreForUser writes whatever path a receipt names
    x = probeStore({ restoreAnyPath: true });
    await assert.rejects(P.assertAccountStoreOwnerConforms(x.owner, x.fixture), nonConforming('m', /AccountAdminConformance\/not-planned/));
    const { storeTarget, ...noTarget } = probeStore().owner;
    await assert.rejects(P.assertAccountStoreOwnerConforms(noTarget, probeStore().fixture), nonConforming('a', /storeTarget/));
    assert.ok(storeTarget);
});

test('checker negative controls, clause (a): methods', async () => {
    checkerSeed();
    const opts = purchasesFixture();
    const { deleteForUser, ...noDelete } = purchasesOwner();
    await assert.rejects(P.assertAccountStoreOwnerConforms(noDelete, opts), nonConforming('a', /deleteForUser/));
    await assert.rejects(P.assertAccountStoreOwnerConforms({ ...purchasesOwner(), name: '' }, opts), nonConforming('a', /name/));
    const { storeTarget, ...noTarget } = purchasesOwner();
    await assert.rejects(P.assertAccountStoreOwnerConforms(noTarget, opts), nonConforming('a', /storeTarget/));
    const pOpts = fx({ user: SURVIVOR_USER, pair: LEGACY_PAIR, emptyFootprint: true });
    const { rollbackMergeForUser, ...half } = productsOwner();
    await assert.rejects(P.assertAccountStoreOwnerConforms(half, pOpts), nonConforming('a', /rollbackMergeForUser/));
    const { validateRollbackMoves, ...noValidate } = productsOwner();
    await assert.rejects(P.assertAccountStoreOwnerConforms(noValidate, pOpts), nonConforming('a', /validateRollbackMoves/));
    const { mergeForUser, rollbackMergeForUser: r2, validateRollbackMoves: v2, ...footprintOnly } = productsOwner();
    await assert.rejects(P.assertAccountStoreOwnerConforms(footprintOnly, pOpts), nonConforming('a', /footprintForMerge/), 'footprintForMerge alone');
    assert.ok(deleteForUser && mergeForUser && r2 && v2 && storeTarget && validateRollbackMoves);
});

test('checker negative controls, clause (f): storeTarget must answer { databaseId: string }', async () => {
    checkerSeed();
    for (const t of [() => ({}), () => ({ databaseId: '' }), () => null, () => ({ databaseId: 'x', projectId: '' })]) {
        await assert.rejects(P.assertAccountStoreOwnerConforms({ ...purchasesOwner(), storeTarget: t }, purchasesFixture()), nonConforming('f'));
    }
    await assert.rejects(P.assertAccountStoreOwnerConforms({ ...purchasesOwner(), storeTarget: () => { throw new Error('x'); } }, purchasesFixture()), nonConforming('f', /threw/));
});

test('checker negative controls, clause (b): footprint shape, JSON-plain data, redaction, coded frozen blockers, flags, read-only', async () => {
    checkerSeed();
    const opts = purchasesFixture();
    const wrapFp = (f) => { const o = purchasesOwner(); const fp = o.footprintForUser; return { ...o, footprintForUser: async (u) => f(await fp(u)) }; };
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp(({ leftovers, ...x }) => x), opts), nonConforming('b', /leftovers/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, entries: x.entries.map(({ kind, ...e }) => e) })), opts), nonConforming('b', /kind/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, entries: x.entries.map((e) => ({ ...e, data: { ...e.data, at: Timestamp.now() } })) })), opts), nonConforming('b', /data\.at/), 'a raw Timestamp (Cloud redact() keeps it by reference)');
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, entries: x.entries.map((e) => ({ ...e, data: { ...e.data, nested: { refresh_token: 'live' } } })) })), opts), nonConforming('b', /refresh_token/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, entries: x.entries.map((e) => ({ ...e, walletMaterial: 'yes' })) })), opts), nonConforming('b', /walletMaterial/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, entries: x.entries.map((e) => ({ ...e, volatile: 1 })) })), opts), nonConforming('b', /volatile/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, blockers: [{ code: 'OWNS_PRODUCTS', detail: 'x' }] })), opts), nonConforming('b', /OWNS_PRODUCTS/));
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, blockers: [{ code: 'ACCOUNT_OWNS_PRODUCTS', detail: 'x' }] })), opts), nonConforming('b', /accountAdminBlocker/), 'a hand-built blocker, not accountAdminBlocker()');
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, leftovers: [{ what: 'x' }] })), opts), nonConforming('b', /why/));
    let n = 0;
    await assert.rejects(P.assertAccountStoreOwnerConforms(wrapFp((x) => ({ ...x, entries: x.entries.map((e) => ({ ...e, summary: `read ${n++}` })) })), opts), nonConforming('b', /twice/), 'a footprint that changes between two reads with no write');
    const o = purchasesOwner();
    const writesOnRead = { ...o, async footprintForUser(u) { await fake.FakeCacheFirestore.prototype.db.doc('Audit/read').set({ at: 'now' }); return o.footprintForUser(u); } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(writesOnRead, opts), nonConforming('b', /changed the store at Audit\/read/));
});

test('F3 the credential name rule: api_key/apikey, code / *_code, otp, secret, password, private_key, seed, mnemonic (snake, kebab or camelCase); a store-specific key still declared', async () => {
    const raw = {
        api_key: 'k', apikey: 'k', apiKey: 'k', 'x-api-key': 'k', code: 'c', device_code: 'c', user_code: 'c', deviceCode: 'c', otp: '1', totp_otp: '1',
        secret: 's', client_secret: 's', password: 'p', private_key: 'p', privateKey: 'p', seed: 's', wallet_seed: 's', mnemonic: 'm', access_token: 't', signature: 's',
        verifier: 'v', wallet_address: '0xa', codename: 'kept', seeded: true, passkey: { credential_id: 'c' },
    };
    const out = P.receiptData(raw);
    for (const k of Object.keys(raw).filter((x) => !['verifier', 'wallet_address', 'codename', 'seeded', 'passkey'].includes(x))) assert.equal(out[k], P.REDACTED, k);
    assert.deepEqual([out.verifier, out.wallet_address, out.codename, out.seeded, out.passkey], ['v', '0xa', 'kept', true, { credential_id: 'c' }], 'negative control: other keys are kept');
    assert.deepEqual(P.receiptData({ verifier: 'live' }, { keys: ['verifier'] }), { verifier: P.REDACTED }, 'a store\'s own credential the rule cannot see is declared');
    assert.deepEqual(P.unredactedCredentialPaths({ a: { verifier: 'live' } }, { keys: ['verifier'] }), ['a.verifier']);
    assert.deepEqual(P.unredactedCredentialPaths({ a: { verifier: 'live' } }), [], 'the name rule alone cannot see it');
    assert.throws(() => P.receiptData({}, { keys: 'verifier' }), /keys must be an array/);
});

test('credentialKeys: a store\'s own credential is enforced from the owner\'s declaration (negative control: undeclared, the checker passes it; declared and left raw, RED)', async () => {
    checkerSeed();
    fake.put(`${U(PASSKEY)}/Purchases/pu1`, { ProductPath: 'Community/daita', purchase_price: 0, verifier: 'live-v' });
    const opts = purchasesFixture({ withBlocker: undefined });
    assert.equal((await P.assertAccountStoreOwnerConforms(purchasesOwner(), opts)).owner, 'cloudPurchases', 'undeclared: the rule cannot know');
    seed();
    checkerSeed();
    fake.put(`${U(PASSKEY)}/Purchases/pu1`, { ProductPath: 'Community/daita', purchase_price: 0, verifier: 'live-v' });
    await assert.rejects(P.assertAccountStoreOwnerConforms({ ...purchasesOwner(), credentialKeys: ['verifier'] }, opts), nonConforming('b', /data\.verifier/));
    await assert.rejects(admin({ storeOwners: [{ ...purchasesOwner(), credentialKeys: ['verifier'] }, productsOwner()] }).planDelete({ accountId: PASSKEY }), /malformed footprint: .*verifier/, 'the orchestrator enforces the same declaration');
    await assert.rejects(P.assertAccountStoreOwnerConforms({ ...purchasesOwner(), credentialKeys: 'verifier' }, opts), nonConforming('a', /credentialKeys/));
});

test('checker negative controls, clause (c): stale expectPaths refused before any write; exact result; the re-read agrees; no collateral write', async () => {
    checkerSeed();
    const opts = purchasesFixture({ withBlocker: undefined, changeAfterFootprint: undefined });
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const o = purchasesOwner();
    const ignoresPlan = { ...o, async deleteForUser(user) { const paths = (await o.footprintForUser(user)).entries.map((e) => e.path); for (const p of paths) await db().doc(p).delete(); return { deleted: paths, remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(ignoresPlan, opts), nonConforming('c', /ACCOUNT_PLAN_STALE/));
    seed(); checkerSeed();
    const plainError = { ...o, async deleteForUser(user, opt) { try { return await o.deleteForUser(user, opt); } catch (e) { throw Object.assign(new Error(e.message), { code: e.code }); } } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(plainError, opts), nonConforming('c', /AccountAdminError/), 'a code on a plain Error');
    seed(); checkerSeed();
    await assert.rejects(P.assertAccountStoreOwnerConforms(purchasesOwner({ lie: true }), opts), nonConforming('c', /still lists/), 'reports deleted, deleted nothing');
    seed(); checkerSeed();
    const shortResult = { ...o, async deleteForUser(user, opt) { const r = await o.deleteForUser(user, opt); return { deleted: r.deleted.slice(1), remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(shortResult, opts), nonConforming('c', /exactly/));
    seed(); checkerSeed();
    const collateral = { ...o, async deleteForUser(user, opt) { const r = await o.deleteForUser(user, opt); await db().doc(`${U(BYSTANDER_A)}/Purchases/b1`).delete(); return r; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(collateral, opts), nonConforming('c', /UserCache\/U2FtMg\/Purchases\/b1.*collateral/));
});

test('checker negative controls, clause (h): a delete while a blocker is present must be refused before any write', async () => {
    checkerSeed();
    const o = purchasesOwner();
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const ignoresBlockers = { ...o, async deleteForUser(user, { expectPaths } = {}) { if (!samePaths((await o.footprintForUser(user)).entries.map((e) => e.path), expectPaths)) throw new P.AccountAdminError(R().ACCOUNT_PLAN_STALE, 'stale'); for (const p of expectPaths) await db().doc(p).delete(); return { deleted: expectPaths, remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(ignoresBlockers, purchasesFixture()), nonConforming('h', /answered/));
});

test('S4 the User owner re-checks its OWN blockers at its turn (a role granted after the plan): deleteForUser refuses before any write', async () => {
    const user = { user_id: PASSKEY };
    const fp = await P.userAccountOwner.footprintForUser(user);
    fake.put(U(PASSKEY), { ...fake.get(U(PASSKEY)), roles: { app_x: { acquired_date: 'now' } } });
    fake.docs.delete(`${U(PASSKEY)}/Purchases/pu1`);
    const before = fake.snapshot();
    await assert.rejects(P.userAccountOwner.deleteForUser(user, { expectPaths: fp.entries.map((e) => e.path) }), refusedWith(R().ACCOUNT_HOLDS_ROLES));
    assert.deepEqual(fake.snapshot(), before);
    assert.equal(fake.log.length, 0);
});

test('checker negative controls, clause (d): a read failure must throw ACCOUNT_STORE_READ_FAILED, never answer an empty footprint', async () => {
    checkerSeed();
    const o = purchasesOwner();
    const swallows = { ...o, async footprintForUser(u) { try { return await o.footprintForUser(u); } catch { return { entries: [], leftovers: [], blockers: [] }; } } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(swallows, purchasesFixture()), nonConforming('d', /answered/));
    const raw = { ...o, footprintForUser: async (u) => { const snap = await fake.FakeCacheFirestore.prototype.db.collection(`${U(u.user_id)}/Purchases`).limit(P.ACCOUNT_READ_LIMIT).get(); return { entries: snap.docs.map((d) => ({ path: d.ref.path, kind: 'purchase', summary: 'p', data: P.receiptData(d.data()) })), leftovers: [], blockers: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(raw, purchasesFixture()), nonConforming('d', /ACCOUNT_STORE_READ_FAILED/), 'an uncoded read error');
});

test('checker negative controls, clause (j): a footprint read without a limit is RED (negative control of the bounded owner)', async () => {
    checkerSeed();
    const o = purchasesOwner();
    const unbounded = { ...o, footprintForUser: async (u) => { const snap = await ownerRead('Purchases', () => fake.FakeCacheFirestore.prototype.db.collection(`${U(u.user_id)}/Purchases`).get()); return { entries: snap.docs.map((d) => ({ path: d.ref.path, kind: 'purchase', summary: 'p', data: P.receiptData(d.data()) })), leftovers: [], blockers: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(unbounded, purchasesFixture()), nonConforming('j', /without a limit/));
});

test('checker negative controls, clause (e): merge footprint shape, stale refusal, moves gone after merge, edited moves refused before writing, listed again after rollback', async () => {
    const opts = fx({ user: SURVIVOR_USER, pair: LEGACY_PAIR, emptyFootprint: true, withFailingReads });
    const o = productsOwner();
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const movesKey = { ...o, footprintForMerge: async (pair) => { const { entries, ...x } = await o.footprintForMerge(pair); return { moves: entries, ...x }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(movesKey, opts), nonConforming('e', /entries/), 'Cloud today: `moves`');
    seed();
    const noField = { ...o, footprintForMerge: async (pair) => { const x = await o.footprintForMerge(pair); return { ...x, entries: x.entries.map(({ field, ...m }) => m) }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(noField, opts), nonConforming('e', /field/));
    seed();
    const ignoresPlan = { ...o, async mergeForUser(pair) { const fp = await o.footprintForMerge(pair); return o.mergeForUser(pair, { expectPaths: fp.entries.map((m) => m.path) }); } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(ignoresPlan, opts), nonConforming('e', /ACCOUNT_PLAN_STALE/));
    seed();
    const noop = { ...o, async mergeForUser(pair, opt) { const fp = await o.footprintForMerge(pair); if (!samePaths(fp.entries.map((m) => m.path), opt.expectPaths)) throw new P.AccountAdminError(R().ACCOUNT_PLAN_STALE, 's'); return { moved: fp.entries, remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(noop, opts), nonConforming('e', /still lists/));
    seed();
    const noRollback = { ...o, async rollbackMergeForUser(moves) { return { restored: moves.map((m) => ({ path: m.path, field: m.field })), remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(noRollback, opts), nonConforming('e', /refused|answered/), 'a rollback that validates nothing');
    seed();
    const acceptsAnything = { ...o, validateRollbackMoves() {} };
    await assert.rejects(P.assertAccountStoreOwnerConforms(acceptsAnything, opts), nonConforming('e', /validateRollbackMoves\(an edited move, pair\) answered/));
    seed();
    fake.put('Community/egpt/Apps/egpt-two', { owner_id: LEGACY }); // a second move, written before the edited first one is judged
    const writesThenValidates = { ...o, async rollbackMergeForUser(moves, pair) { for (const m of moves) if (m.path !== 'AccountAdminConformance/not-planned') await db().doc(m.path).update({ owner_id: m.from }); o.validateRollbackMoves(moves, pair); return o.rollbackMergeForUser(moves, pair); } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(writesThenValidates, opts), nonConforming('e', /rollbackMergeForUser\(an edited move, pair\) refused but changed the store/));
    seed();
    const badResult = { ...o, async mergeForUser(pair, opt) { await o.mergeForUser(pair, opt); return { moves: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(badResult, opts), nonConforming('e', /moved, remaining/));
});

test('checker negative controls, clause (i): a rollback that overwrites a value changed since the merge is RED', async () => {
    const opts = fx({ user: SURVIVOR_USER, pair: LEGACY_PAIR, emptyFootprint: true, changeAfterMerge });
    const o = productsOwner();
    const db = () => fake.FakeCacheFirestore.prototype.db;
    const overwrites = { ...o, async rollbackMergeForUser(moves, pair) { o.validateRollbackMoves(moves, pair); for (const m of moves) await db().doc(m.path).update({ owner_id: m.from }); return { restored: moves.map((m) => ({ path: m.path, field: m.field })), remaining: [] }; } };
    await assert.rejects(P.assertAccountStoreOwnerConforms(overwrites, opts), nonConforming('i', /restored, but its value had changed|overwrote/));
});

// ------------------------------------------------------------------------- the export surface

test('exports: the contract the sibling store owners import, at @descix/platform-api/account-admin and the package root', async () => {
    const sub = await import('../src/account-admin/index.js');
    const names = ['AccountAdminRefusal', 'AccountAdminError', 'accountAdminBlocker', 'receiptData', 'encodeStoreValue', 'redactCredentials', 'REDACTED',
        'ACCOUNT_READ_LIMIT', 'DELETE_OUTCOME', 'MERGE_OUTCOME', 'MERGE_ROLLBACK_OUTCOME', 'RESTORE_OUTCOME', 'STORE_OWNER_METHODS', 'STORE_OWNER_MERGE_METHODS', 'STORE_OWNER_RESTORE_METHOD', 'USER_OWNER_METHODS',
        'deletePlanHash', 'mergePlanHash',
        'canonicalJson', 'accountAdminHash', 'nonJsonValuePath', 'unredactedCredentialPaths', 'footprintViolation', 'moveKey', 'AccountStoreOwnerNonConformance', 'assertAccountStoreOwnerConforms', 'createAccountAdmin', 'ACCOUNT_PLAN_TTL_SECONDS',
        'credentialValues', 'secretPath', 'isSecretPath', 'entryDataHash', 'deleteExpectations', 'assertDeletePlanCurrent', 'assertDocumentAsPlanned'];
    for (const n of names) {
        assert.ok(n in sub, `account-admin exports ${n}`);
        assert.equal(P[n], sub[n], `the package root re-exports the same ${n}`);
    }
    assert.equal(P.ACCOUNT_READ_LIMIT, 500);
    assert.deepEqual(P.STORE_OWNER_METHODS, ['footprintForUser', 'deleteForUser', 'storeTarget']);
    assert.deepEqual(P.STORE_OWNER_MERGE_METHODS, ['footprintForMerge', 'mergeForUser', 'rollbackMergeForUser', 'validateRollbackMoves']);
    assert.deepEqual(P.USER_OWNER_METHODS, ['account', 'accountsByEmailPrefixes', 'readMergeFields', 'preflightDelete', 'stampDelete', 'clearDeleteStamp']);
    assert.equal(P.STORE_OWNER_RESTORE_METHOD, 'restoreForUser');
    assert.deepEqual(P.RESTORE_OUTCOME, { RESTORED: 'RESTORED', NOT_RESTORED: 'NOT_RESTORED', PARTIAL: 'PARTIAL', UNVERIFIED: 'UNVERIFIED' });
    assert.equal(P.AccountAdminRefusal.ACCOUNT_MERGE_SOURCE_NOT_LEGACY, 'ACCOUNT_MERGE_SOURCE_NOT_LEGACY');
    assert.equal(typeof P.bootedEnvDatabaseId, 'function');
});

test('AccountAdminError: instanceof holds across two copies of the package (a sibling repo\'s own node_modules copy); a plain Error with a code does not pass', async () => {
    const copy = await import(`../src/account-admin/contract.js?copy=${Date.now()}`);
    assert.notEqual(copy.AccountAdminError, P.AccountAdminError, 'a second module instance');
    const e = new copy.AccountAdminError(R().ACCOUNT_PLAN_STALE, 'x');
    assert.ok(e instanceof P.AccountAdminError);
    assert.ok(new P.AccountAdminError(R().ACCOUNT_PLAN_STALE, 'x') instanceof copy.AccountAdminError);
    assert.ok(!(Object.assign(new Error('x'), { code: R().ACCOUNT_PLAN_STALE, name: 'AccountAdminError' }) instanceof P.AccountAdminError), 'negative control: duck-typed name and code are not the class');
    assert.ok(Object.isFrozen(copy.accountAdminBlocker(R().ACCOUNT_PLAN_STALE, 'x')));
});

// ------------------------------------------------------------------------- reach and encapsulation

const coreRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_SRC = path.join(coreRoot, 'descix-platform-api', 'src');
const OWNERS = new Set([path.join(API_SRC, 'models', 'index.js'), path.join(API_SRC, 'index.js'), path.join(API_SRC, 'account-admin', 'index.js'), path.join(API_SRC, 'account-admin', 'contract.js'), path.join(API_SRC, 'account-admin', 'conformance.js')]);
const OPERATOR_SURFACE = /\b(userAccountOwner|createAccountAdmin|mergeForUser|rollbackMergeForUser|unmarkMigrated)\b/;

function sourceFiles(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === 'tests' || e.name === 'test' || e.name.startsWith('.')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) sourceFiles(p, out);
        else if (/\.(m?js|jsx|ts|json)$/.test(e.name)) out.push(p);
    }
    return out;
}
const reachers = (files) => files.filter((f) => !OWNERS.has(f) && OPERATOR_SURFACE.test(fs.readFileSync(f, 'utf8')));
const firestoreIn = (files) => files.filter((f) => /\bCacheFirestore\b|\bgetFirestoreInstance\b|@google-cloud\/firestore|\bFirestore\.|new Firestore\b/.test(fs.readFileSync(f, 'utf8')));
const cloudCoreImports = (files) => files.flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/import\s*\{([^}]*)\}\s*from\s*'@descix\/cloud-core'/g)].map((m) => [path.basename(f), m[1].trim()]))
    .concat(files.filter((f) => /@descix\/cloud-core'/.test(fs.readFileSync(f, 'utf8')) && !/import\s*\{[^}]*\}\s*from\s*'@descix\/cloud-core'/.test(fs.readFileSync(f, 'utf8'))).map((f) => [path.basename(f), '(another form)']));

test('reach: no CLI, MCP, SDK, app-sdk or cloud-core module reaches the account admin; only its owners name it', () => {
    const packages = fs.readdirSync(coreRoot).filter((d) => d.startsWith('descix-') && fs.statSync(path.join(coreRoot, d)).isDirectory());
    assert.ok(packages.includes('descix-cli') && packages.includes('descix-platform-api'), packages.join(', '));
    const files = packages.flatMap((d) => sourceFiles(path.join(coreRoot, d)));
    assert.deepEqual(reachers(files).map((f) => path.relative(coreRoot, f)), []);
});

test('encapsulation: the orchestrator and the contract hold no Firestore client (user-domain access stays in the User owner); the one cloud-core import is the booted config read', () => {
    const files = sourceFiles(path.join(API_SRC, 'account-admin')).concat(sourceFiles(path.join(API_SRC, 'operator')));
    assert.equal(files.length, 5, files.join(', '));
    assert.deepEqual(firestoreIn(files), []);
    assert.deepEqual(cloudCoreImports(files), [['booted-database.js', 'getCloudConfig']]);
});

test('negative controls: the reach and encapsulation scans FAIL on a module that reaches them', () => {
    const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'reach-'));
    const bad = path.join(tmp, 'commandHandler.js');
    fs.writeFileSync(bad, "import { CacheFirestore } from '@descix/cloud-core';\nexport const h = (p) => createAccountAdmin(p);\n");
    try {
        assert.deepEqual(reachers([bad]), [bad]);
        assert.deepEqual(firestoreIn([bad]), [bad]);
        assert.deepEqual(cloudCoreImports([bad]), [['commandHandler.js', 'CacheFirestore']]);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});
