/**
 * Sync state is keyed by the ORIGIN it describes — syncing one KB to two origins must not
 * make the second one skip files it never received.
 *
 * THE DEFECT (measured 2026-09-17, two apps, one cause):
 * state lived at `.descix/sync-state/<KB>.json` — one file per KB NAME, no environment and no
 * origin in the path or the payload. `corpus sync` skips a file whose blob SHA is in that
 * state, and nothing asked WHICH ORIGIN had received those SHAs.
 *
 *   GodsWorld (GODSWORLD-DEV): a DEV sync diffed against PROD-derived state, took 2 of 8 files,
 *   then overwrote the state — after which a PROD dry-run reported "Drift: NONE" over a PROD KB
 *   genuinely two files behind.
 *
 *   daita/General (DEVPLANE): the one state file described DEV (886 chunks, DEV's 886 vectors)
 *   while PROD held a different corpus (2545 vectors, 2026-05-29). A PROD dry-run against it
 *   declared 43 files "Unchanged" that PROD had never received at those SHAs.
 *
 * The central test below is the one GODSWORLD-DEV specified: sync KB X to origin A, then to
 * origin B, and assert B gets the FULL file set. It fails against the pre-fix code.
 *
 * Run: node --test tests/sync-state-origin-keyed.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    originKey, syncStatePath, legacySyncStatePath, syncFailureLogPath,
    loadSyncState, saveSyncState,
} from '../lib/core/syncState.js';

const DEV = 'https://dev.descix.net';
const PROD = 'https://descix.net';

function tmpApp() {
    return fsSync.mkdtempSync(path.join(os.tmpdir(), 'syncstate-'));
}

async function withApp(fn) {
    const root = tmpApp();
    try {
        return await fn(root);
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
}

/** The state a sync would write after sending these files. */
const stateFor = (shas) => ({
    last_sync_commit: 'abc123',
    synced_files_count: shas.length,
    total_chunks: shas.length,
    synced_blob_shas: shas,
});

/** What a sync WOULD upsert: the walked files whose SHAs this origin's state does not carry. */
async function wouldUpsert(appRoot, kbName, origin, walkedShas) {
    const { state } = await loadSyncState(appRoot, kbName, origin);
    const previous = new Set(state?.synced_blob_shas || []);
    return walkedShas.filter((sha) => !previous.has(sha));
}

// ── THE TEST THE BLOCKER ASKED FOR ──────────────────────────────────────────────────────────

test('sync to origin A then origin B: B receives the FULL file set, not a diff against A', () =>
    withApp(async (appRoot) => {
        const walked = ['sha1', 'sha2', 'sha3', 'sha4', 'sha5', 'sha6', 'sha7', 'sha8'];

        // 1. A full sync to PROD.
        assert.deepEqual(await wouldUpsert(appRoot, 'GodsWorld', PROD, walked), walked);
        await saveSyncState(appRoot, 'GodsWorld', PROD, stateFor(walked));

        // 2. Now sync the SAME KB to DEV, which has never received anything.
        const toDev = await wouldUpsert(appRoot, 'GodsWorld', DEV, walked);
        assert.deepEqual(toDev, walked,
            'DEV must receive all 8 files — this is the measured failure: it took 2 and skipped 6 as "unchanged"');
    }));

test('the first origin is NOT BLINDED: a sync to the second leaves the first\'s state intact', () =>
    withApp(async (appRoot) => {
        // The dangerous half. PROD is two files behind main.
        await saveSyncState(appRoot, 'GodsWorld', PROD, stateFor(['sha1', 'sha2', 'sha3', 'sha4', 'sha5', 'sha6']));
        // A DEV sync of the newer corpus happens in between.
        await saveSyncState(appRoot, 'GodsWorld', DEV, stateFor(['sha1', 'sha2', 'sha3', 'sha4', 'sha5', 'sha6', 'sha7', 'sha8']));

        // PROD must still see its own two-file drift, not DEV's commit.
        const prodDrift = await wouldUpsert(appRoot, 'GodsWorld', PROD,
            ['sha1', 'sha2', 'sha3', 'sha4', 'sha5', 'sha6', 'sha7', 'sha8']);
        assert.deepEqual(prodDrift, ['sha7', 'sha8'],
            'PROD reported "Drift: NONE" here before the fix');
    }));

test('two origins keep two files, and neither path is the unkeyed one', () =>
    withApp(async (appRoot) => {
        await saveSyncState(appRoot, 'GodsWorld', PROD, stateFor(['a']));
        await saveSyncState(appRoot, 'GodsWorld', DEV, stateFor(['a', 'b']));

        const prodPath = syncStatePath(appRoot, 'GodsWorld', PROD);
        const devPath = syncStatePath(appRoot, 'GodsWorld', DEV);
        assert.notEqual(prodPath, devPath);
        assert.notEqual(prodPath, legacySyncStatePath(appRoot, 'GodsWorld'));
        assert.ok(fsSync.existsSync(prodPath) && fsSync.existsSync(devPath));
    }));

