/**
 * Local verification code sink (auth/emailVerification.js writeLocalVerificationCode).
 *
 * On a developer machine (utils.isManagedCloudRuntime === false) with LOCAL_VERIFICATION_CODE_SINK
 * set, sendEmailVerification ALSO appends the plain code as a JSON line to that file (mode 600),
 * and the code it writes is the one verifyEmailCode accepts. Without the key nothing is written.
 * With the key on a managed runtime the send refuses before any write (cloud-core refuses that
 * config at boot: descix-cloud-core/tests/local-only-keys.test.js). The code is never logged.
 *
 * Firestore is an in-memory fake; the Gmail transport is mocked. Nothing leaves the process.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/local-verification-code-sink.test.js
 */
import { test, mock, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const real = await import('@descix/cloud-core');

const store = new Map();
const sent = [];
const coll = (p) => { if (!store.has(p)) store.set(p, new Map()); return store.get(p); };

class FakeCacheFirestore {
    async put_doc(p, id, data) { const c = coll(p); c.set(id, { ...(c.get(id) || {}), ...data }); return true; }
    async get_doc(p, id) { const d = coll(p).get(id); return d ? { ...d } : null; }
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

/** The config the module reads; each test sets the runtime and the sink key. */
let cfg;
mock.module('@descix/cloud-core', {
    namedExports: { ...real, CacheFirestore: FakeCacheFirestore, getCloudConfig: () => cfg }
});

let ev;
before(async () => { ev = await import('../src/auth/emailVerification.js'); });

const EMAIL = 'sink-fixture@example.org';
const UID = 'cred_sink_fixture';
let dir, sink, logged;
const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };

beforeEach(() => {
    store.clear(); sent.length = 0; logged = [];
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-code-sink-'));
    sink = path.join(dir, 'nested', 'verification-codes.jsonl');
    cfg = {
        DESCIX_ROUTER_COMMUNITY_MANAGER: 'router@fixture.invalid',
        GMAIL_SENDER_EMAIL: 'reply@fixture.invalid',
        GOOGLE_APPLICATION_CREDENTIALS: { client_email: 'sa@fixture.invalid', private_key: 'fixture' },
        DESCIX_ADMIN_GROUP: null,
        isManagedCloudRuntime: false,
    };
    for (const k of Object.keys(orig)) console[k] = (...a) => logged.push(a.map(String).join(' '));
});
afterEach(() => {
    Object.assign(console, orig);
    fs.rmSync(dir, { recursive: true, force: true });
});

const mailedCode = () => sent.at(-1).match(/\b(\d{6})\b/)[1];
const lines = () => fs.readFileSync(sink, 'utf8').trim().split('\n').map((l) => JSON.parse(l));

test('the config key the sink reads is a cloud-core local-only key (one owner of the key list)', () => {
    assert.equal(ev.LOCAL_VERIFICATION_CODE_SINK_KEY, 'LOCAL_VERIFICATION_CODE_SINK');
    assert.ok(real.LOCAL_ONLY_CONFIG_KEYS.includes(ev.LOCAL_VERIFICATION_CODE_SINK_KEY));
});

test('(1) developer machine + key: the code is appended (mode 600) and verifyEmailCode accepts it', async () => {
    cfg.LOCAL_VERIFICATION_CODE_SINK = sink;
    const r = await ev.sendEmailVerification({ email: ' Sink-Fixture@Example.org ', uid: UID });
    assert.equal(r.status, 'OK');
    assert.equal(fs.statSync(sink).mode & 0o777, 0o600, 'the sink file must be created 600');
    assert.equal(fs.statSync(path.dirname(sink)).mode & 0o777, 0o700, 'a created parent dir must be 700');
    const [line] = lines();
    assert.deepEqual(Object.keys(line).sort(), ['code', 'email', 'expires_at', 'requested_by', 'timestamp']);
    assert.equal(line.email, EMAIL);
    assert.equal(line.requested_by, UID);
    assert.match(line.code, /^\d{6}$/);
    assert.equal(line.code, mailedCode(), 'the sink carries the code that was mailed');
    assert.ok(Math.abs(Date.parse(line.expires_at) - (Date.now() + 15 * 60 * 1000)) < 5000);
    assert.ok(!Number.isNaN(Date.parse(line.timestamp)));
    assert.ok(!logged.join('\n').includes(line.code), 'the code must never be logged');

    const ok = await ev.verifyEmailCode({ email: EMAIL, code: line.code, uid: UID });
    assert.equal(ok.status, 'OK', JSON.stringify(ok));
});

test('(1b) a second send appends; the newest line is the live code', async () => {
    cfg.LOCAL_VERIFICATION_CODE_SINK = sink;
    await ev.sendEmailVerification({ email: EMAIL, uid: null });
    await ev.sendEmailVerification({ email: EMAIL, uid: UID });
    const all = lines();
    assert.equal(all.length, 2);
    assert.equal(all[0].requested_by, null);
    const ok = await ev.verifyEmailCode({ email: EMAIL, code: all.at(-1).code, uid: UID });
    assert.equal(ok.status, 'OK');
});

test('(2) developer machine without the key: nothing is written', async () => {
    const r = await ev.sendEmailVerification({ email: EMAIL, uid: UID });
    assert.equal(r.status, 'OK');
    assert.deepEqual(fs.readdirSync(dir), [], 'no file or directory may be created');
});

test('(3) key on a managed runtime: the send refuses before any write, store or mail', async () => {
    cfg.LOCAL_VERIFICATION_CODE_SINK = sink;
    cfg.isManagedCloudRuntime = true;
    await assert.rejects(ev.sendEmailVerification({ email: EMAIL, uid: UID }),
        /LOCAL_VERIFICATION_CODE_SINK is set but this process is not on a developer machine/);
    assert.deepEqual(fs.readdirSync(dir), []);
    assert.equal(sent.length, 0, 'nothing may be mailed');
    assert.equal(store.size, 0, 'nothing may be stored');
});

test('a relative sink path is refused', async () => {
    cfg.LOCAL_VERIFICATION_CODE_SINK = 'codes.jsonl';
    await assert.rejects(ev.sendEmailVerification({ email: EMAIL, uid: UID }), /must be an absolute file path/);
});

test('an existing sink file readable by others is refused, not used', async () => {
    cfg.LOCAL_VERIFICATION_CODE_SINK = sink;
    fs.mkdirSync(path.dirname(sink), { recursive: true });
    fs.writeFileSync(sink, '', { mode: 0o644 });
    fs.chmodSync(sink, 0o644);
    await assert.rejects(ev.sendEmailVerification({ email: EMAIL, uid: UID }), /has mode 644; it must be 600/);
    assert.equal(fs.readFileSync(sink, 'utf8'), '');
});
