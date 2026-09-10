/**
 * THE PROPERTY: the CLI never presents a number it did not receive from the store.
 * Where the store reports unknown, the CLI says unknown and NEVER substitutes a
 * request-derived count (batch.length / chunkIds.length / validFileIds.length).
 *
 * FIXTURE NOTE (this is part of the gate): the fake store responds in the SAME
 * envelope shape the real transport produces -- lib/api-client.js::DeSciXApiClient.invoke
 * returns the whole `{status, auth_status, message:{...}}` body, NOT the unwrapped
 * payload. A fixture that responds with a top-level `upserted_count` cannot exhibit
 * the upsert-site unwrap defect, so it would not measure the failure however green it
 * ran. Both shapes are exercised below.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  upsertChunks,
  deleteStaleChunks,
  deleteStaleChunksByFileId,
  purgeKbScope,
  UNREPORTED_COUNT,
  isReportedCount
} from '../lib/core/Syncer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYNCER_PATH = path.join(__dirname, '..', 'lib', 'core', 'Syncer.js');

/** A fake store speaking the REAL invoke envelope: payload nested under `message`. */
function storeReturning(payload) {
  return { invoke: async () => ({ status: 'OK', auth_status: 'CONNECTED', message: payload }) };
}
/** A fake store speaking an UNWRAPPED payload (the shape the delete sites also tolerate). */
function bareStoreReturning(payload) {
  return { invoke: async () => ({ ...payload }) };
}
const chunks = n => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, text: 't' }));

// ---------------------------------------------------------------------------
// 1. THE STORE'S NUMBER WINS OVER THE REQUEST'S NUMBER
// ---------------------------------------------------------------------------

test('upsert: an honest store count is reported, not the batch size', async () => {
  // 10 chunks requested, store says it upserted 7. The CLI must say 7.
  const r = await upsertChunks(storeReturning({ upserted_count: 7 }), 'c', 'a', 'k', chunks(10));
  assert.equal(r.upserted, 7, 'the request-derived batch.length (10) was substituted for the store count (7)');
});

test('upsert: an honest store count is reported through the bare envelope too', async () => {
  const r = await upsertChunks(bareStoreReturning({ upserted_count: 7 }), 'c', 'a', 'k', chunks(10));
  assert.equal(r.upserted, 7);
});

// ---------------------------------------------------------------------------
// 2. A ZERO IS NOT A FALSY  (a live bug: `|| batch.length` eats a legitimate 0)
// ---------------------------------------------------------------------------

test('upsert: a legitimate ZERO from the store is reported as 0, not as the batch size', async () => {
  const r = await upsertChunks(storeReturning({ upserted_count: 0 }), 'c', 'a', 'k', chunks(10));
  assert.equal(r.upserted, 0, 'a legitimate 0 was treated as falsy and replaced by batch.length');
});

test('upsert: zero across several batches stays zero (batching does not re-introduce the substitution)', async () => {
  // 200 chunks => batches of 90/90/20. Every batch honestly upserted nothing.
  const r = await upsertChunks(storeReturning({ upserted_count: 0 }), 'c', 'a', 'k', chunks(200));
  assert.equal(r.upserted, 0);
});

test('delete-by-ids: a legitimate ZERO is reported as 0', async () => {
  const r = await deleteStaleChunks(storeReturning({ deleted_count: 0 }), 'c', 'a', 'k', ['x', 'y', 'z']);
  assert.equal(r.deleted, 0);
});

test('delete-by-file-id: a legitimate ZERO is reported as 0 on both fields', async () => {
  const r = await deleteStaleChunksByFileId(
    storeReturning({ deleted_count: 0, deleted_by_file_id: 0 }), 'c', 'a', 'k', ['f1', 'f2']);
  assert.equal(r.deleted, 0);
  assert.equal(r.deleted_by_file_id, 0);
});

// ---------------------------------------------------------------------------
// 3. WHERE THE STORE CANNOT REPORT, THE CLI SAYS UNKNOWN
// ---------------------------------------------------------------------------

test('upsert: an unreportable store count yields UNKNOWN, never the batch size', async () => {
  for (const payload of [{ upserted_count: null }, { upserted_count: undefined }, {}]) {
    const r = await upsertChunks(storeReturning(payload), 'c', 'a', 'k', chunks(10));
    assert.equal(r.upserted, UNREPORTED_COUNT,
      `substituted a fabricated number for an unreportable count (${JSON.stringify(payload)})`);
    assert.equal(isReportedCount(r.upserted), false);
  }
});

test('delete-by-ids: an unreportable store count yields UNKNOWN, never chunkIds.length', async () => {
  for (const payload of [{ deleted_count: null }, {}]) {
    const r = await deleteStaleChunks(storeReturning(payload), 'c', 'a', 'k', ['x', 'y', 'z']);
    assert.equal(r.deleted, UNREPORTED_COUNT);
  }
});

test('delete-by-file-id: an unreportable store count yields UNKNOWN on BOTH fields', async () => {
  const r = await deleteStaleChunksByFileId(
    storeReturning({ deleted_count: null, deleted_by_file_id: null }), 'c', 'a', 'k', ['f1', 'f2']);
  assert.equal(r.deleted, UNREPORTED_COUNT, 'deleted was fabricated from validFileIds.length');
  assert.equal(r.deleted_by_file_id, UNREPORTED_COUNT, 'deleted_by_file_id was fabricated from validFileIds.length');
});

