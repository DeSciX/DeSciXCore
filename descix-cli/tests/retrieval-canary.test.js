/**
 * GATE for the RETRIEVAL-CANARY-ON-CORPUS-SYNC defect.
 *
 * MEASURED 2026-09-17: `descix kb corpus sync --rebuild` purges and re-upserts, then reports
 * success and a reconciled live count, while the PROD search index takes ~20 minutes to catch
 * up. Every status surface said healthy over a KB that returned zero results for hours: the
 * reconcile (`get_kb_rag_status {reconcile:true}`) counts by Pinecone ID PREFIX — presence, not
 * searchability.
 *
 * THE PROPERTY: `descix kb corpus sync` does not report bare success when a chunk it just wrote
 * cannot be found by `query_knowledge_base` within a bounded, credit-conscious number of
 * attempts (RetrievalCanary.js) — it FAILS LOUD instead, naming the elapsed time and the remedy.
 * `--skip-retrieval-canary` is the documented, explicit opt-out (the check is credit-metered).
 *
 * Layer 1 unit-tests the pure/injectable RetrievalCanary.js module (no real timers, no I/O).
 * Layer 2 drives the REAL runCorpusSync() against a spy backend, using the test-only
 * `options._canaryDelaysMs` / `options._canarySleep` seam so the bounded backoff runs in
 * milliseconds instead of real seconds.
 *
 * NEGATIVE CONTROL (run it, do not take it on trust):
 *   cp lib/commands/corpus.js /tmp/corpus.after.js
 *   git show HEAD:descix-cli/lib/commands/corpus.js > lib/commands/corpus.js   # pre-fix content
 *   node --test tests/retrieval-canary.test.js   # expect: Layer-2 gates RED (no canary exists)
 *   cp /tmp/corpus.after.js lib/commands/corpus.js                            # restore
 *   node --test tests/retrieval-canary.test.js   # expect: GREEN
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

import {
    canaryQueryText, chunkMatchesCanary, pickCanaryChunk, runRetrievalCanary,
    DEFAULT_CANARY_DELAYS_MS,
} from '../lib/core/RetrievalCanary.js';
import { runCorpusSync, runCorpusStatus } from '../lib/commands/corpus.js';
import { syncStatePath } from '../lib/core/syncState.js';

// ── Layer 1: the pure/injectable module ─────────────────────────────────────────────────────

test('canaryQueryText: trims and caps the query length — a long chunk does not become an expensive query', () => {
    assert.equal(canaryQueryText({ text: '  hello world  ' }), 'hello world');
    const long = 'x'.repeat(10000);
    const q = canaryQueryText({ text: long });
    assert.ok(q.length <= 300, `expected a capped query, got ${q.length} chars`);
});

test('chunkMatchesCanary: matches on blob_sha + chunk_idx, not on text or id', () => {
    const chunk = { blob_sha: 'abc123', chunk_idx: 2 };
    assert.equal(chunkMatchesCanary({ metadata: { blob_sha: 'abc123', chunk_idx: 2 } }, chunk), true);
    assert.equal(chunkMatchesCanary({ metadata: { blob_sha: 'abc123', chunk_idx: 3 } }, chunk), false, 'wrong chunk_idx must not match');
    assert.equal(chunkMatchesCanary({ metadata: { blob_sha: 'def456', chunk_idx: 2 } }, chunk), false, 'wrong blob_sha must not match');
    assert.equal(chunkMatchesCanary({}, chunk), false, 'a row with no metadata must not match');
    assert.equal(chunkMatchesCanary(null, chunk), false, 'a null row must not throw or match');
});

test('pickCanaryChunk: skips chunks from FAILED batches; returns null if everything failed', () => {
    const allChunks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    assert.equal(pickCanaryChunk(allChunks, []), allChunks[0], 'no failures: picks the first chunk');
    assert.equal(pickCanaryChunk(allChunks, [{ chunks: ['a'] }]), allChunks[1], 'skips a chunk from a failed batch');
    assert.equal(pickCanaryChunk(allChunks, [{ chunks: ['a', 'b', 'c'] }]), null, 'everything failed: nothing safe to check');
});

test('runRetrievalCanary: finds the chunk on a later attempt — BOUNDED, not a loop (stops as soon as found)', async () => {
    let calls = 0;
    const sleeps = [];
    const fakeApiClient = {
        async invoke(command, params) {
            calls++;
            assert.equal(command, 'query_knowledge_base');
            assert.equal(params.file_filter, 'corpus:deadbeef', 'must scope the query to the chunk\'s own document');
            if (calls < 3) return { message: { results: [] } };
            return { message: { results: [{ metadata: { blob_sha: 'deadbeef', chunk_idx: 0 } }] } };
        },
    };
    const chunk = { text: 'hello world', file_id: 'corpus:deadbeef', blob_sha: 'deadbeef', chunk_idx: 0 };
    const result = await runRetrievalCanary(fakeApiClient, {
        appId: 'app1', kbName: 'Corpus', chunk,
        delaysMs: [1, 1, 1, 1, 1],
        sleep: async (ms) => { sleeps.push(ms); },
    });
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 3, 'must stop at the attempt that found it, not exhaust the schedule');
    assert.equal(calls, 3, 'a BOUNDED canary must not keep calling after success');
});

test('runRetrievalCanary: exhausts the bounded schedule and reports NOT ok — never throws, never loops past the schedule', async () => {
    let calls = 0;
    const result = await runRetrievalCanary({
        async invoke() { calls++; return { message: { results: [] } }; },
    }, {
        appId: 'app1', kbName: 'Corpus',
        chunk: { text: 'x', file_id: 'corpus:aaa', blob_sha: 'aaa', chunk_idx: 0 },
        delaysMs: [1, 1, 1],
        sleep: async () => {},
    });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 3);
    assert.equal(calls, 3, `expected exactly ${3} calls (the fixed schedule length), got ${calls} — a canary must not loop past its bound`);
});

test('runRetrievalCanary: a transient per-attempt error does not abort early, and is reported as lastError on final timeout', async () => {
    const result = await runRetrievalCanary({
        async invoke() { throw new Error('ECONNRESET'); },
    }, {
        appId: 'app1', kbName: 'Corpus',
        chunk: { text: 'x', file_id: 'corpus:aaa', blob_sha: 'aaa', chunk_idx: 0 },
        delaysMs: [1, 1],
        sleep: async () => {},
    });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 2, 'an error on one attempt must not cut the schedule short');
    assert.match(result.lastError, /ECONNRESET/);
});

// ── Layer 2: the REAL runCorpusSync(), driven against a spy backend ─────────────────────────

class CanarySpyApiClient {
    constructor({ queryFindsAfter = 0 } = {}) {
        this.calls = [];
        this.queryFindsAfter = queryFindsAfter; // 0 = finds on first call; Infinity = never finds
        this.queryCalls = 0;
        this.baseUrl = 'https://dev.descix.net';
    }

    async ensureBaseUrl() {
        return this.baseUrl;
    }

    async invoke(command, payload) {
        this.calls.push({ command, payload });
        if (command === 'list_knowledge_bases') {
            return { status: 'OK', message: { knowledgebases: [{ knowledgebase_name: 'Corpus' }] } };
        }
        if (command === 'get_product_context') {
            return { status: 'OK', community_id: 'testcommunity' };
        }
        if (command === 'kb_list_file_ids') {
            return { status: 'OK', message: { file_ids: [], unique_count: 0, total_chunks: 0 } };
        }
        if (command === 'kb_sync_chunks') {
            const n = (payload?.chunks || []).length;
            return { status: 'OK', message: { upserted_count: n } };
        }
        if (command === 'get_kb_rag_status') {
            return { status: 'OK', message: { reconciled: true, reconcileBefore: 0, reconcileAfter: 1, vectorCount: 1, source: 'live' } };
        }
        if (command === 'query_knowledge_base') {
            this.queryCalls++;
            if (this.queryCalls > this.queryFindsAfter) {
                // Echo the blob_sha out of the file_filter the canary itself sent — deterministic
                // without needing to know the real git blob sha ahead of time.
                const blobSha = String(payload.file_filter || '').replace(/^corpus:/, '');
                return { status: 'OK', message: { results: [{ metadata: { blob_sha: blobSha, chunk_idx: 0 } }] } };
            }
            return { status: 'OK', message: { results: [] } };
        }
        return { status: 'OK', message: {} };
    }
    callsTo(command) { return this.calls.filter((c) => c.command === command); }
}

async function makeFixture(t) {
    const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'canary-fixture-'));
    const appId = 'testapp-canary';
    const appRoot = path.join(wsRoot, 'apps', appId);
    await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
    await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });
    await fs.mkdir(path.join(appRoot, 'docs'), { recursive: true });
    await fs.writeFile(path.join(appRoot, 'docs', 'intro.md'), '# Hello\n\nSome content to chunk.\n');
    await fs.writeFile(path.join(appRoot, '.descix', 'manifests', 'Corpus.json'), JSON.stringify({
        kb_name: 'Corpus', sync_mode: 'local',
        sources: [{ path: `apps/${appId}/docs`, tier: 1, doc_type: 'documentation' }],
    }, null, 2));
    await fs.writeFile(path.join(wsRoot, '.descix', 'workspace.json'), JSON.stringify({
        version: '2.1', workspaceRoot: wsRoot, type: 'workspace',
        env: { products: [{ appId, localPath: `apps/${appId}`, kbId: 'Corpus' }] },
    }, null, 2));
    execSync('git init -q -b main', { cwd: wsRoot, stdio: 'pipe' });
    execSync('git config user.email "test@test"', { cwd: wsRoot, stdio: 'pipe' });
    execSync('git config user.name "test"', { cwd: wsRoot, stdio: 'pipe' });
    execSync('git add -A', { cwd: wsRoot, stdio: 'pipe' });
    execSync('git commit -q -m seed', { cwd: wsRoot, stdio: 'pipe' });

    const origCwd = process.cwd();
    process.chdir(wsRoot);
    t.after(async () => {
        process.chdir(origCwd);
        await fs.rm(wsRoot, { recursive: true, force: true });
    });
    return { wsRoot, appRoot, appId };
}

const FAST_CANARY = { _canaryDelaysMs: [1, 1, 1], _canarySleep: async () => {} };

test('GATE: a sync whose canary finds the chunk on the first attempt resolves normally (no bare-success lie exposed)', async (t) => {
    const { appId, appRoot } = await makeFixture(t);
    const spy = new CanarySpyApiClient({ queryFindsAfter: 0 });

    await runCorpusSync(spy, { app: appId, yes: true, ...FAST_CANARY });

    assert.equal(spy.callsTo('query_knowledge_base').length, 1, 'should confirm on the FIRST attempt and stop');
    const state = JSON.parse(await fs.readFile(syncStatePath(appRoot, 'Corpus', await spy.ensureBaseUrl()), 'utf8'));
    assert.equal(state.retrieval_canary?.ok, true);
});

test('GATE: a sync whose canary NEVER finds the chunk FAILS LOUD (throws) — never a bare success', async (t) => {
    const { appId, appRoot } = await makeFixture(t);
    const spy = new CanarySpyApiClient({ queryFindsAfter: Infinity });

    await assert.rejects(
        () => runCorpusSync(spy, { app: appId, yes: true, ...FAST_CANARY }),
        (err) => {
            assert.match(err.message, /searchable/i, 'the failure must say the vectors are not yet searchable');
            assert.match(err.message, /re-run/i, 'the failure must name the remedy');
            return true;
        },
        'a sync whose content never becomes searchable within the canary window must FAIL, not report success',
    );
    assert.equal(spy.callsTo('query_knowledge_base').length, 3, 'must exhaust the bounded schedule, not loop forever');

    // Even on canary failure, the sync state is still written — the vectors WERE upserted, and
    // the recorded verdict lets `kb corpus status` and a later re-run see exactly what happened.
    const state = JSON.parse(await fs.readFile(syncStatePath(appRoot, 'Corpus', await spy.ensureBaseUrl()), 'utf8'));
    assert.equal(state.retrieval_canary?.ok, false);
});

test('GATE: --skip-retrieval-canary bypasses the check entirely (documented cost opt-out)', async (t) => {
    const { appId, appRoot } = await makeFixture(t);
    const spy = new CanarySpyApiClient({ queryFindsAfter: Infinity }); // would FAIL the canary if run

    // Must NOT throw despite the canary being unwinnable — the operator explicitly opted out.
    await runCorpusSync(spy, { app: appId, yes: true, skipRetrievalCanary: true });

    assert.equal(spy.callsTo('query_knowledge_base').length, 0, 'skip must mean ZERO canary calls (this is the cost the flag saves)');
    const state = JSON.parse(await fs.readFile(syncStatePath(appRoot, 'Corpus', await spy.ensureBaseUrl()), 'utf8'));
    assert.equal(state.retrieval_canary, null, 'a skipped canary must record null, never a fabricated ok:true');
});

test('GATE: `descix kb corpus status` reports the retrieval verdict from the local record, and NAMES it as a local record', async (t) => {
    const { appId } = await makeFixture(t);
    const spy = new CanarySpyApiClient({ queryFindsAfter: Infinity });

    await assert.rejects(() => runCorpusSync(spy, { app: appId, yes: true, ...FAST_CANARY }));

    let captured = '';
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk, enc, cb) => { captured += String(chunk); if (typeof enc === 'function') enc(); else if (typeof cb === 'function') cb(); return true; };
    try {
        // A client is REQUIRED now: sync state is keyed by origin, so there is no
        // origin-independent status to print. Same spy, so status reports the origin the
        // sync above actually wrote.
        await runCorpusStatus(spy, { app: appId });
    } finally {
        process.stdout.write = orig;
    }
    assert.match(captured, /NOT CONFIRMED/, 'status must surface the failed canary verdict, not silence it');
    assert.match(captured, /local record/i, 'the chunk-count line must name that it is a LOCAL RECORD, not a live read');
});

console.error(
    '[retrieval-canary gate] Layer 1 unit-tests RetrievalCanary.js in isolation (bounded schedule, ' +
    'stops on success, survives per-attempt errors). Layer 2 drives the REAL runCorpusSync() ' +
    'against a spy backend with an injected fast schedule. CATCHES: a sync that reports success ' +
    'while its content cannot be retrieved, a canary that loops past its bound, a skip flag that ' +
    'does not actually skip, and a status surface that hides a failed verdict or mislabels a local ' +
    'number as live. DOES NOT READ: a live Pinecone index or the real ~20-minute propagation delay ' +
    '— see the file header for the negative-control recipe (revert corpus.js to HEAD: RED).',
);
