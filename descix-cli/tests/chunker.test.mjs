/**
 * Chunker unit tests (M1 — kb-chunker-hardening, 2026-04-20)
 *
 * Run: node tests/chunker.test.mjs
 *
 * These assertions cover the four ACs from the CEO envelope:
 *   (a) small file → 1 chunk
 *   (b) 588KB concordance-data.js → >= 10 chunks with all 34 exchanges preserved
 *   (c) deeply-nested single-object JSON still splits reasonably
 *   (d) JS file with multiple top-level functions chunks on function boundaries
 *
 * No test framework dependency — plain Node + assert.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkFile, categorizeFile } from '../lib/core/Chunker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS = [];
function test(name, fn) { TESTS.push({ name, fn }); }

// (a) small file → 1 chunk
test('small .json file under maxChunkSize produces exactly 1 chunk', () => {
  const content = JSON.stringify({ hello: 'world', count: 42 }, null, 2);
  assert.ok(content.length < 2000, 'sanity: test fixture must be small');
  const chunks = chunkFile({ file_name: 'tiny.json', content });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].metadata.type, 'full-json');
});

test('small .js file under maxCodeFileSize produces exactly 1 chunk', () => {
  const content = 'export function hi() { return 1; }\n';
  const chunks = chunkFile({ file_name: 'hi.js', content });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].metadata.type, 'full-file');
});

// (b) 588KB concordance-data.js → >= 10 chunks with all 34 exchanges preserved
test('588KB concordance-data.js produces >= 10 chunks with all 34 exchanges covered', () => {
  const concPath = path.resolve(__dirname, '../../../../EGPT/www/data/concordance-data.js');
  if (!fs.existsSync(concPath)) {
    console.log('  [SKIP] concordance-data.js not present on this machine');
    return;
  }
  const content = fs.readFileSync(concPath, 'utf-8');
  assert.ok(content.length > 500000, 'fixture must be > 500KB to exercise the hardened path');

  const chunks = chunkFile({ file_name: 'concordance-data.js', content });
  assert.ok(chunks.length >= 10,
    `expected >= 10 chunks, got ${chunks.length}`);

  // All 34 exchange numbers must appear somewhere in the chunk corpus
  const joined = chunks.map(c => c.content).join('\n');
  for (let i = 1; i <= 34; i++) {
    assert.ok(joined.includes(`"exchangeNum": ${i}`),
      `chunked output is missing exchangeNum ${i}`);
  }
});

// (c) deeply-nested single-object JSON still splits reasonably
test('deeply-nested single-object JSON recurses into top-level keys', () => {
  const deep = {
    metadata: { generated: '2026-04-20', v: 1 },
    bigSection: {
      alpha: 'x'.repeat(3000),  // each bigger than default maxChunkSize (2000)
      beta: 'y'.repeat(3000),
      gamma: 'z'.repeat(3000)
    },
    smallSection: { ok: true }
  };
  const content = JSON.stringify(deep, null, 2);
  assert.ok(content.length > 2000);

  const chunks = chunkFile({ file_name: 'deep.json', content });
  assert.ok(chunks.length >= 3,
    `expected >= 3 chunks from deeply-nested object, got ${chunks.length}`);

  // All content must be preserved
  const joined = chunks.map(c => c.content).join('\n');
  assert.ok(joined.includes('alpha'));
  assert.ok(joined.includes('beta'));
  assert.ok(joined.includes('gamma'));
});

// (d) JS file with multiple top-level functions chunks on function boundaries
test('JS file with multiple top-level functions chunks on function boundaries', () => {
  const content = [
    '// header comment',
    '',
    'export function alpha(x) {',
    '  // alpha body',
    '  ' + '  return 1;\n'.repeat(500), // ~3.6KB of body
    '}',
    '',
    'export function beta(y) {',
    '  // beta body',
    '  ' + '  return 2;\n'.repeat(500),
    '}',
    '',
    'export function gamma(z) {',
    '  // gamma body',
    '  ' + '  return 3;\n'.repeat(500),
    '}',
    ''
  ].join('\n');

  assert.ok(content.length > 8000,
    'sanity: fixture must exceed maxCodeFileSize to trigger splitting');

  const chunks = chunkFile({ file_name: 'multi.js', content });
  assert.ok(chunks.length >= 3,
    `expected >= 3 chunks on function boundaries, got ${chunks.length}`);

  // Each boundary chunk should carry one of the function names in metadata
  const names = chunks.map(c => c.metadata.name).filter(Boolean);
  assert.ok(names.includes('alpha'), `missing alpha: ${names.join(',')}`);
  assert.ok(names.includes('beta'), `missing beta: ${names.join(',')}`);
  assert.ok(names.includes('gamma'), `missing gamma: ${names.join(',')}`);
});

// (regression) Fallback — unparseable JSON must still produce chunks, never 0
test('unparseable JSON falls back to generic chunking (never 0 chunks)', () => {
  const bogus = 'not json at all — but has enough content to exceed the max chunk size ' + 'x'.repeat(5000);
  const chunks = chunkFile({ file_name: 'broken.json', content: bogus });
  assert.ok(chunks.length >= 1);
});

// (regression) JS with no top-level boundaries must still produce chunks, never 0
test('JS with no top-level boundaries falls back to generic chunking', () => {
  // A huge expression with no functions / classes / exports / consts at col 0
  const lines = [];
  lines.push('// data blob with no top-level declarations');
  for (let i = 0; i < 2000; i++) lines.push('  some.deeply.nested.expression(' + i + ');');
  const content = lines.join('\n');
  const chunks = chunkFile({ file_name: 'blob.js', content });
  assert.ok(chunks.length >= 1,
    `expected >= 1 chunk even with no boundaries, got ${chunks.length}`);
});

// (regression) categorizeFile routes .json through structured-json
test('categorizeFile recognises .json as structured-json', () => {
  assert.equal(categorizeFile('foo.json'), 'structured-json');
  assert.equal(categorizeFile('foo.js'), 'code');
  assert.equal(categorizeFile('foo.md'), 'docs');
  assert.equal(categorizeFile('foo.jsonl'), 'training');
});

// ---- Runner ----
let passed = 0;
let failed = 0;
for (const t of TESTS) {
  try {
    t.fn();
    console.log(`  ✓ ${t.name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${t.name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}
console.log(`\n${passed}/${TESTS.length} passed${failed ? `, ${failed} failed` : ''}`);
process.exit(failed ? 1 : 0);
