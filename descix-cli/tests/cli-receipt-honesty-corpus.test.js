/**
 * THE PROPERTY, carried into the CONSUMER: a receipt that is honest at the
 * boundary must not be re-fabricated one operation downstream. The console line
 * is the smaller half — sync state is READ BY LATER RUNS, so a fabricated integer
 * there outlives the run that wrote it and corrupts every delta computed from it.
 *
 * FIXTURE NOTE (part of the gate): `listRemoteFileIds` is exercised through a fake
 * store speaking the REAL `{status, message:{...}}` invoke envelope, and the
 * sync-state readers are exercised directly, because the inline `|| 0` they replaced
 * was unreachable from any test — which is why it survived to be found by hand.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  readPreviousChunkCount,
  liveTotalFromReconcile,
  renderCount
} from '../lib/commands/corpus.js';
import { listRemoteFileIds, UNREPORTED_COUNT } from '../lib/core/Syncer.js';

function storeReturning(payload) {
  return { invoke: async () => ({ status: 'OK', auth_status: 'CONNECTED', message: payload }) };
}

// ---------------------------------------------------------------------------
// 1. FLAG-4 — listRemoteFileIds, all three fields
// ---------------------------------------------------------------------------

test('enumerate file_ids: honest store values pass through unchanged', async () => {
  const r = await listRemoteFileIds(
    storeReturning({ file_ids: ['corpus:a', 'corpus:b'], unique_count: 2, total_chunks: 40 }), 'a', 'G');
  assert.deepEqual(r.file_ids, ['corpus:a', 'corpus:b']);
  assert.equal(r.unique_count, 2);
  assert.equal(r.total_chunks, 40);
});

test('enumerate file_ids: a store REPORTING an empty namespace is preserved as empty', async () => {
  // Legal answer: "I looked, there is nothing". Must survive, and 0 is a real count.
  const r = await listRemoteFileIds(
    storeReturning({ file_ids: [], unique_count: 0, total_chunks: 0 }), 'a', 'G');
  assert.deepEqual(r.file_ids, []);
  assert.equal(r.unique_count, 0);
  assert.equal(r.total_chunks, 0);
});

test('enumerate file_ids: unreportable COUNTS become UNKNOWN, never 0', async () => {
  const r = await listRemoteFileIds(storeReturning({ file_ids: ['corpus:a'] }), 'a', 'G');
  assert.deepEqual(r.file_ids, ['corpus:a']);
  assert.equal(r.unique_count, UNREPORTED_COUNT, 'a missing unique_count was fabricated as 0');
  assert.equal(r.total_chunks, UNREPORTED_COUNT, 'a missing total_chunks was fabricated as 0');
});

test('enumerate file_ids: an ABSENT file_ids array THROWS rather than meaning "nothing is stale"', async () => {
  // This list is the drift input: stale = remote - local. Fabricating [] makes the
  // stale purge a silent no-op, which is the defect this contract exists to close.
  await assert.rejects(
    () => listRemoteFileIds(storeReturning({ unique_count: 0 }), 'a', 'G'),
    err => {
      assert.match(err.message, /file_ids/);
      assert.match(err.message, /UNKNOWN/);
      return true;
    },
    'an unreported file_ids list was returned as an empty list'
  );
});

// ---------------------------------------------------------------------------
// 2. FLAG-5 — the sync-state READER. `previousState?.total_chunks || 0`
//    conflated three different facts into one value.
// ---------------------------------------------------------------------------

test('previous count: NO sync state at all reads 0 — a fact about us, not the store', () => {
  assert.equal(readPreviousChunkCount(null), 0);
  assert.equal(readPreviousChunkCount(undefined), 0);
});

test('previous count: a LEGITIMATE ZERO is preserved (guard, not demonstration)', () => {
  // NOTE: this passes on the old `|| 0` too, because `0 || 0` is 0 — the legitimate
  // zero survived by coincidence, not by design. It is asserted so that the fail-loud
  // change cannot break the KB-with-zero-chunks case on its way to fixing null.
  assert.equal(readPreviousChunkCount({ total_chunks: 0 }), 0);
});

test('previous count: an ordinary number is returned as-is', () => {
  assert.equal(readPreviousChunkCount({ total_chunks: 137 }), 137);
});

test('previous count: a NULL total reads as null — unknown, said so, never coerced to 0', () => {
  // The landing site for the null that honest counting writes. The file delta is computed
  // from blob SHAs, so an unknown previous total blocks nothing and demands no --rebuild
  // (a rebuild could not re-establish it either: measured 2026-09-16, live 6882, state null).
  assert.equal(readPreviousChunkCount({ total_chunks: null }), null);
  assert.notEqual(readPreviousChunkCount({ total_chunks: null }), 0, 'a null chunk total was coerced to 0');
});

test('previous count: an ABSENT total reads as null too (legacy state is not zero state)', () => {
  assert.equal(readPreviousChunkCount({ last_sync_commit: 'abc' }), null);
});

test('previous count: a non-numeric total reads as null rather than coercing', () => {
  for (const bad of [{ total_chunks: 'many' }, { total_chunks: NaN }, { total_chunks: {} }]) {
    assert.equal(readPreviousChunkCount(bad), null);
  }
});

// ---------------------------------------------------------------------------
// 3. FLAG-3 — what gets PERSISTED. The store's MEASURED live count (the reconcile's
//    reconcileAfter) is the ONE owner of total_chunks; null when it reported none.
//    Never previous + upserted − deleted: the server answers upserted_count null by
//    ruling, so that arithmetic was null on every sync, --rebuild included.
// ---------------------------------------------------------------------------

test('persisted total: the reconcile\'s live count is the total, including a legitimate zero', () => {
  assert.equal(liveTotalFromReconcile({ reconcileBefore: 100, reconcileAfter: 6882 }), 6882);
  assert.equal(liveTotalFromReconcile({ reconcileBefore: 5, reconcileAfter: 0 }), 0, 'an empty store is a real answer, not unknown');
});

test('persisted total: a reconcile that reports no live count persists null, not a wrong integer', () => {
  assert.equal(liveTotalFromReconcile({ reconcileBefore: 100 }), null);
  assert.equal(liveTotalFromReconcile({ reconcileAfter: 'many' }), null);
  assert.equal(liveTotalFromReconcile({ reconcileAfter: NaN }), null);
  assert.equal(liveTotalFromReconcile(null), null);
  assert.equal(liveTotalFromReconcile(undefined), null);
});

test('persisted total: the request-derived figure is never the total (negative control)', () => {
  // upserted/deleted counts do not enter the persisted total at all — the corruption the
  // old arithmetic produced (100 + (-1) - 5 = 94) has no path to the file any more.
  const rec = { reconcileBefore: 100, reconcileAfter: 100, upserted_count: null, requested_count: 20 };
  assert.equal(liveTotalFromReconcile(rec), 100);
  assert.notEqual(liveTotalFromReconcile(rec), 94);
  assert.notEqual(liveTotalFromReconcile(rec), 120);
});

test('persisted total: null round-trips into the reader as null, and a number as itself', () => {
  assert.equal(readPreviousChunkCount({ total_chunks: liveTotalFromReconcile({}) }), null);
  assert.equal(readPreviousChunkCount({ total_chunks: liveTotalFromReconcile({ reconcileAfter: 42 }) }), 42);
});

// ---------------------------------------------------------------------------
// 4. RENDER — consumed from the existing `>= 0 ?` idiom, not invented
// ---------------------------------------------------------------------------

test('render: a reported count renders as its number, including zero', () => {
  assert.equal(renderCount(42), '42');
  assert.equal(renderCount(0), '0');
});

test('render: an unreported count never renders as a number', () => {
  const out = renderCount(UNREPORTED_COUNT);
  assert.notEqual(out, '-1', 'the raw sentinel leaked to the user');
  assert.notEqual(out, '0', 'unknown was rendered as a fabricated zero');
  assert.match(out, /unreported/);
});

test('coverage boundary', () => {
  console.log([
    'COVERAGE BOUNDARY of cli-receipt-honesty-corpus.test.js:',
    '  COMPARES: what the corpus sync READS from sync state, PERSISTS to it, and',
    '            RENDERS, against what the store actually reported.',
    '  CATCHES:  a null/absent chunk total silently read as 0; an unknown count',
    '            fabricated into a persisted integer; a raw -1 sentinel shown to a',
    '            user; an unreported file_ids list read as "nothing is stale".',
    '  DOES NOT READ: runCorpusSync end-to-end -- no git walk, no manifest, no live',
    '            store. It tests the extracted readers/writers those paths call, so a',
    '            call site that stops calling them is NOT caught here (the Syncer',
    '            suite and the full npm test run are the outer nets).',
    '  RUN BY:   `npm test` in descix-cli (glob tests/*.test.js) -- automatic.'
  ].join('\n'));
});
