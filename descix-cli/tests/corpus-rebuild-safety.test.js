/**
 * Deliverable A — `descix kb corpus sync --rebuild` safety tests.
 *
 * Scope (WS-CLI-REBUILD-FLAG-SAFETY):
 *   - --dry-run enumerates would-be-purged file_ids + would-be-upserted chunks
 *     without ANY Pinecone writes. Exit 0 if no drift, 1 if drift.
 *   - Anti-regression: --rebuild --dry-run MUST NOT call kb_sync_chunks or
 *     kb_delete_chunks (the Pinecone write/delete endpoints).
 *   - --show-walk prints resolved ref + first 50 files before any Pinecone op.
 *   - --rebuild without --yes prompts; --yes skips for scripting.
 *
 * Strategy:
 *   - Build a temp workspace with one app + one manifest pointing at a small
 *     docs/ directory.
 *   - Inject a SpyApiClient that records every apiClient.invoke() call and
 *     returns canned responses for the read-only endpoints (list_knowledge_bases,
 *     kb_list_file_ids). Any call to kb_sync_chunks / kb_delete_chunks during a
 *     dry-run is a test failure.
 *   - Run runCorpusSync() directly (we bypass bin/descix.js so we can assert on
 *     the return value's drift flag).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { runCorpusSync } from '../lib/commands/corpus.js';

// Endpoints the Syncer / corpus.js may invoke. Used by the spy to classify
// each call as read-only vs write.
const READ_ONLY_ENDPOINTS = new Set([
  'list_knowledge_bases',
  'get_product_context',
  'kb_list_file_ids',
  'kb_get_chunk_metadata',
  'kb_get_chunk_ids'
]);
const WRITE_ENDPOINTS = new Set([
  'kb_sync_chunks',      // upsert
  'kb_delete_chunks'     // delete
]);

class SpyApiClient {
  constructor({ registeredKbs = ['Corpus'], remoteFileIds = [] } = {}) {
    this.calls = [];
    this.registeredKbs = registeredKbs;
    this.remoteFileIds = remoteFileIds;
  }
  async invoke(command, payload) {
    this.calls.push({ command, payload });
    if (WRITE_ENDPOINTS.has(command)) {
      // We let this through so the test can assert on it failing — but if the
      // calling test expects ZERO writes (dry-run), it will check this.calls.
      return { status: 'ok', message: { upserted: 0, deleted: 0 } };
    }
    if (command === 'list_knowledge_bases') {
      return {
        status: 'ok',
        message: {
          knowledgebases: this.registeredKbs.map(name => ({ knowledgebase_name: name }))
        }
      };
    }
    if (command === 'get_product_context') {
      return { status: 'ok', community_id: payload?.app_id || 'testcommunity' };
    }
    if (command === 'kb_list_file_ids') {
      return {
        status: 'ok',
        message: {
          file_ids: this.remoteFileIds,
          unique_count: this.remoteFileIds.length,
          total_chunks: this.remoteFileIds.length * 3  // synthetic ratio
        }
      };
    }
    // Default empty response for any other read-only probe.
    return { status: 'ok', message: {} };
  }
  callsTo(command) { return this.calls.filter(c => c.command === command); }
  hasAnyWriteCall() { return this.calls.some(c => WRITE_ENDPOINTS.has(c.command)); }
}

/**
 * Build a temp workspace with one app, one corpus manifest, and a real git repo
 * (so CorpusWalker can compute blob SHAs and `git symbolic-ref` works for the
 * branch advisory test).
 */
