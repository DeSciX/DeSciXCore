/**
 * A corpus sync purges what is LIVE and unwalked, and `kb doctor` judges by file identity.
 *
 * THE DEFECTS (GODSWORLD-DEV, measured on PROD 2026-09-18, egpt-godsworld/GodsWorld):
 *  1. The first origin-keyed sync (cli 1.0.12) had no history for its origin, so "previous
 *     blobs minus the walk" was empty, and a superseded INDEX.md stayed live and retrievable
 *     beside its replacement. No incremental sync could ever name it.
 *  2. `kb doctor` printed "EXACT / HEALTHY" over that state. It compared the live count with
 *     total_chunks, which the sync writes FROM the reconciled live count, so drift was zero by
 *     construction.
 *
 * Run: node --test tests/corpus-stale-from-live.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diagnoseCorpusIdentity } from '../lib/commands/kb.js';
import { zeroChunkBlobShas } from '../lib/commands/corpus.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'commands', 'corpus.js'), 'utf8');
const KB = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'commands', 'kb.js'), 'utf8');
const CLI = fs.readFileSync(path.resolve(__dirname, '..', 'bin', 'descix.js'), 'utf8');

const sha = (c) => c.repeat(40);
const CURRENT = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(sha);           // 8 recipes, one chunk each
const STALE_INDEX = '447ded716be033a968456b32a978ab17ce6f5786';              // the measured orphan

// ── The incident, as measured ───────────────────────────────────────────────────────────────

test('NEGATIVE CONTROL: the OLD count check reads HEALTHY over the live orphan', () => {
    // Store reconciled to 10; the sync wrote that same 10 into total_chunks. Old verdict: EXACT.
    const vectorCount = 10;
    const totalChunksWrittenFromLive = 10;
    assert.equal(vectorCount - totalChunksWrittenFromLive, 0,
        'drift 0 by construction — if this stops holding, the control no longer models the defect');
});

test('THE FIX: identity names the orphan the count could not see', () => {
    const r = diagnoseCorpusIdentity({
        liveFileIds: [...CURRENT, STALE_INDEX].map((s) => `corpus:${s}`),
        walkedBlobShas: CURRENT,
        zeroChunkBlobShas: [],
    });
    assert.deepEqual(r.orphans, [`corpus:${STALE_INDEX}`]);
    assert.deepEqual(r.missing, []);
});

test('MISSING: a walked file with content that is not live is reported', () => {
    const r = diagnoseCorpusIdentity({
        liveFileIds: CURRENT.slice(1).map((s) => `corpus:${s}`),
        walkedBlobShas: CURRENT,
        zeroChunkBlobShas: [],
    });
    assert.deepEqual(r.missing, [`corpus:${CURRENT[0]}`]);
    assert.deepEqual(r.orphans, []);
});

test('an EMPTY-by-design file is not reported missing', () => {
    const r = diagnoseCorpusIdentity({
        liveFileIds: CURRENT.slice(1).map((s) => `corpus:${s}`),
        walkedBlobShas: CURRENT,
        zeroChunkBlobShas: [CURRENT[0]],
    });
    assert.deepEqual(r.missing, []);
});

test('with no zero-chunk record the missing check is UNVERIFIABLE, never guessed', () => {
    const r = diagnoseCorpusIdentity({
        liveFileIds: CURRENT.slice(1).map((s) => `corpus:${s}`),
        walkedBlobShas: CURRENT,
        zeroChunkBlobShas: undefined,
    });
    assert.equal(r.zeroKnown, false);
    assert.deepEqual(r.missing, [], 'unknown is not reported as lost');
});

test('other file_id schemes are not this manifest\'s to judge', () => {
    const r = diagnoseCorpusIdentity({
        liveFileIds: [...CURRENT.map((s) => `corpus:${s}`), 'drive:xyz', 'upload:abc'],
        walkedBlobShas: CURRENT,
        zeroChunkBlobShas: [],
    });
    assert.deepEqual(r.orphans, []);
});

// ── The zero-chunk record is complete or it is null ────────────────────────────────────────

test('first sync: every file was chunked this run, so the record is complete', () => {
    const files = CURRENT.map((s) => ({ blob_sha: s }));
    assert.deepEqual(zeroChunkBlobShas(null, new Set(CURRENT), files, [CURRENT[2]]), [CURRENT[2]]);
});

test('a state that predates the field leaves unchanged files unknown -> null, not a partial list', () => {
    const previous = { synced_blob_shas: CURRENT };             // no zero_chunk_blob_shas
    const changed = [{ blob_sha: CURRENT[0] }];
    assert.equal(zeroChunkBlobShas(previous, new Set(CURRENT), changed, []), null);
});

test('carried forward: a still-empty unchanged file stays recorded; a changed one is re-judged', () => {
    const previous = { zero_chunk_blob_shas: [CURRENT[1], CURRENT[0]] };
    const changed = [{ blob_sha: CURRENT[0] }];                 // re-chunked, now has content
    assert.deepEqual(zeroChunkBlobShas(previous, new Set(CURRENT), changed, []), [CURRENT[1]]);
});

// ── Wiring ───────────────────────────────────────────────────────────────────────────────────

test('the sync derives STALE from the live KB, and the history-derived set is gone', () => {
    assert.match(CORPUS, /const remote = await listRemoteFileIds\(apiClient, appId, kbName\);\s*\n\s*fileIdsToDelete = remote\.file_ids/);
    assert.match(CORPUS, /id\.startsWith\('corpus:'\) && !localFileIds\.has\(id\)/);
    assert.doesNotMatch(CORPUS, /deletedBlobShas/, 'the second derivation of "stale" must be deleted');
});

test('the doctor no longer judges by the circular count, and the threshold flag is gone', () => {
    assert.doesNotMatch(KB, /DRIFT_THRESHOLD|const localChunks = syncStateRaw\.total_chunks/);
    assert.doesNotMatch(CLI, /-t, --threshold <ratio>/);
    assert.match(KB, /diagnoseCorpusIdentity\(\{/);
});

test('the doctor no longer prints a function\'s source as a file path, or tells anyone to rm state', () => {
    assert.doesNotMatch(KB, /rm "\$\{syncStatePath\}"/);
});
