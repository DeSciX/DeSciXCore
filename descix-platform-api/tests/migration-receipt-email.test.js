/**
 * The queued-migration receipt carries NO payment-quote fields.
 *
 * The airdrop migration lane used to send its receipt through `sendPaymentPending`, a crypto
 * payment-quote template (deposit address, quote id, expiry). Fed a migration it rendered
 * "DEPOSIT ADDRESS: undefined" and "Expires: Invalid Date". The NEGATIVE CONTROL below renders
 * exactly that call through the real template and shows the detector fires on it, so the
 * positive assertion on the migration receipt cannot pass vacuously.
 *
 * The Gmail transport and the config are mocked; nothing is sent.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/migration-receipt-email.test.js
 */
import { test, mock, before } from 'node:test';
import assert from 'node:assert/strict';

const sent = [];

mock.module('googleapis', {
    namedExports: {
        google: {
            auth: { JWT: class { constructor(opts) { this.opts = opts; } } },
            gmail: () => ({
                users: { messages: { send: async ({ requestBody }) => {
                    sent.push(Buffer.from(requestBody.raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
                } } }
            })
        }
    }
});

mock.module('@descix/cloud-core', {
    namedExports: {
        getCloudConfig: () => ({
            DESCIX_ROUTER_COMMUNITY_MANAGER: 'router@fixture.invalid',
            GMAIL_SENDER_EMAIL: 'reply@fixture.invalid',
            GOOGLE_APPLICATION_CREDENTIALS: { client_email: 'sa@fixture.invalid', private_key: 'fixture' },
            DESCIX_ADMIN_GROUP: null
        })
    }
});

let email;
before(async () => {
    email = await import('../src/email/index.js');
});

/** Markers that only a payment quote carries, plus the artifacts of feeding it a migration. */
const PAYMENT_QUOTE_MARKERS = ['DEPOSIT ADDRESS', 'Quote ID', 'Expires', 'Payment', 'undefined', 'Invalid Date'];
const present = (text) => PAYMENT_QUOTE_MARKERS.filter(m => text.includes(m));

const MIGRATION = {
    airdrop_address: '0x' + '1'.repeat(40),
    master_wallet_address: '0x' + '2'.repeat(40),
    tokens: [{ symbol: 'DAITA', amount: '2500' }, { symbol: 'EGPT', amount: '10' }]
};

test('NEGATIVE CONTROL: the payment template, called the way the migration lane called it, trips the detector', async () => {
    sent.length = 0;
    await email.sendPaymentPending({ amount_tokens: 2510, source: 'airdrop', pending_id: 'chal-1' }, 'user@fixture.invalid');
    assert.equal(sent.length, 1);
    const hits = present(sent[0]);
    assert.ok(hits.includes('DEPOSIT ADDRESS') && hits.includes('Invalid Date'), `detector must fire; hits=${hits}`);
});

test('the migration receipt renders what was queued, from which wallet, to which wallet, and when — no payment fields', () => {
    const { subject, body } = email.renderMigrationQueuedEmail(MIGRATION);
    assert.deepEqual(present(subject + '\n' + body), []);
    assert.match(body, /2500 DAITA/);
    assert.match(body, /10 EGPT/);
    assert.ok(body.includes(`From (airdrop wallet):  ${MIGRATION.airdrop_address}`));
    assert.ok(body.includes(`To (DeSciX wallet):     ${MIGRATION.master_wallet_address}`));
    assert.match(body, /next administrative batch/);
});

test('sendMigrationQueued sends exactly the rendered receipt (and nothing that looks like a quote)', async () => {
    sent.length = 0;
    await email.sendMigrationQueued(MIGRATION, 'user@fixture.invalid');
    assert.equal(sent.length, 1);
    assert.deepEqual(present(sent[0]), []);
    assert.match(sent[0], /Subject: Your airdrop migration is queued/);
});

test('a receipt that cannot name both wallets is refused, never rendered with a blank', () => {
    assert.throws(() => email.renderMigrationQueuedEmail({ ...MIGRATION, master_wallet_address: null }), /master_wallet_address/);
    assert.throws(() => email.renderMigrationQueuedEmail({ ...MIGRATION, airdrop_address: '' }), /airdrop_address/);
    assert.throws(() => email.renderMigrationQueuedEmail({ ...MIGRATION, tokens: [] }), /tokens/);
});
