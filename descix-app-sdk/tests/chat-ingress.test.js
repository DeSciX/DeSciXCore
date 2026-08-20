/**
 * WS-B8 — chat ingress contract + size policy.
 *
 * These are the invariants the CodeSite action-result return path depends on:
 * the size policy actually caps, truncation is VISIBLE, unserializable results
 * fail loud instead of becoming "{}", and a malformed contribution is rejected at
 * the call site rather than silently dropped.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_CONTRIBUTION_CHARS,
  applySizePolicy,
  stringifyResult,
  normalizeContribution,
  actionResultContribution,
  actionErrorContribution,
  composeTurnInput,
} from '../src/util/chatIngress.js';

test('size policy passes through text under the cap unchanged', () => {
  const r = applySizePolicy('hello');
  assert.equal(r.text, 'hello');
  assert.equal(r.truncated, false);
  assert.equal(r.omittedChars, 0);
});

test('size policy caps oversized text and marks the truncation VISIBLY', () => {
  const huge = 'x'.repeat(MAX_CONTRIBUTION_CHARS + 5000);
  const r = applySizePolicy(huge);
  assert.equal(r.truncated, true);
  assert.equal(r.totalChars, MAX_CONTRIBUTION_CHARS + 5000);
  assert.equal(r.omittedChars, 5000);
  // The prefix is exactly the cap; the marker is appended beyond it.
  assert.ok(r.text.startsWith('x'.repeat(MAX_CONTRIBUTION_CHARS)));
  assert.match(r.text, /TRUNCATED by DeSciX chat ingress/);
  assert.match(r.text, /5000 omitted/);
  // Model must be told this is a prefix, not the whole result.
  assert.match(r.text, /PREFIX of the result/);
});

test('an oversized action result cannot blow the turn', () => {
  const giant = { data: Array.from({ length: 50000 }, (_, i) => i) };
  const c = actionResultContribution('runCounterfactual', giant);
  assert.equal(c.truncated, true);
  // Bounded: cap + fence/framing overhead, nowhere near the raw ~500KB.
  assert.ok(c.text.length < MAX_CONTRIBUTION_CHARS + 1000,
    `contribution text was ${c.text.length} chars — size policy did not hold`);
});

test('stringifyResult renders primitives without JSON noise', () => {
  assert.equal(stringifyResult('plain'), 'plain');
  assert.equal(stringifyResult(42), '42');
  assert.equal(stringifyResult(true), 'true');
  assert.equal(stringifyResult(undefined), '(the action returned no value)');
  assert.equal(stringifyResult(null), 'null');
});

test('a circular result FAILS LOUD rather than becoming an empty object', () => {
  const circular = { name: 'loop' };
  circular.self = circular;
  assert.throws(() => stringifyResult(circular));
  // ...and the contribution builder converts that into a VISIBLE error, not silence.
  const c = actionResultContribution('breakIt', circular);
  assert.equal(c.kind, 'action_error');
  assert.match(c.text, /could not be read/);
});

test('a function return value is reported as not-a-result', () => {
  assert.throws(() => stringifyResult(function doThing() {}), /not a result/);
});

test('action result is framed as a CodeSite observation, not user prose', () => {
  const c = actionResultContribution('simulate', { yield: 0.42 });
  assert.equal(c.kind, 'action_result');
  assert.equal(c.label, 'simulate');
  assert.match(c.text, /CodeSite action result/);
  assert.match(c.text, /simulate/);
  assert.match(c.text, /0\.42/);
});

test('action results default to the send disposition (the live loop)', () => {
  assert.equal(actionResultContribution('f', 1).disposition, 'send');
  assert.equal(actionResultContribution('f', 1, { disposition: 'stage' }).disposition, 'stage');
});

test('a thrown action becomes a visible action_error contribution', () => {
  const c = actionErrorContribution('boom', new Error('detonated'));
  assert.equal(c.kind, 'action_error');
  assert.match(c.text, /FAILED/);
  assert.match(c.text, /detonated/);
});

test('normalizeContribution rejects malformed bags loudly', () => {
  assert.throws(() => normalizeContribution(null), /must be an object/);
  assert.throws(() => normalizeContribution({ kind: 'nope', text: 'x' }), /unknown contribution kind/);
  assert.throws(() => normalizeContribution({ kind: 'action_result', text: '' }), /empty text/);
  assert.throws(
    () => normalizeContribution({ kind: 'action_result', text: 'x', disposition: 'teleport' }),
    /unknown disposition/
  );
});

test('normalizeContribution returns a FULL bag from a partial one', () => {
  const c = normalizeContribution({ kind: 'action_result', text: 'hi' });
  // Consumers ferry this bag; drift here is the schema-mirror bug class.
  assert.deepEqual(Object.keys(c).sort(), [
    'contributed_at', 'disposition', 'kind', 'label', 'omittedChars', 'text', 'totalChars', 'truncated',
  ]);
  assert.equal(c.disposition, 'stage', 'default disposition must be the non-metered one');
});

test('composeTurnInput puts the observation before the instruction', () => {
  const c = normalizeContribution({ kind: 'action_result', text: 'RESULT' });
  assert.equal(composeTurnInput([c], 'what does this mean?'), 'RESULT\n\nwhat does this mean?');
  // A self-sending contribution has no typed text and must not leave dangling blanks.
  assert.equal(composeTurnInput([c], ''), 'RESULT');
  assert.equal(composeTurnInput([], 'just typing'), 'just typing');
});
