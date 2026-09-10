/**
 * END-TO-END OUTPUT HONESTY of `descix kb corpus sync`.
 *
 * WHY THIS IS AN OUTPUT TEST AND NOT A SITE TEST: the plumbing in Syncer.js was made honest
 * and separately verified, yet the surface the operator reads still printed
 * "Upserted: -1 chunks". A check on the plumbing cannot see a lie told at the render, and a
 * site-level grep passes while the surface still lies. So this drives the REAL `runCorpusSync`
 * against a fake store and asserts on THE BYTES THE USER SEES.
 *
 * THE PROPERTY, derived over every count the run prints rather than over a list of line
 * numbers: when the store reports nothing, NO printed count anywhere in the run carries a
 * fabricated value — not -1, and not 0. When the store reports real numbers, every printed
 * count shows them.
 *
 * Not an edge case: the paired Cloud change emits `upserted_count: null` unconditionally, so
 * "the store reported no count" is the shape of EVERY corpus sync once it lands.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

import { runCorpusSync } from '../lib/commands/corpus.js';

// Mirrors the constants runCorpusSync hardcodes; used only to price the slow case's skip.
const MAX_RETRIES = 5;
const BATCH_DELAY_MS = 5000;

/**
 * EVERY count this command can print, classified by WHERE THE NUMBER COMES FROM.
 *
 * This classification is itself a gate. A receipt line whose label is in neither list fails
 * the completeness check below, so a count added to this command later cannot slip in
 * unclassified — which is how the -1 reached the user in the first place.
 */
// Counts the STORE reports. These may be unknown, and when they are they must SAY so.
const STORE_DERIVED = ['Upserted', 'Purged', 'Chunks created', 'Chunks deleted'];
// Counts derived from local work or local state: what we walked, chunked, or previously
// recorded. Honest by construction — they describe our own side, not the store's.
const LOCALLY_DERIVED = ['Found', 'Chunked', 'Files synced', 'Files unchanged', 'Previous sync'];

/** Strip ANSI so an assertion reads the text, not the colouring. */
const plain = (s) => s.replace(/\[[0-9;]*m/g, '');

/**
 * A store whose kb_sync_chunks / kb_delete_chunks responses are supplied by the caller —
 * those are the ONE variable under test: does the store report a count, or not?
 */
class FakeStore {
  constructor({ sync, del }) { this.sync = sync; this.del = del; this.calls = []; }
  async invoke(command) {
    this.calls.push(command);
    if (command === 'list_knowledge_bases')
      return { status: 'ok', message: { knowledgebases: [{ knowledgebase_name: 'Corpus' }] } };
    if (command === 'get_product_context') return { status: 'ok', community_id: 'testcommunity' };
    if (command === 'kb_list_file_ids') return { status: 'ok', message: { file_ids: [] } };
    if (command === 'kb_sync_chunks')
      return typeof this.sync === 'function' ? this.sync(this.calls) : this.sync;
    if (command === 'kb_delete_chunks') return this.del;
    return { status: 'ok', message: {} };
  }
}

/**
 * A throwaway git workspace with one corpus manifest.
 *
 * PRE-SEEDED with a stale blob sha so the DELETE leg of the run actually executes — without
 * it the delete counts are never printed and this file would silently measure half the
 * surface while running green.
 */
async function makeWorkspace(paragraphs = 1) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-render-'));
  const appId = 'testapp-render-honesty';
  const appRoot = path.join(wsRoot, 'apps', appId);
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'sync-state'), { recursive: true });
  await fs.mkdir(path.join(appRoot, 'docs'), { recursive: true });

  let body = '# Corpus\n\n';
  for (let i = 0; i < paragraphs; i++) {
    body += `## Section ${i}\n\n` +
      `Paragraph ${i} exists only to give the chunker something to chunk. `.repeat(6) + '\n\n';
  }
  await fs.writeFile(path.join(appRoot, 'docs', 'intro.md'), body);
  await fs.writeFile(path.join(appRoot, '.descix', 'manifests', 'Corpus.json'), JSON.stringify({
    kb_name: 'Corpus', sync_mode: 'local',
    sources: [{ path: `apps/${appId}/docs`, tier: 1, doc_type: 'documentation' }]
  }, null, 2));
  // A previous run whose blob sha is gone => one stale file_id => the delete leg runs.
  // total_chunks must be a real number: readPreviousChunkCount hard-fails on an unknown prior
  // total BY DESIGN, and that refusal is not what this file measures.
  await fs.writeFile(path.join(appRoot, '.descix', 'sync-state', 'Corpus.json'), JSON.stringify({
    last_sync_commit: 'deadbeef', synced_files_count: 1, total_chunks: 100,
    synced_blob_shas: ['ffffffffffffffffffffffffffffffffffffffff']
  }, null, 2));
  await fs.writeFile(path.join(wsRoot, '.descix', 'workspace.json'), JSON.stringify({
    version: '2.1', workspaceRoot: wsRoot, type: 'workspace',
    env: { products: [{ appId, localPath: `apps/${appId}`, kbId: 'Corpus' }] }
  }, null, 2));
  execSync('git init -q -b main', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git config user.email t@t', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git config user.name t', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git add -A', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git commit -q -m seed', { cwd: wsRoot, stdio: 'pipe' });
  return { wsRoot, appId, appRoot };
}