test('delete-by-file-id: the two fields are independent (one reported, one not)', async () => {
  const r = await deleteStaleChunksByFileId(
    storeReturning({ deleted_count: 5, deleted_by_file_id: null }), 'c', 'a', 'k', ['f1', 'f2']);
  assert.equal(r.deleted, 5);
  assert.equal(r.deleted_by_file_id, UNREPORTED_COUNT);
});

test('purge-scope: the in-repo precedent still reports UNKNOWN (anti-regression on the owner)', async () => {
  const r = await purgeKbScope(storeReturning({ deleted_count: null, purged_scope: true }), 'c', 'a', 'k');
  assert.equal(r.deleted, UNREPORTED_COUNT);
  assert.equal(r.purged_scope, true);
});

// ---------------------------------------------------------------------------
// 4. THE BEHAVIOUR-PRESERVATION MEASUREMENT (contract property (c))
// ---------------------------------------------------------------------------

test('(c) for reportable numeric values every DELETE site is unchanged by this contract', async () => {
  assert.equal((await deleteStaleChunks(storeReturning({ deleted_count: 2 }), 'c', 'a', 'k', ['x', 'y', 'z'])).deleted, 2);
  const r = await deleteStaleChunksByFileId(
    storeReturning({ deleted_count: 2, deleted_by_file_id: 1 }), 'c', 'a', 'k', ['f1', 'f2']);
  assert.equal(r.deleted, 2);
  assert.equal(r.deleted_by_file_id, 1);
  assert.equal((await purgeKbScope(storeReturning({ deleted_count: 9 }), 'c', 'a', 'k')).deleted, 9);
});

test('(c) is FALSE at the upsert site: the old code could not read a reportable value at all', async () => {
  // An executable statement of the correction made to DEVPLANE's property (c).
  // The old code read `result.upserted_count` WITHOUT unwrapping `.message`, so on the
  // real envelope it was always undefined and always fell back to batch.length. The fix
  // therefore CHANGES the reported number for a perfectly honest store.
  const r = await upsertChunks(storeReturning({ upserted_count: 7 }), 'c', 'a', 'k', chunks(10));
  assert.equal(r.upserted, 7);
  assert.notEqual(r.upserted, 10, 'batch.length is what the pre-fix code reported here');
});

// ---------------------------------------------------------------------------
// 5. ONE OWNER: no second expression of "unknown count" in this module
// ---------------------------------------------------------------------------

test('no site re-derives a count from the request, and UNKNOWN has exactly one definition', () => {
  const src = fs.readFileSync(SYNCER_PATH, 'utf8');

  const requestDerivedFallbacks = [
    /\|\|\s*batch\.length/,
    /\?\?\s*chunkIds\.length/,
    /\?\?\s*validFileIds\.length/,
    /\|\|\s*chunks\.length/
  ];
  for (const re of requestDerivedFallbacks) {
    assert.equal(re.test(src), false, `Syncer.js still substitutes a request-derived count: ${re}`);
  }

  // The unknown sentinel is DEFINED once and never re-spelled as an inline ternary.
  const inlineSentinel = /typeof\s+data\??\.?\w*\s*===\s*'number'\s*\?/g;
  assert.equal((src.match(inlineSentinel) || []).length, 0,
    'an inline typeof-number ternary re-derives the unknown-count idiom; consume the owner instead');

  const definitions = src.match(/^export const UNREPORTED_COUNT\s*=/gm) || [];
  assert.equal(definitions.length, 1, 'UNREPORTED_COUNT must have exactly one definition');
});

test('the owner helper discriminates', () => {
  assert.equal(isReportedCount(0), true);
  assert.equal(isReportedCount(7), true);
  assert.equal(isReportedCount(UNREPORTED_COUNT), false);
  assert.equal(isReportedCount(null), false);
  assert.equal(isReportedCount(undefined), false);
  assert.equal(isReportedCount(NaN), false);
  assert.equal(isReportedCount('3'), false, 'a string is not a count the store reported');
});

// ---------------------------------------------------------------------------
// 6. COVERAGE BOUNDARY (printed on GREEN as well as RED)
// ---------------------------------------------------------------------------

test('coverage boundary', () => {
  console.log([
    'COVERAGE BOUNDARY of cli-receipt-honesty-syncer.test.js:',
    '  COMPARES: the value Syncer.js returns against the value a fake store reported,',
    '            over the real {status,message:{...}} invoke envelope and the bare shape.',
    '  CATCHES:  any request-derived substitution (batch.length / chunkIds.length /',
    '            validFileIds.length), a legitimate 0 eaten as falsy, an unreportable',
    '            count rendered as a number, and a second in-module definition of UNKNOWN.',
    '  DOES NOT READ: lib/commands/corpus.js -- how UNKNOWN is RENDERED to the user and',
    '            how it flows into `total_chunks: previousChunkCount + upserted - deleted`',
    '            persisted to sync state is OUT OF SCOPE here (doer FLAG-3 to DEVPLANE).',
    '            It also does not exercise the real HTTP transport or a live store.',
    '  RUN BY:   `npm test` in descix-cli (glob tests/*.test.js) -- automatic.'
  ].join('\n'));
});
