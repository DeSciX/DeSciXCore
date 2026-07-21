/**
 * WS-KB-OBSERVABILITY-LIES — `descix kb list` render helpers.
 *
 * Guards the display contract for the count-truth surface: an honest 'unknown'
 * (server could not enumerate live Pinecone) renders '?', NEVER a fabricated 0.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { kbVectorCell, kbCountSource } from '../lib/commands/kb-list-render.js';

test('kbVectorCell renders a live count as its number', () => {
  assert.equal(kbVectorCell({ rag_vector_count: 842, count_source: 'live' }), '842');
});

test('kbVectorCell renders a truthful live 0 as "0" (not "?")', () => {
  assert.equal(kbVectorCell({ rag_vector_count: 0, count_source: 'live' }), '0');
});

test('kbVectorCell renders an unknown source as "?" — never a fabricated 0', () => {
  assert.equal(kbVectorCell({ rag_vector_count: null, count_source: 'unknown' }), '?');
});

test('kbVectorCell renders a null count as "?" even if source tag is missing (older backend)', () => {
  assert.equal(kbVectorCell({ rag_vector_count: null }), '?');
  assert.equal(kbVectorCell(null), '?');
});

test('kbVectorCell renders a cached count as its number', () => {
  assert.equal(kbVectorCell({ rag_vector_count: 71, count_source: 'cached' }), '71');
});

test('kbCountSource ferries the server tag when present', () => {
  assert.equal(kbCountSource({ count_source: 'live' }, true), 'live');
  assert.equal(kbCountSource({ count_source: 'unknown' }, true), 'unknown');
  assert.equal(kbCountSource({ count_source: 'cached' }, false), 'cached');
});

test('kbCountSource falls back to the requested mode when the row is untagged', () => {
  assert.equal(kbCountSource({}, true), 'live');
  assert.equal(kbCountSource({}, false), 'cached');
  assert.equal(kbCountSource(null, true), 'live');
});
