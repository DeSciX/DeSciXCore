/**
 * accountLifecycleOf: THE live / closing / gone predicate over a USERS doc snapshot (models/index.js), the one owner
 * Cloud's DPoW accounting (and any store that must not credit a closing account) consults.
 *
 * Run from descix-platform-api/: node --test tests/account-lifecycle.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const P = await import('../src/index.js');

test('gone: no USERS doc (null or undefined)', () => {
    assert.equal(P.accountLifecycleOf(null), 'gone');
    assert.equal(P.accountLifecycleOf(undefined), 'gone');
});

test('live: a USERS doc with no delete stamp (absent or null)', () => {
    assert.equal(P.accountLifecycleOf({}), 'live');
    assert.equal(P.accountLifecycleOf({ id: 'u', email: 'u@example.invalid' }), 'live');
    assert.equal(P.accountLifecycleOf({ id: 'u', admin_delete: null }), 'live');
});

test('closing: a well-formed stamp only (an object with a string planHash)', () => {
    assert.equal(P.accountLifecycleOf({ admin_delete: { planHash: 'a'.repeat(64), startedAt: '2026-11-18T00:00:00.000Z' } }), 'closing');
    assert.equal(P.accountLifecycleOf({ admin_delete: { planHash: 'a'.repeat(64) } }), 'closing');
});

test('a MALFORMED stamp (true, {}, "x", false, 0, an array, a non-string planHash) is a loud ACCOUNT_STAMP_MALFORMED, never closing and never live', () => {
    for (const bad of [true, {}, 'x', false, 0, [], { planHash: 7 }]) {
        assert.throws(() => P.accountLifecycleOf({ admin_delete: bad }), (e) => e.code === P.AccountAdminRefusal.ACCOUNT_STAMP_MALFORMED, JSON.stringify(bad));
    }
});

test('ONE parser: the operator\'s account view refuses the same malformed stamps the predicate does', async () => {
    const src = (await import('node:fs')).readFileSync(new URL('../src/models/index.js', import.meta.url), 'utf8');
    const body = src.slice(src.indexOf('export function accountLifecycleOf'), src.indexOf('export function accountLifecycleOf') + 900);
    assert.match(body, /return adminDeleteOf\(userDoc\) \? ACCOUNT_LIFECYCLE\.CLOSING : ACCOUNT_LIFECYCLE\.LIVE;/);
    assert.equal((src.match(/\?\.\[ADMIN_DELETE_FIELD\]/g) || []).length, 1, 'the stamp field is read in adminDeleteOf only');
});

test('a value that is not a document throws (never guessed)', () => {
    for (const bad of ['x', 7, [], true]) assert.throws(() => P.accountLifecycleOf(bad), TypeError, JSON.stringify(bad));
});

test('the enum is frozen and names exactly the three states', () => {
    assert.deepEqual({ ...P.ACCOUNT_LIFECYCLE }, { LIVE: 'live', CLOSING: 'closing', GONE: 'gone' });
    assert.ok(Object.isFrozen(P.ACCOUNT_LIFECYCLE));
});

test('a stamp as stampDelete writes it reads closing, and reads live again once cleared', () => {
    const stamped = { id: 'u', admin_delete: { planHash: 'b'.repeat(64), startedAt: '2026-11-18T00:00:00.000Z' } };
    assert.equal(P.accountLifecycleOf(stamped), 'closing');
    const { admin_delete: _cleared, ...rest } = stamped;
    assert.equal(P.accountLifecycleOf(rest), 'live');
});

test('the contract carries ACCOUNT_MERGE_EXCEEDS_STORE_LIMIT, usable as a merge blocker', async () => {
    const AA = await import('../src/account-admin/index.js');
    assert.equal(AA.AccountAdminRefusal.ACCOUNT_MERGE_EXCEEDS_STORE_LIMIT, 'ACCOUNT_MERGE_EXCEEDS_STORE_LIMIT');
    const b = AA.accountAdminBlocker(AA.AccountAdminRefusal.ACCOUNT_MERGE_EXCEEDS_STORE_LIMIT, 'one doc too large');
    assert.equal(AA.footprintViolation({ entries: [], leftovers: [], blockers: [b] }, { merge: true }), null);
});
