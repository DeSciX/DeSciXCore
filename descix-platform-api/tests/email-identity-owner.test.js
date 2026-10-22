/**
 * Email identity — one email, one account, and a verification that
 * belongs to the account that requested it. Owner tests for:
 *   - sendEmailVerification / verifyEmailCode / assertEmailVerifiedFor (auth/emailVerification.js)
 *   - User.assertEmailFreeFor / User.commitTosAndConnect / User.findByEmail (models/index.js)
 *
 * Firestore is an in-memory fake standing in for CacheFirestore; the Gmail transport is mocked.
 * Nothing leaves the process.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/email-identity-owner.test.js
 */
import { test, mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const real = await import('@descix/cloud-core');

/** collectionPath -> Map(docId -> data) */
const store = new Map();
const sent = [];
let failUsersQuery = false;

const coll = (p) => { if (!store.has(p)) store.set(p, new Map()); return store.get(p); };

class FakeCacheFirestore {
    async put_doc(p, id, data) { const c = coll(p); c.set(id, { ...(c.get(id) || {}), ...data }); return true; }
    async get_doc(p, id) { const d = coll(p).get(id); return d ? { ...d } : null; }
    async update_doc_fields(p, id, updates) { const c = coll(p); c.set(id, { ...(c.get(id) || {}), ...updates }); return true; }
    async delete_doc(p, id) { coll(p).delete(id); return true; }
    async get_docs_with_ids(p, ids, where) {
        if (failUsersQuery && p === real.FirestoreCollections.USERS()) return null;
        const out = [];
        for (const [id, d] of coll(p)) {
            if ((where || []).every(([f, op, v]) => op === '==' && d[f] === v)) out.push({ ...d, _id: id });
        }
        return out;
    }
}

mock.module('googleapis', {
    namedExports: {
        google: {
            auth: { JWT: class { constructor(opts) { this.opts = opts; } } },
            gmail: () => ({ users: { messages: { send: async ({ requestBody }) => {
                sent.push(Buffer.from(requestBody.raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
            } } } })
        }
    }
});

mock.module('@descix/cloud-core', {
    namedExports: {
        ...real,
        CacheFirestore: FakeCacheFirestore,
        getCloudConfig: () => ({
            DESCIX_ROUTER_COMMUNITY_MANAGER: 'router@fixture.invalid',
            GMAIL_SENDER_EMAIL: 'reply@fixture.invalid',
            GOOGLE_APPLICATION_CREDENTIALS: { client_email: 'sa@fixture.invalid', private_key: 'fixture' },
            DESCIX_ADMIN_GROUP: null
        })
    }
});

let ev, models;
before(async () => {
    ev = await import('../src/auth/emailVerification.js');
    models = await import('../src/models/index.js');
});

const { FirestoreCollections, Timestamp } = real;
const EV = () => coll(FirestoreCollections.EMAIL_VERIFICATIONS());
const USERS = () => coll(FirestoreCollections.USERS());
const INDEX = () => coll(FirestoreCollections.PROVIDER_INDEX());

const ALICE = 'cred_alice';
const MALLORY = 'cred_mallory';
const EMAIL = 'alice@example.org';
const inMinutes = (m) => Timestamp.fromDate(new Date(Date.now() + m * 60 * 1000));

/** The code the fake Gmail transport carried in the last message. */
function lastCode() {
    const m = sent.at(-1)?.match(/\b(\d{6})\b/);
    assert.ok(m, 'no 6-digit code in the last sent message');
    return m[1];
}

async function rejectsWith(fn, code) {
    await assert.rejects(fn, (err) => {
        assert.equal(err.name, 'EmailIdentityError', `expected EmailIdentityError, got ${err.name}: ${err.message}`);
        assert.equal(err.code, code);
        assert.equal(err.statusCode, 403);
        return true;
    });
}

beforeEach(() => { store.clear(); sent.length = 0; failUsersQuery = false; });

// --- verification binding -------------------------------------------------------------------

test('send binds the record to the requesting uid; every send rewrites the binding (null when no account)', async () => {
    await ev.sendEmailVerification({ email: ' Alice@Example.org ', uid: ALICE });
    assert.equal(EV().get(EMAIL).uid, ALICE, 'record keyed by the normalized email carries the requester');
    await ev.sendEmailVerification({ email: EMAIL });
    assert.equal(EV().get(EMAIL).uid, null, 'an account-less send must clear an earlier binding, not inherit it');
    assert.ok(Object.prototype.hasOwnProperty.call(EV().get(EMAIL), 'uid'));
});

test('verifyEmailCode: another account cannot verify (or spend attempts on) a bound record', async () => {
    await ev.sendEmailVerification({ email: EMAIL, uid: ALICE });
    const code = lastCode();
    const r = await ev.verifyEmailCode({ email: EMAIL, code, uid: MALLORY });
    assert.equal(r.status, 'ERROR');
    assert.equal(r.code, 'EMAIL_VERIFICATION_NOT_YOURS');
    assert.equal(EV().get(EMAIL).attempts, 0, 'a refused non-owner must not touch the attempt counter');
    assert.equal(EV().get(EMAIL).verified, false);
    const ok = await ev.verifyEmailCode({ email: EMAIL, code, uid: ALICE });
    assert.equal(ok.status, 'OK');
    assert.equal(EV().get(EMAIL).verified, true);
});

test('verifyEmailCode: an account refuses a pre-binding record (no uid field) with UNBOUND', async () => {
    EV().set(EMAIL, { email: EMAIL, code_hash: 'x', expires_at: inMinutes(10), attempts: 0, verified: false });
    const r = await ev.verifyEmailCode({ email: EMAIL, code: '123456', uid: ALICE });
    assert.equal(r.code, 'EMAIL_VERIFICATION_UNBOUND');
});

test('assertEmailVerifiedFor: NOT_YOURS — a record verified by another account is refused', async () => {
    EV().set(EMAIL, { email: EMAIL, uid: ALICE, expires_at: inMinutes(10), verified: true });
    await rejectsWith(() => ev.assertEmailVerifiedFor(MALLORY, EMAIL), 'EMAIL_VERIFICATION_NOT_YOURS');
});

test('assertEmailVerifiedFor: NOT_YOURS — an account-less (uid null) record is refused', async () => {
    EV().set(EMAIL, { email: EMAIL, uid: null, expires_at: inMinutes(10), verified: true });
    await rejectsWith(() => ev.assertEmailVerifiedFor(ALICE, EMAIL), 'EMAIL_VERIFICATION_NOT_YOURS');
});

test('assertEmailVerifiedFor: EXPIRED — a verified record past expires_at is refused', async () => {
    EV().set(EMAIL, { email: EMAIL, uid: ALICE, expires_at: inMinutes(-1), verified: true });
    await rejectsWith(() => ev.assertEmailVerifiedFor(ALICE, EMAIL), 'EMAIL_VERIFICATION_EXPIRED');
});

test('assertEmailVerifiedFor: NOT_VERIFIED — no record, or an unverified one', async () => {
    await rejectsWith(() => ev.assertEmailVerifiedFor(ALICE, EMAIL), 'EMAIL_NOT_VERIFIED');
    EV().set(EMAIL, { email: EMAIL, uid: ALICE, expires_at: inMinutes(10), verified: false });
    await rejectsWith(() => ev.assertEmailVerifiedFor(ALICE, EMAIL), 'EMAIL_NOT_VERIFIED');
});

test('assertEmailVerifiedFor: UNBOUND — a verified record that pre-dates the binding is never grandfathered', async () => {
    EV().set(EMAIL, { email: EMAIL, expires_at: inMinutes(10), verified: true });
    await rejectsWith(() => ev.assertEmailVerifiedFor(ALICE, EMAIL), 'EMAIL_VERIFICATION_UNBOUND');
});

test('assertEmailVerifiedFor: the requester, verified, in time, any case — passes', async () => {
    await ev.sendEmailVerification({ email: EMAIL, uid: ALICE });
    await ev.verifyEmailCode({ email: EMAIL, code: lastCode(), uid: ALICE });
    assert.deepEqual(await ev.assertEmailVerifiedFor(ALICE, 'ALICE@example.ORG '), { email: EMAIL });
});

// --- one email, one account -----------------------------------------------------------------

function seedUser(id, fields = {}) { USERS().set(id, { id, roles: {}, nfts: {}, ad_campaigns: {}, ...fields }); }

test('assertEmailFreeFor: ALREADY_REGISTERED when the email index row points at another account', async () => {
    INDEX().set(models.User.emailIndexKey(EMAIL), { descix_user_id: ALICE, provider_type: 'email', provider_id: EMAIL });
    await rejectsWith(() => models.User.assertEmailFreeFor(MALLORY, 'Alice@Example.org'), 'EMAIL_ALREADY_REGISTERED');
    await models.User.assertEmailFreeFor(ALICE, EMAIL); // the holder itself is free to re-commit
});

test('assertEmailFreeFor: ALREADY_REGISTERED for an account that holds the email with no index row (pre-index accounts)', async () => {
    seedUser(ALICE, { email: EMAIL, verified_email: EMAIL });
    await rejectsWith(() => models.User.assertEmailFreeFor(MALLORY, EMAIL), 'EMAIL_ALREADY_REGISTERED');
});

test('assertEmailFreeFor: ALREADY_REGISTERED_LEGACY when the only holder is a legacy email-keyed account (doc id = the email)', async () => {
    seedUser(EMAIL, { email: EMAIL });
    await rejectsWith(() => models.User.assertEmailFreeFor(MALLORY, ' Alice@Example.org'), 'EMAIL_ALREADY_REGISTERED_LEGACY');
    USERS().set(EMAIL, { id: EMAIL }); // keyed by the email, no email field: still found by its key
    await rejectsWith(() => models.User.assertEmailFreeFor(MALLORY, EMAIL), 'EMAIL_ALREADY_REGISTERED_LEGACY');
});

test('assertEmailFreeFor: a passkey holder alongside a legacy one is the passkey case (ALREADY_REGISTERED)', async () => {
    seedUser(EMAIL, { email: EMAIL });
    INDEX().set(models.User.emailIndexKey(EMAIL), { descix_user_id: ALICE, provider_type: 'email', provider_id: EMAIL });
    await rejectsWith(() => models.User.assertEmailFreeFor(MALLORY, EMAIL), 'EMAIL_ALREADY_REGISTERED');
});

test('assertEmailFreeFor: a failed USERS read throws, never reads as "free"', async () => {
    failUsersQuery = true;
    await assert.rejects(() => models.User.assertEmailFreeFor(MALLORY, EMAIL), /USERS query on email failed/);
});

test('commitTosAndConnect: writes the email index row; findByEmail now finds the Powch account', async () => {
    seedUser(ALICE);
    const alice = await models.User.from_firestore(ALICE);
    await alice.commitTosAndConnect({ tos_version: '1.0.0', gate_source: 'master_zero_entitlement', verified_email: ' Alice@Example.ORG' });
    const row = INDEX().get(models.User.emailIndexKey(EMAIL));
    assert.equal(row?.descix_user_id, ALICE);
    assert.equal(row.provider_type, 'email');
    assert.equal(row.provider_id, EMAIL, 'the row stores the normalized email');
    assert.match(models.User.emailIndexKey(EMAIL), /^email_[0-9a-f]{32}$/, 'the email_<sanitizeProviderId> form findByEmail reads');
    assert.equal(USERS().get(ALICE).verified_email, EMAIL);
    assert.equal(USERS().get(ALICE).email, EMAIL);
    const found = await models.User.findByEmail('ALICE@example.org');
    assert.equal(found?.id, ALICE);
});

test('commitTosAndConnect: a second account with the same email is refused and nothing is written', async () => {
    seedUser(ALICE); seedUser(MALLORY);
    await (await models.User.from_firestore(ALICE)).commitTosAndConnect({ gate_source: 'g', verified_email: EMAIL });
    const mallory = await models.User.from_firestore(MALLORY);
    await rejectsWith(() => mallory.commitTosAndConnect({ gate_source: 'g', verified_email: 'alice@EXAMPLE.org' }), 'EMAIL_ALREADY_REGISTERED');
    assert.equal(USERS().get(MALLORY).tos_accepted_at, undefined, 'the refused account is not committed');
    assert.equal(USERS().get(MALLORY).email, undefined);
    assert.equal(INDEX().get(models.User.emailIndexKey(EMAIL)).descix_user_id, ALICE, 'the holder keeps the row');
});

test('commitTosAndConnect: changing the email releases this account\'s previous index row', async () => {
    seedUser(ALICE);
    await (await models.User.from_firestore(ALICE)).commitTosAndConnect({ gate_source: 'g', verified_email: EMAIL });
    await (await models.User.from_firestore(ALICE)).commitTosAndConnect({ gate_source: 'g', verified_email: 'alice2@example.org' });
    assert.equal(INDEX().has(models.User.emailIndexKey(EMAIL)), false);
    assert.equal(INDEX().get(models.User.emailIndexKey('alice2@example.org')).descix_user_id, ALICE);
});

test('one normaliser: models/index.js consumes the email module\'s normalizeEmail, no local copy', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(path.join(here, '../src/models/index.js'), 'utf8');
    assert.equal(/function\s+normalizeEmail\s*\(/.test(src), false, 'models/index.js must not define its own normalizeEmail');
    assert.match(src, /import \{ normalizeEmail \} from '\.\.\/email\/index\.js';/);
});