test('the origin is recorded INSIDE the file, not only in its path', () =>
    withApp(async (appRoot) => {
        await saveSyncState(appRoot, 'GodsWorld', PROD, stateFor(['a']));
        const written = JSON.parse(await fs.readFile(syncStatePath(appRoot, 'GodsWorld', PROD), 'utf-8'));
        assert.equal(written.origin, PROD, 'a reader must be able to tell what it describes');
        assert.deepEqual(written.synced_blob_shas, ['a'], 'the rest of the state is unchanged');
    }));

test('a recorded origin that disagrees with the caller is refused, not trusted', () =>
    withApp(async (appRoot) => {
        // Only reachable through a slug collision, but trusting the directory in that case
        // would resurrect the original bug one level down.
        const p = syncStatePath(appRoot, 'GodsWorld', PROD);
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.writeFile(p, JSON.stringify({ origin: DEV, ...stateFor(['a']) }));

        const loaded = await loadSyncState(appRoot, 'GodsWorld', PROD);
        assert.equal(loaded.state, null);
        assert.equal(loaded.reason, 'origin-mismatch');
        assert.match(loaded.detail, /records origin https:\/\/dev\.descix\.net/);
    }));

// ── Migration: an unkeyed file belongs to nobody ────────────────────────────────────────────

test('a legacy unkeyed file is NOT adopted by whichever origin asks first', () =>
    withApp(async (appRoot) => {
        const legacy = legacySyncStatePath(appRoot, 'General');
        await fs.mkdir(path.dirname(legacy), { recursive: true });
        await fs.writeFile(legacy, JSON.stringify(stateFor(['sha1', 'sha2', 'sha3'])));

        for (const origin of [PROD, DEV]) {
            const loaded = await loadSyncState(appRoot, 'General', origin);
            assert.equal(loaded.state, null, `${origin} must not inherit an unlabelled record`);
            assert.equal(loaded.reason, 'unkeyed-legacy');
            // ...and therefore walks the full corpus.
            assert.deepEqual(await wouldUpsert(appRoot, 'General', origin, ['sha1', 'sha2', 'sha3']),
                ['sha1', 'sha2', 'sha3']);
        }
    }));

test('the legacy file is never deleted — it is the only record of what came before', () =>
    withApp(async (appRoot) => {
        const legacy = legacySyncStatePath(appRoot, 'General');
        await fs.mkdir(path.dirname(legacy), { recursive: true });
        await fs.writeFile(legacy, JSON.stringify(stateFor(['sha1'])));

        await loadSyncState(appRoot, 'General', PROD);
        await saveSyncState(appRoot, 'General', PROD, stateFor(['sha1']));
        assert.ok(fsSync.existsSync(legacy));
    }));

test('once an origin has keyed state, it stops reporting the legacy file', () =>
    withApp(async (appRoot) => {
        const legacy = legacySyncStatePath(appRoot, 'General');
        await fs.mkdir(path.dirname(legacy), { recursive: true });
        await fs.writeFile(legacy, JSON.stringify(stateFor(['sha1'])));

        await saveSyncState(appRoot, 'General', PROD, stateFor(['sha1']));
        const afterProd = await loadSyncState(appRoot, 'General', PROD);
        assert.equal(afterProd.reason, 'loaded', 'PROD migrated and is quiet');

        const devStill = await loadSyncState(appRoot, 'General', DEV);
        assert.equal(devStill.reason, 'unkeyed-legacy', 'DEV has not migrated yet and still says so');
    }));

test('a first sync with no state at all is distinguished from a legacy one', () =>
    withApp(async (appRoot) => {
        const loaded = await loadSyncState(appRoot, 'Fresh', PROD);
        assert.equal(loaded.state, null);
        assert.equal(loaded.reason, 'first-sync', 'nothing to warn about — this is simply new');
    }));

// ── The key itself ──────────────────────────────────────────────────────────────────────────

test('origins map to distinct, readable, filename-safe keys', () => {
    assert.equal(originKey('https://dev.descix.net'), 'dev.descix.net');
    assert.equal(originKey('https://descix.net'), 'descix.net');
    assert.equal(originKey('https://localhost:4000'), 'localhost-4000');
    assert.equal(originKey('https://descix.net/'), 'descix.net', 'a trailing slash is not a different origin');
    assert.notEqual(originKey('https://dev.descix.net'), originKey('https://descix.net'));
});

test('an empty origin is REFUSED — an unkeyed file must be unwritable', () => {
    // The failure mode this guards: a caller that forgets the argument silently writing
    // `sync-state/undefined/<KB>.json`, which is the unscoped file under a new name.
    for (const bad of [undefined, null, '', '   ', 42, {}]) {
        assert.throws(() => originKey(bad), /refusing to key sync state by an empty origin/,
            `${JSON.stringify(bad) ?? typeof bad}`);
    }
});

test('the failure log is keyed too — a DEV run cannot overwrite the record of PROD failures', () =>
    withApp(async (appRoot) => {
        assert.notEqual(
            syncFailureLogPath(appRoot, 'GodsWorld', PROD),
            syncFailureLogPath(appRoot, 'GodsWorld', DEV));
    }));