/**
 * Run the REAL sync and return every byte it wrote to stdout AND stderr — the spinner lines
 * the operator reads go to stderr, so capturing only stdout would miss "Upserted:" entirely.
 */
async function runSyncCapturing(responses, { paragraphs = 1 } = {}) {
  const { appId, wsRoot, appRoot } = await makeWorkspace(paragraphs);
  const cwd = process.cwd();
  const outWrite = process.stdout.write.bind(process.stdout);
  const errWrite = process.stderr.write.bind(process.stderr);
  let captured = '';
  const sink = (chunk, enc, cb) => {
    captured += typeof chunk === 'string' ? chunk : chunk.toString();
    if (typeof enc === 'function') enc(); else if (typeof cb === 'function') cb();
    return true;
  };
  process.chdir(wsRoot);
  process.stdout.write = sink;
  process.stderr.write = sink;
  try {
    await runCorpusSync(new FakeStore(responses), { app: appId, yes: true, verbose: false });
  } finally {
    process.stdout.write = outWrite;
    process.stderr.write = errWrite;
    process.chdir(cwd);
  }
  return { output: plain(captured), appRoot };
}

/**
 * Every "Label: value" line the run printed that states a quantity, as a Map.
 * Leading spinner glyphs and indentation are stripped; lines with no quantity are ignored.
 */
function receiptCounts(output) {
  const map = new Map();
  for (const raw of output.split('\n')) {
    const line = raw.replace(/^[\s✔✖✗⚠ℹ•\-]*/, '');
    const m = line.match(/^([A-Z][A-Za-z ]*?):\s+(\S.*?)\s*$/);
    if (!m) continue;
    const [, label, value] = m;
    if (!/\d/.test(value) && !/unreported/.test(value)) continue;
    if (!map.has(label)) map.set(label, value);
  }
  return map;
}

/** Fails if the run printed a count this file has not classified. */
function assertClassificationComplete(counts) {
  const unclassified = [...counts.keys()]
    .filter(l => !STORE_DERIVED.includes(l) && !LOCALLY_DERIVED.includes(l));
  assert.deepEqual(unclassified, [],
    `this command printed count(s) this test has not classified as store- or locally-derived: ` +
    `${JSON.stringify(unclassified)}. Classify them before shipping — an unclassified count is ` +
    `exactly how a fabricated number reaches the user.`);
}

const NOTHING_REPORTED = {
  sync: { status: 'ok', message: {} },
  del: { status: 'ok', message: {} },
};
const BOTH_REPORTED = {
  sync: { status: 'ok', message: { upserted_count: 3 } },
  del: { status: 'ok', message: { deleted_count: 7 } },
};

test('store reports NOTHING -> no printed count anywhere is a fabricated value', async () => {
  const { output } = await runSyncCapturing(NOTHING_REPORTED);
  const counts = receiptCounts(output);
  assertClassificationComplete(counts);

  // The run must actually have reached both legs, or the assertions below pass vacuously.
  for (const label of STORE_DERIVED) {
    assert.ok(counts.has(label),
      `the run never printed a "${label}" count — the fixture did not reach that leg`);
  }

  for (const label of STORE_DERIVED) {
    const value = counts.get(label);
    // The count occupies the HEAD of the value; a trailing local figure (e.g. "across 1 stale
    // blob SHA(s)") is locally derived and legitimately numeric.
    assert.doesNotMatch(value, /^-?\d/,
      `"${label}:" stated a count the store never reported: ${value}`);
    assert.match(value, /^an unreported number of/,
      `"${label}:" should say the count is unreported, got: ${value}`);
  }

  // The specific lie this change exists to kill, checked across the WHOLE transcript.
  assert.doesNotMatch(output, /(?<![\w.])-1(?![\w.])/,
    'the raw UNREPORTED_COUNT sentinel reached the user somewhere in the run');
});

test('POSITIVE CONTROL: store reports counts -> every printed count shows them', async () => {
  const { output } = await runSyncCapturing(BOTH_REPORTED);
  const counts = receiptCounts(output);
  assertClassificationComplete(counts);

  assert.match(counts.get('Upserted'), /^3 chunks/, counts.get('Upserted'));
  assert.match(counts.get('Chunks created'), /^3$/, counts.get('Chunks created'));
  assert.match(counts.get('Purged'), /^7 chunk\(s\)/, counts.get('Purged'));
  assert.match(counts.get('Chunks deleted'), /^7$/, counts.get('Chunks deleted'));

  // Proves the unknown-state assertions DISCRIMINATE rather than always passing.
  for (const label of STORE_DERIVED) {
    assert.doesNotMatch(counts.get(label), /unreported/, `${label}: ${counts.get(label)}`);
  }
});

