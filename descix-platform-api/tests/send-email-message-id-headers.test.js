/**
 * sendEmail returns the provider's message id and accepts an allow-listed set of extra headers
 * (List-Unsubscribe, List-Unsubscribe-Post) — additive, for the Cloud campaign send (E1c PR-2), which
 * records a send as 'sent' only together with the message id and sets RFC 8058 one-click headers.
 *
 * WHAT IT CATCHES: a call without `headers` whose MIME differs by one byte from before this option
 * existed (GOLDEN below was captured from the pre-change module at origin/main 152458e with Date.now and
 * Math.random frozen); a provider answer without an id returned as undefined instead of thrown; a header
 * outside the allow-list, or a value carrying CR/LF (header injection), let through; a refused call that
 * still reached Gmail.
 * The Gmail transport and the config are mocked; nothing is sent.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/send-email-message-id-headers.test.js
 */
import { test, mock, before } from 'node:test';
import assert from 'node:assert/strict';

const sent = [];
let answer = (n) => ({ data: { id: `gmail-id-${n}` } });

mock.module('googleapis', {
    namedExports: {
        google: {
            auth: { JWT: class { constructor(opts) { this.opts = opts; } } },
            gmail: () => ({
                users: { messages: { send: async ({ requestBody }) => {
                    sent.push(Buffer.from(requestBody.raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
                    return answer(sent.length);
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
            GOOGLE_APPLICATION_CREDENTIALS: { client_email: 'sa@fixture.invalid', private_key: 'fixture' }
        })
    }
});

/** The three messages the pre-change module built (plain, html, verification), byte for byte. */
const GOLDEN = ["From: DeSciX <router@fixture.invalid>\nTo: to@fixture.invalid\nReply-To: reply@fixture.invalid\nSubject: Plain subject\nContent-Type: text/plain; charset=\"UTF-8\"\n\nline one\nline two","From: DeSciX <router@fixture.invalid>\nTo: to@fixture.invalid\nReply-To: reply@fixture.invalid\nSubject: Rich subject\nMIME-Version: 1.0\nContent-Type: multipart/alternative; boundary=\"descix-alt-1700000000000-4fzzzxjy\"\n\n--descix-alt-1700000000000-4fzzzxjy\nContent-Type: text/plain; charset=\"UTF-8\"\n\ntext alt\n--descix-alt-1700000000000-4fzzzxjy\nContent-Type: text/html; charset=\"UTF-8\"\n\n<p>hi</p>\n--descix-alt-1700000000000-4fzzzxjy--","From: DeSciX <router@fixture.invalid>\nTo: to@fixture.invalid\nReply-To: reply@fixture.invalid\nSubject: Your DeSciX verification code\nContent-Type: text/plain; charset=\"UTF-8\"\n\nYour DeSciX verification code is: 123456\n\nThis code expires in 15 minutes.\nIf you did not request this, please ignore this email."];

let email;
before(async () => { email = await import('../src/email/index.js'); });

const frozen = async (fn) => {
    const [now, rnd] = [Date.now, Math.random];
    Date.now = () => 1700000000000; Math.random = () => 0.123456789;
    try { return await fn(); } finally { Date.now = now; Math.random = rnd; }
};

test('without headers the MIME is byte-for-byte the pre-change message (plain, html, verification)', async () => {
    sent.length = 0;
    await frozen(async () => {
        await email.sendEmail('to@fixture.invalid', 'Plain subject', 'line one\nline two');
        await email.sendEmail('to@fixture.invalid', 'Rich subject', 'text alt', null, { html: '<p>hi</p>' });
        await email.sendVerificationEmail('to@fixture.invalid', '123456', 15);
    });
    assert.deepEqual(sent, GOLDEN);
});

test('sendEmail returns { message_id } from the provider answer', async () => {
    sent.length = 0;
    const out = await email.sendEmail('to@fixture.invalid', 'S', 'b');
    assert.deepEqual(out, { message_id: 'gmail-id-1' });
});

test('a provider answer without an id is THROWN (EMAIL_PROVIDER_NO_MESSAGE_ID), never returned as undefined', async () => {
    for (const bad of [undefined, {}, { data: {} }, { data: { id: '' } }, { data: { id: 7 } }]) {
        answer = () => bad;
        await assert.rejects(email.sendEmail('to@fixture.invalid', 'S', 'b'), (e) => e.code === 'EMAIL_PROVIDER_NO_MESSAGE_ID');
    }
    answer = (n) => ({ data: { id: `gmail-id-${n}` } });
});

test('List-Unsubscribe and List-Unsubscribe-Post are written after Subject, on both message shapes', async () => {
    sent.length = 0;
    const headers = { 'List-Unsubscribe': '<https://descix.net/apifront/campaign/unsubscribe?t=v1.x>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
    await email.sendEmail('to@fixture.invalid', 'S', 'b', null, { headers });
    await email.sendEmail('to@fixture.invalid', 'S', 'b', null, { html: '<p>x</p>', headers });
    for (const msg of sent) {
        assert.match(msg, /\nSubject: S\nList-Unsubscribe: <https:\/\/descix\.net\/apifront\/campaign\/unsubscribe\?t=v1\.x>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\n/);
    }
    assert.deepEqual(email.EMAIL_EXTRA_HEADERS, ['List-Unsubscribe', 'List-Unsubscribe-Post']);
    assert.ok(Object.isFrozen(email.EMAIL_EXTRA_HEADERS));
});

test('any other header name is refused BY NAME, a CR/LF or empty value is refused, and nothing reaches Gmail', async () => {
    sent.length = 0;
    for (const name of ['Bcc', 'From', 'list-unsubscribe', 'X-Anything']) {
        await assert.rejects(email.sendEmail('to@fixture.invalid', 'S', 'b', null, { headers: { [name]: 'v' } }), (e) => {
            assert.equal(e.code, 'EMAIL_HEADER_NOT_ALLOWED'); assert.ok(e.message.includes(`'${name}'`)); return true;
        });
    }
    for (const value of ['<https://a>\r\nBcc: x@y.z', 'a\nb', '', '  ', 7, null]) {
        await assert.rejects(email.sendEmail('to@fixture.invalid', 'S', 'b', null, { headers: { 'List-Unsubscribe': value } }),
            (e) => e.code === 'EMAIL_HEADER_VALUE_INVALID');
    }
    for (const headers of [[], 'List-Unsubscribe: x']) {
        await assert.rejects(email.sendEmail('to@fixture.invalid', 'S', 'b', null, { headers }), (e) => e.code === 'EMAIL_HEADERS_INVALID');
    }
    assert.equal(sent.length, 0, 'a refused call never reaches Gmail');
});
