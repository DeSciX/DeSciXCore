/**
 * Q15 (CEO word, Unkamon c7bbc15): HTML email templates. The transport half: sendEmail
 * gains an opt-in HTML body — `sendEmail(to, subject, body, fromEmail, { html })` builds
 * multipart/alternative (text part = the plain body, html part = the given html). The
 * plain path is UNCHANGED for every existing caller (same single-part text/plain message).
 *
 * The Gmail transport and the config are mocked; nothing is sent.
 *
 * Run (from descix-platform-api/): node --test --experimental-test-module-mocks tests/send-email-html-alternative.test.js
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

test('the plain path is UNCHANGED: single-part text/plain, no multipart artifacts', async () => {
    sent.length = 0;
    await email.sendEmail('to@fixture.invalid', 'Plain subject', 'plain body text');
    assert.equal(sent.length, 1);
    const msg = sent[0];
    assert.match(msg, /Content-Type: text\/plain; charset="UTF-8"/);
    assert.ok(!/multipart\/alternative/.test(msg), 'no multipart wrapper on the plain path');
    assert.ok(!/boundary/.test(msg), 'no boundary on the plain path');
    assert.match(msg, /plain body text/);
});

test('{ html } builds multipart/alternative carrying BOTH parts, headers intact', async () => {
    sent.length = 0;
    await email.sendEmail('to@fixture.invalid', 'Rich subject', 'text alternative', null,
        { html: '<p>Hello <b>rich</b> world</p>' });
    assert.equal(sent.length, 1);
    const msg = sent[0];
    assert.match(msg, /Content-Type: multipart\/alternative; boundary="[^"]+"/);
    const boundary = msg.match(/boundary="([^"]+)"/)[1];
    const parts = msg.split(`--${boundary}`);
    assert.ok(parts.length >= 3, `expected two body parts framed by the boundary, got ${parts.length - 1}`);
    assert.match(msg, /Content-Type: text\/plain; charset="UTF-8"[\s\S]*text alternative/);
    assert.match(msg, /Content-Type: text\/html; charset="UTF-8"[\s\S]*<p>Hello <b>rich<\/b> world<\/p>/);
    // The text part precedes the html part (alternative order: last part is preferred).
    assert.ok(msg.indexOf('text alternative') < msg.indexOf('<p>Hello'), 'text part first, html part last');
    assert.match(msg, /From: DeSciX <router@fixture\.invalid>/);
    assert.match(msg, /To: to@fixture\.invalid/);
    assert.match(msg, /Reply-To: reply@fixture\.invalid/);
    assert.match(msg, /Subject: Rich subject/);
    assert.match(msg, new RegExp(`--${boundary}--`), 'the closing boundary terminates the message');
});