test('a reported ZERO is a real count and prints as 0, never as unknown', async () => {
  const { output } = await runSyncCapturing({
    sync: { status: 'ok', message: { upserted_count: 0 } },
    del: { status: 'ok', message: { deleted_count: 0 } },
  });
  const counts = receiptCounts(output);
  assert.match(counts.get('Upserted'), /^0 chunks/, counts.get('Upserted'));
  assert.match(counts.get('Chunks created'), /^0$/, counts.get('Chunks created'));
  assert.match(counts.get('Chunks deleted'), /^0$/, counts.get('Chunks deleted'));
});

test('sync state persists unknown as null, never as a fabricated integer', async () => {
  const { appRoot } = await runSyncCapturing(NOTHING_REPORTED);
  const state = JSON.parse(
    await fs.readFile(path.join(appRoot, '.descix', 'sync-state', 'Corpus.json'), 'utf8'));
  assert.equal(state.chunks_upserted, null);
  assert.equal(state.chunks_deleted, null);
  assert.equal(state.total_chunks, null);
});

/**
 * THE RETRY-EXHAUSTED WARNING.
 *
 * FIXTURE REQUIREMENT, stated because it is easy to get wrong and green either way: if EVERY
 * batch fails, `upserted` never leaves its initialiser 0 and the warning prints a truthful
 * "0" — a fixture that CANNOT exhibit the defect. The leak needs an EARLIER batch that
 * succeeded WITHOUT a count (making the running total unknown) and a LATER batch that
 * exhausts its retries. Hence >1 batch of 30 chunks, the first accepted countless.
 *
 * QUARANTINED WITH ITS REASON, never a silent skip: runCorpusSync hardcodes
 * BATCH_DELAY_MS=5000 / MAX_RETRIES=5 with no injection seam, so the backoff chain is
 * 10+20+40+80+160 = 310 SECONDS of real sleep. Run it with DESCIX_SLOW_E2E=1.
 */
test('SLOW: the retry-exhausted warning states no fabricated count', { skip:
  process.env.DESCIX_SLOW_E2E
    ? false
    : `needs ${(BATCH_DELAY_MS * (2 ** (MAX_RETRIES + 1) - 2)) / 1000}s of hardcoded backoff ` +
      `(corpus.js BATCH_DELAY_MS=${BATCH_DELAY_MS}, MAX_RETRIES=${MAX_RETRIES}, no injection ` +
      `seam); set DESCIX_SLOW_E2E=1 to run it`
}, async () => {
  let n = 0;
  const { output } = await runSyncCapturing({
    sync: () => {
      n++;
      if (n === 1) return { status: 'ok', message: {} };   // accepted, no count reported
      throw new Error('UPSERT_TIMEOUT: wedged upsert');     // resumable -> retries exhaust
    },
    del: { status: 'ok', message: {} },
  }, { paragraphs: 1200 });

  const warn = output.split('\n').find(l => l.includes('did not complete after'));
  assert.ok(warn, 'the retry-exhausted warning never fired — the fixture never reached it');
  assert.doesNotMatch(warn, /Synced\s+-?\d+\s+chunks so far/,
    `the warning stated a count the store never reported: ${warn}`);
  assert.match(warn, /Synced an unreported number of chunks so far/, warn);
});

test('COVERAGE BOUNDARY of this file', () => {
  // Printed on GREEN as well as RED, so a reader of a pass sees where the pass stops.
  console.log([
    '',
    'COVERAGE BOUNDARY - cli-receipt-honesty-render.test.js',
    '  COMPARES: the literal stdout+stderr of the real runCorpusSync against a fake store, in',
    '            three states (store reports nothing / real counts / zero), plus the',
    '            persisted sync-state file.',
    '  CATCHES:  any count the run prints whose value was fabricated when the store reported',
    '            none - both the visible -1 and the invisible 0 - across the upsert AND the',
    '            delete leg; and, via the classification check, any NEW count line added',
    '            later that nobody classified as store- or locally-derived.',
    '  DOES NOT READ: a live store, a live Pinecone namespace, or the Cloud half; the',
    '            --rebuild purge leg; runCorpusStatus / `kb doctor` render; the DRY-RUN',
    '            summary, whose counts come from the local plan and are not store-derived;',
    '            and the retry-exhausted warning unless DESCIX_SLOW_E2E=1 (310s of backoff).',
    '  RUN BY:   `npm test` in descix-cli (glob tests/*.test.js). The SLOW case is NOT.',
    ''
  ].join('\n'));
});