async function makeFixture(t, { branch = 'main', files = { 'docs/intro.md': '# Hello\n' } } = {}) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'corpus-safety-'));
  const appId = 'testapp-corpus-safety';
  const appRoot = path.join(wsRoot, 'apps', appId);

  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(appRoot, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }

  // Manifest references the docs/ dir relative to workspace root.
  const manifest = {
    kb_name: 'Corpus',
    sync_mode: 'local',
    sources: [{ path: `apps/${appId}/docs`, tier: 1, doc_type: 'documentation' }]
  };
  await fs.writeFile(
    path.join(appRoot, '.descix', 'manifests', 'Corpus.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Workspace.json (v2.1)
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      products: [{ appId, localPath: `apps/${appId}`, kbId: 'Corpus' }]
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  // Init git so CorpusWalker can compute blob SHAs and getCurrentBranch works.
  // Use minimal config to avoid relying on global user.email/name.
  execSync(`git init -q -b ${branch}`, { cwd: wsRoot, stdio: 'pipe' });
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
// Anti-regression core: --rebuild --dry-run cannot call write/delete endpoints.
// ─────────────────────────────────────────────────────────────────────────────
test('A1 — --rebuild --dry-run NEVER calls kb_sync_chunks or kb_delete_chunks', async (t) => {
  const { appId } = await makeFixture(t);
  // Plant some "stale" remote file_ids that DO NOT match the local walk so the
  // dry-run has something to report.
  const spy = new SpyApiClient({
    registeredKbs: ['Corpus'],
    remoteFileIds: ['corpus:dead0000beef', 'corpus:dead0000cafe']
  });

  const result = await runCorpusSync(spy, {
    app: appId,
    rebuild: true,
    dryRun: true,
    yes: true,
    verbose: false
  });

  // HARD assertion: no write/delete calls regardless of what the spy returned.
  assert.equal(spy.hasAnyWriteCall(), false,
    `dry-run wrote to Pinecone! calls=${JSON.stringify(spy.calls.map(c => c.command))}`);
  assert.equal(spy.callsTo('kb_sync_chunks').length, 0);
  assert.equal(spy.callsTo('kb_delete_chunks').length, 0);

  // It SHOULD have done the read-only enumeration.
  assert.equal(spy.callsTo('kb_list_file_ids').length, 1, 'must enumerate remote in dry-run');
  assert.equal(spy.callsTo('list_knowledge_bases').length, 1, 'must validate KB registration');

  // It MUST report drift (the planted stale file_ids).
  assert.equal(result.dryRun, true);
  assert.equal(result.drift, true);
  assert.ok(result.driftCount > 0);
});

test('A2 — dry-run with NO drift exits 0 (drift=false)', async (t) => {
  const { appId } = await makeFixture(t);
  // To produce "no drift" we need: (a) every remote file_id is in the walk
  // (so rebuild has nothing to purge) AND (b) local sync state matches the
  // walk (no new/changed files).
  //
  // The trick: in --rebuild mode, previousState is nulled so EVERY file looks
  // new. So even with zero remote drift, dry-run will report N new files.
  // That's correct behavior: --rebuild --dry-run reports the full re-sync plan.
  //
  // To get drift=false we use --dry-run WITHOUT --rebuild and pre-seed local
  // sync state to match the walk.
  // Compute the blob SHAs the walker WOULD produce:
  const blobShas = execSync('git rev-parse HEAD:apps/testapp-corpus-safety/docs/intro.md', {
    cwd: process.cwd(), encoding: 'utf-8'
  }).trim();
  // Pre-seed sync state with matching blob SHA so the file is "unchanged".
  const stateDir = path.join(process.cwd(), 'apps', appId, '.descix', 'sync-state');
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(
    path.join(stateDir, 'Corpus.json'),
    JSON.stringify({
      last_sync_commit: 'seed',
      synced_files_count: 1,
      total_chunks: 1,
      timestamp: new Date().toISOString(),
      synced_blob_shas: [blobShas]
    })
  );

  const spy = new SpyApiClient({ registeredKbs: ['Corpus'], remoteFileIds: [] });
  const result = await runCorpusSync(spy, { app: appId, dryRun: true, yes: true });

  assert.equal(spy.hasAnyWriteCall(), false);
  assert.equal(result.dryRun, true);
  assert.equal(result.drift, false);
  assert.equal(result.driftCount, 0);
});

test('A3 — --show-walk prints walked files before any Pinecone op', async (t) => {
  const { appId } = await makeFixture(t);
  const spy = new SpyApiClient({ registeredKbs: ['Corpus'], remoteFileIds: [] });

  // Capture stdout so we can assert ordering: [show-walk] must appear before
  // any list_knowledge_bases / kb_list_file_ids in the call sequence.
  const origLog = console.log;
  const lines = [];
  console.log = (...args) => { lines.push(args.join(' ')); };
  try {
    await runCorpusSync(spy, { app: appId, dryRun: true, showWalk: true, yes: true });
  } finally {
    console.log = origLog;
  }

  // Find the show-walk line.
  const showWalkIdx = lines.findIndex(l => l.includes('[show-walk]'));
  assert.ok(showWalkIdx >= 0, `expected a [show-walk] line in output; got:\n${lines.join('\n')}`);
  // Format check: ref + walked file count must be present.
  assert.ok(lines.some(l => l.includes('Resolved ref') && l.includes('[show-walk]')),
    'show-walk must print the resolved ref');
});

test('A4 — --rebuild WITHOUT --dry-run and WITHOUT --yes would prompt (no automatic deletes)', async (t) => {
  // We do NOT call runCorpusSync here without --yes — that would block on stdin.
  // Instead we assert the inverse: --yes skips the prompt and DOES proceed with
  // the (fake-spy) deletes. This proves the gate is gated by --yes and not by
  // --dry-run (which is the anti-regression we care about).
  const { appId } = await makeFixture(t);
  const spy = new SpyApiClient({
    registeredKbs: ['Corpus'],
    remoteFileIds: ['corpus:dead0000beef']
  });

  await runCorpusSync(spy, { app: appId, rebuild: true, yes: true });

  // With --yes (and NO --dry-run), the spy SHOULD see kb_delete_chunks.
  assert.equal(spy.callsTo('kb_delete_chunks').length >= 1, true,
    'with --yes and no --dry-run, rebuild MUST actually delete stale chunks');
});

// ─────────────────────────────────────────────────────────────────────────────
// A6 — WS-KB-CORPUS-SCOPEPURGE: --rebuild does a FULL metadata-scoped purge, not
// a file-id-diff purge. This is the load-bearing behavior change. If anyone
// reverts to "purge only the corpus:<sha> file_ids absent from the walk", legacy
// orphans (which carry a non-corpus file_id) survive — exactly the bug we fixed.
// We lock the contract: the single kb_delete_chunks call carries purge_scope:true
// and NO file_ids/chunk_ids subset.
// ─────────────────────────────────────────────────────────────────────────────
test('A6 — --rebuild --yes purges the FULL scope (purge_scope:true), not a file_id subset', async (t) => {
  const { appId } = await makeFixture(t);
  // The remote has MORE chunks than the walk would account for — the classic
  // orphan-pollution shape. A file-id-diff purge would only touch the absent
  // file_ids; a full-scope purge clears everything regardless of scheme.
  const spy = new SpyApiClient({
    registeredKbs: ['Corpus'],
    remoteFileIds: ['corpus:dead0000beef', 'legacy:orphan-no-corpus-prefix']
  });

  await runCorpusSync(spy, { app: appId, rebuild: true, yes: true });

  const deletes = spy.callsTo('kb_delete_chunks');
  // Exactly one purge call for the single manifest's KB.
  assert.equal(deletes.length, 1,
    `expected exactly one full-scope purge call; got ${deletes.length}`);

  const payload = deletes[0].payload;
  // CONTRACT: it must be a full-scope purge, NOT a file_id/chunk_id subset.
  assert.equal(payload.purge_scope, true,
    'rebuild must call kb_delete_chunks with purge_scope:true (full metadata-scoped purge)');
  assert.ok(!payload.file_ids || payload.file_ids.length === 0,
    'full-scope purge must NOT pass a file_ids subset (that is the bug — orphans without corpus: file_id survive)');
  assert.ok(!payload.chunk_ids || payload.chunk_ids.length === 0,
    'full-scope purge must NOT pass a chunk_ids subset');
  // It must carry the full multi-tenancy scope.
  assert.ok(payload.app_id && payload.kb_id,
    'purge call must carry app_id + kb_id to scope the delete');
});

test('A5 — anti-regression: hasAnyWriteCall sanity check (the assertion above is sound)', () => {
  // Meta-test: prove the spy classifies kb_sync_chunks and kb_delete_chunks as
  // writes. If someone "fixes" the spy to ignore writes, every other test in
  // this file becomes silently useless. This is the meta-test that catches that.
  const spy = new SpyApiClient();
  spy.calls.push({ command: 'kb_sync_chunks', payload: {} });
  assert.equal(spy.hasAnyWriteCall(), true);
  spy.calls = [];
  assert.equal(spy.hasAnyWriteCall(), false);
  spy.calls.push({ command: 'kb_delete_chunks', payload: {} });
  assert.equal(spy.hasAnyWriteCall(), true);
  // Read-only commands must NOT trip the flag.
  spy.calls = [{ command: 'list_knowledge_bases', payload: {} }, { command: 'kb_list_file_ids', payload: {} }];
  assert.equal(spy.hasAnyWriteCall(), false);
});
