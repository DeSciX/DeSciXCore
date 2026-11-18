/**
 * THE operator email rule and the operator target check (src/operator): the one owner the Powch passkey
 * re-key and the account admin share. Pure functions; nothing is read or written.
 *
 * Run (from descix-platform-api/): node --test tests/operator-guards.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    OPERATOR_ENVS,
    OperatorGuardRefusal,
    normalizeOperatorEmailRule,
    operatorEmailAllowed,
    operatorEmailRuleForAddress,
    operatorEmailRulePrefixes,
    assertOperatorTarget,
} from '../src/index.js';

/** The operator rule (a local operator app's fixture): operator or operator+<tag> at three domains. */
const CEO_RULE = { localPart: 'operator', plusAddressing: true, domains: ['example.org', 'example.net', 'example.com'] };
const refusedWith = (code) => (e) => e.code === code;

test('rule: required and validated, fail closed', () => {
    for (const bad of [undefined, null, [], 'operator', {}, { localPart: 'operator', domains: ['example.org'] }, { localPart: 'operator', plusAddressing: true, domains: [] },
        { localPart: 'operator', plusAddressing: true, domains: ['EXAMPLE.ORG'] }, { localPart: 'Operator', plusAddressing: true, domains: ['example.org'] },
        { localPart: 'operator+x', plusAddressing: true, domains: ['example.org'] }, { localPart: '', plusAddressing: false, domains: ['example.org'] },
        { localPart: 'operator', plusAddressing: true, domains: ['example'] }, { ...CEO_RULE, extra: 1 }, { localPart: 'operator', plusAddressing: 'yes', domains: ['example.org'] }]) {
        assert.throws(() => normalizeOperatorEmailRule(bad), refusedWith(OperatorGuardRefusal.RULE_INVALID), JSON.stringify(bad));
    }
    const rule = normalizeOperatorEmailRule({ ...CEO_RULE, domains: ['example.org', 'example.org'] });
    assert.deepEqual([...rule.domains], ['example.org'], 'domains are de-duplicated');
    assert.ok(Object.isFrozen(rule) && Object.isFrozen(rule.domains));
});

test('rule: names operator and operator+<tag> at exactly its three domains, case-insensitively; negatives refused', () => {
    const rule = normalizeOperatorEmailRule(CEO_RULE);
    for (const yes of ['operator@example.org', 'operator@example.net', 'operator@example.com', 'operator+x@example.org', 'operator+a.b-c@example.com', 'operator+x@EXAMPLE.ORG', 'OPERATOR@ExAmPle.org', ' operator@example.org ', 'operator+a+b@example.org']) {
        assert.equal(operatorEmailAllowed(rule, yes), true, yes);
    }
    for (const no of ['operators@example.org', 'operator+x@evil.example.org.invalid', 'operator@sub.example.org', 'operator@example.org.invalid', 'operator+@example.org', 'xoperator@example.org',
        'operator.x@example.org', 'operator@other.invalid', 'operator@example.org@evil.example', 'operator', '', null, undefined,
        'operator+ x@example.org', 'operator+x y@example.org', 'operator+\u0000@example.org', 'operator+x\u0000@example.org', 'operator+\tx@example.org', 'operator+x\u007f@example.org']) {
        assert.equal(operatorEmailAllowed(rule, no), false, String(no));
    }
});

test('rule: plusAddressing false names only the exact address; a one-address rule from --email', () => {
    const exact = operatorEmailRuleForAddress(' Operator+X@ExAmPle.org ');
    assert.deepEqual({ ...exact, domains: [...exact.domains] }, { localPart: 'operator+x', plusAddressing: false, domains: ['example.org'] });
    assert.equal(operatorEmailAllowed(exact, 'operator+x@example.org'), true);
    assert.equal(operatorEmailAllowed(exact, 'operator@example.org'), false, 'an exact address names no other');
    assert.equal(operatorEmailAllowed(exact, 'operator+x+y@example.org'), false);
    assert.throws(() => operatorEmailRuleForAddress('not-an-address'), refusedWith(OperatorGuardRefusal.RULE_INVALID));
    const noPlus = normalizeOperatorEmailRule({ localPart: 'operator', plusAddressing: false, domains: ['example.org'] });
    assert.equal(operatorEmailAllowed(noPlus, 'operator+x@example.org'), false, 'plusAddressing false refuses a tag');
});

test('rule: matching needs a normalized rule (a hand-built object is refused, never matched)', () => {
    assert.throws(() => operatorEmailAllowed({ localPart: 'operator', plusAddressing: true, domains: ['example.org'] }, 'operator@example.org'), refusedWith(OperatorGuardRefusal.RULE_INVALID));
    assert.throws(() => operatorEmailRulePrefixes({ localPart: 'operator' }), refusedWith(OperatorGuardRefusal.RULE_INVALID));
});

test('rule prefixes: operator@ and, with plusAddressing, operator+', () => {
    assert.deepEqual(operatorEmailRulePrefixes(normalizeOperatorEmailRule(CEO_RULE)), ['operator@', 'operator+']);
    assert.deepEqual(operatorEmailRulePrefixes(operatorEmailRuleForAddress('operator+x@example.org')), ['operator+x@']);
});

test('target: env must be dev|demo|prod; the client\'s database must be the env\'s; nothing unnamed', () => {
    const target = { projectId: 'descix', databaseId: 'descix-dev', secretName: 'descix_config_dev' };
    assert.deepEqual([...OPERATOR_ENVS], ['dev', 'demo', 'prod']);
    assert.doesNotThrow(() => assertOperatorTarget({ env: 'dev', target, expectedDatabaseId: 'descix-dev' }));
    assert.throws(() => assertOperatorTarget({ env: 'staging', target, expectedDatabaseId: 'descix-dev' }), refusedWith(OperatorGuardRefusal.ENV_INVALID));
    assert.throws(() => assertOperatorTarget({ target, expectedDatabaseId: 'descix-dev' }), refusedWith(OperatorGuardRefusal.ENV_INVALID));
    assert.throws(() => assertOperatorTarget({ env: 'prod', target, expectedDatabaseId: 'descix-prod' }), refusedWith(OperatorGuardRefusal.TARGET_INVALID));
    assert.throws(() => assertOperatorTarget({ env: 'dev', target: { ...target, secretName: '' }, expectedDatabaseId: 'descix-dev' }), refusedWith(OperatorGuardRefusal.TARGET_INVALID));
    assert.throws(() => assertOperatorTarget({ env: 'dev', target, expectedDatabaseId: undefined }), refusedWith(OperatorGuardRefusal.TARGET_INVALID));
});

test('rule: the invalid-rule refusal shows a neutral example shape (no real address or company domain)', () => {
    assert.throws(() => normalizeOperatorEmailRule({}), (e) => {
        assert.equal(e.code, OperatorGuardRefusal.RULE_INVALID);
        assert.ok(e.message.includes("Shape: { localPart: 'operator', plusAddressing: true, domains: ['example.org'] }"), e.message);
        return true;
    });
});
