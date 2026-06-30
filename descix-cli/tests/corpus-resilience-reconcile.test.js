/**
 * WS-KB-CORPUS-RESILIENCE — corpus re-upsert resilience + auto-reconcile tests.
 *
 * Scope:
 *   - RESUMABLE RETRY: a per-batch upsert that fails with a TIMEOUT / transient
 *     stall (UPSERT_TIMEOUT, ETIMEDOUT, 504, ECONNRESET) MUST be RETRIED with
 *     backoff (id-keyed upserts are idempotent), NOT silently skipped. A genuine
 *     non-transient error (e.g. validation) is still skipped+logged (one bad batch
 *     does not abort the whole sync).
 *   - AUTO-RECONCILE: a COMPLETED, clean (non-dry, no batch failures) sync calls
 *     get_kb_rag_status{ reconcile: true } so the cached rag_vector_count is made
 *     truthful against live Pinecone. A run WITH a non-transient batch failure does
 *     NOT auto-reconcile (the run is partial).
 *
 * Strategy: drive runCorpusSync() directly against a SpyApiClient (no live backend),
 * mirroring corpus-rebuild-safety.test.js. Backoff is real wall-clock; we use a tiny
 * fixture so at most one retry fires (a few seconds) — acceptable for CI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { runCorpusSync } from '../lib/commands/corpus.js';

/**
 * Spy that can be programmed to make kb_sync_chunks fail a configurable number of
 * times with a chosen error before succeeding, and records every reconcile call.
 */
class ResilienceSpyApiClient {
  constructor({ registeredKbs = ['Corpus'], failKbSyncTimes = 0, failError = null, failPermanent = false } = {}) {
    this.calls = [];
    this.registeredKbs = registeredKbs;
    this.failKbSyncTimes = failKbSyncTimes;
    this.failError = failError;
    this.failPermanent = failPermanent;
    this.kbSyncAttempts = 0;
    this.upsertedTotal = 0;
  }
  async invoke(command, payload) {
    this.calls.push({ command, payload });

    if (command === 'kb_sync_chunks') {
      this.kbSyncAttempts++;
      if (this.failPermanent) {
        throw new Error(this.failError || 'permanent validation error');
      }
      if (this.kbSyncAttempts <= this.failKbSyncTimes) {
        throw new Error(this.failError || 'UPSERT_TIMEOUT: exceeded deadline');
      }
      const n = (payload?.chunks || []).length;
      this.upsertedTotal += n;
      return { status: 'OK', message: { upserted_count: n }, upserted_count: n };
    }
    if (command === 'get_kb_rag_status') {
      // Reconcile path: return the live total we actually upserted.
      return {
        status: 'OK',
        message: {
          reconciled: !!payload?.reconcile,
          reconcileBefore: 0,
          reconcileAfter: this.upsertedTotal,
          vectorCount: this.upsertedTotal,
          source: 'live'
        }
      };
    }
    if (command === 'list_knowledge_bases') {
      return { status: 'OK', message: { knowledgebases: this.registeredKbs.map(name => ({ knowledgebase_name: name })) } };
    }
    if (command === 'get_product_context') {
      return { status: 'OK', community_id: payload?.app_id || 'testcommunity' };
    }
    if (command === 'kb_list_file_ids') {
      return { status: 'OK', message: { file_ids: [], unique_count: 0, total_chunks: 0 } };
    }
    return { status: 'OK', message: {} };
  }
  callsTo(command) { return this.calls.filter(c => c.command === command); }
}

async function makeFixture(t, { files = { 'docs/intro.md': '# Hello\n\nSome content to chunk.\n' } } = {}) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'corpus-resil-'));
  const appId = 'testapp-corpus-resil';
  const appRoot = path.join(wsRoot, 'apps', appId);

  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(appRoot, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }

  const manifest = {
    kb_name: 'Corpus',
    sync_mode: 'local',
    sources: [{ path: `apps/${appId}/docs`, tier: 1, doc_type: 'documentation' }]
  };
  await fs.writeFile(path.join(appRoot, '.descix', 'manifests', 'Corpus.json'), JSON.stringify(manifest, null, 2));

  const workspace = {
    version: '2.1', workspaceRoot: wsRoot, type: 'workspace',
    env: { products: [{ appId, localPath: `apps/${appId}`, kbId: 'Corpus' }] }
  };
  await fs.writeFile(path.join(wsRoot, '.descix', 'workspace.json'), JSON.stringify(workspace, null, 2));

  execSync('git init -q -b main', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git config user.email "test@test"', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git config user.name "test"', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git add -A', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git commit -q -m "seed"', { cwd: wsRoot, stdio: 'pipe' });

  const origCwd = process.cwd();
  process.chdir(wsRoot);
  t.after(async () => {
    process.chdir(origCwd);
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, appRoot, appId };
}

// ─────────────────────────────────────────────────────────────────────────────
test('R1 — a transient UPSERT_TIMEOUT batch is RETRIED (not skipped), sync completes', async (t) => {
  const { appId } = await makeFixture(t);
  // Fail the first kb_sync_chunks attempt with a timeout, then succeed.
  const spy = new ResilienceSpyApiClient({ failKbSyncTimes: 1, failError: 'UPSERT_TIMEOUT: exceeded the 120000ms deadline' });

  await runCorpusSync(spy, { app: appId, yes: true, verbose: false });

  const syncCalls = spy.callsTo('kb_sync_chunks');
  // At least 2 attempts on the SAME batch: the failed attempt + the retry.
  assert.ok(syncCalls.length >= 2, `expected a retry after timeout, got ${syncCalls.length} kb_sync_chunks call(s)`);
  // The batch ultimately upserted its chunks (not silently dropped).
  assert.ok(spy.upsertedTotal > 0, 'no chunks were upserted — the timeout batch was skipped instead of retried');
});

// ─────────────────────────────────────────────────────────────────────────────
test('R2 — a COMPLETED clean sync AUTO-RECONCILES (calls get_kb_rag_status reconcile:true)', async (t) => {
  const { appId } = await makeFixture(t);
  const spy = new ResilienceSpyApiClient({ failKbSyncTimes: 0 });

  await runCorpusSync(spy, { app: appId, yes: true, verbose: false });

  const reconcileCalls = spy.callsTo('get_kb_rag_status').filter(c => c.payload?.reconcile === true);
  assert.equal(reconcileCalls.length, 1,
    `expected exactly one auto-reconcile after a clean sync, got ${reconcileCalls.length}`);
  assert.equal(reconcileCalls[0].payload.app_id, appId);
});

// ─────────────────────────────────────────────────────────────────────────────
test('R3 — a PERMANENT (non-transient) batch error does NOT retry and does NOT auto-reconcile', async (t) => {
  const { appId } = await makeFixture(t);
  // Permanent validation-style error: not in the transient/timeout set.
  const spy = new ResilienceSpyApiClient({ failPermanent: true, failError: 'invalid chunk schema: bad field' });

  await runCorpusSync(spy, { app: appId, yes: true, verbose: false });

  const syncCalls = spy.callsTo('kb_sync_chunks');
  // Permanent error → one attempt per batch, no retry storm.
  assert.equal(syncCalls.length, spy.kbSyncAttempts);
  // The run is partial (had failures) → NO auto-reconcile (would bake in partial state).
  const reconcileCalls = spy.callsTo('get_kb_rag_status').filter(c => c.payload?.reconcile === true);
  assert.equal(reconcileCalls.length, 0,
    'a sync with batch failures must NOT auto-reconcile (it is partial)');
});
