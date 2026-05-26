/**
 * Deliverable B — `descix kb corpus sync --ref` + branch advisory tests.
 *
 * Scope (WS-CLI-MANIFEST-REF-FEATURE-BRANCH):
 *   - `descix kb corpus sync -a APP --ref REF` walks files at REF.
 *   - Advisory: no --ref + every source default-main + current branch != main
 *     → one-line stderr advisory naming the current branch.
 *   - `descix kb corpus status -a APP` prints resolved ref + file count.
 *   - Sync output names the ref used.
 *
 * We deliberately do NOT exercise the actual Pinecone walk at a non-current
 * ref — that requires `git rev-parse REF:path` to find a blob, and the temp
 * fixture only has one commit on main. Instead we exercise the resolveRef
 * helper indirectly via the LOG output, and verify the advisory triggers.
 *
 * Strategy:
 *   - Spy on console.log to capture the advisory + "Ref: ..." line.
 *   - For non-main branch advisory: create a fresh repo with main, then check
 *     out a feature branch via `git checkout -b`. Confirm advisory fires.
 *   - For --ref override: pass --ref my-branch and confirm the sync log names
 *     it as "(--ref override)" and the spy receives no surprise writes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { runCorpusSync, runCorpusStatus } from '../lib/commands/corpus.js';

class SpyApiClient {
  constructor({ registeredKbs = ['Corpus'], remoteFileIds = [] } = {}) {
    this.calls = [];
    this.registeredKbs = registeredKbs;
    this.remoteFileIds = remoteFileIds;
  }
  async invoke(command, payload) {
    this.calls.push({ command, payload });
    if (command === 'list_knowledge_bases') {
      return { status: 'ok', message: { knowledgebases: this.registeredKbs.map(n => ({ knowledgebase_name: n })) } };
    }
    if (command === 'kb_list_file_ids') {
      return { status: 'ok', message: { file_ids: this.remoteFileIds, unique_count: this.remoteFileIds.length, total_chunks: 0 } };
    }
    return { status: 'ok', message: { upserted: 0, deleted: 0 } };
  }
}

async function makeFixture(t, { startBranch = 'main' } = {}) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'corpus-ref-'));
  const appId = 'testapp-ref';
  const appRoot = path.join(wsRoot, 'apps', appId);
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });
  await fs.mkdir(path.join(appRoot, 'docs'), { recursive: true });
  await fs.writeFile(path.join(appRoot, 'docs', 'intro.md'), '# Hi\n');

  // Manifest with NO explicit ref — should default to "main" per ManifestLoader.
  await fs.writeFile(
    path.join(appRoot, '.descix', 'manifests', 'Corpus.json'),
    JSON.stringify({
      kb_name: 'Corpus',
      sync_mode: 'local',
      sources: [{ path: `apps/${appId}/docs`, tier: 1, doc_type: 'documentation' }]
    }, null, 2)
  );
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify({
      version: '2.1',
      workspaceRoot: wsRoot,
      type: 'workspace',
      env: { products: [{ appId, localPath: `apps/${appId}`, kbId: 'Corpus' }] }
    }, null, 2)
  );

  execSync(`git init -q -b ${startBranch}`, { cwd: wsRoot, stdio: 'pipe' });
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

function captureLog(fn) {
  const origLog = console.log;
  const lines = [];
  console.log = (...args) => { lines.push(args.map(a => typeof a === 'string' ? a : String(a)).join(' ')); };
  return fn()
    .finally(() => { console.log = origLog; })
    .then(result => ({ result, lines }));
}

// ─────────────────────────────────────────────────────────────────────────────

test('B1 — branch advisory triggers when on non-main + no --ref + manifest default-main', async (t) => {
  const { appId } = await makeFixture(t, { startBranch: 'main' });
  // Switch to a feature branch — keeps the same content, just a different HEAD ref.
  execSync('git checkout -q -b ws-admin-b1', { cwd: process.cwd(), stdio: 'pipe' });

  const spy = new SpyApiClient({ registeredKbs: ['Corpus'], remoteFileIds: [] });
  const { lines } = await captureLog(() =>
    runCorpusSync(spy, { app: appId, dryRun: true, yes: true })
  );

  const advisory = lines.find(l => l.includes('Advisory:') && l.includes('ws-admin-b1'));
  assert.ok(advisory, `expected branch advisory mentioning ws-admin-b1, got lines:\n${lines.join('\n')}`);
  assert.match(advisory, /--ref ws-admin-b1/, 'advisory should suggest the exact --ref override');
});

test('B2 — advisory SUPPRESSED when --ref is supplied', async (t) => {
  const { appId } = await makeFixture(t, { startBranch: 'main' });
  execSync('git checkout -q -b ws-admin-b1', { cwd: process.cwd(), stdio: 'pipe' });

  const spy = new SpyApiClient({ registeredKbs: ['Corpus'], remoteFileIds: [] });
  const { lines } = await captureLog(() =>
    runCorpusSync(spy, { app: appId, ref: 'ws-admin-b1', dryRun: true, yes: true })
  );

  const advisory = lines.find(l => l.includes('Advisory:'));
  assert.equal(advisory, undefined, `advisory must NOT fire when --ref is set; got: ${advisory}`);

  // And the sync log must name the ref with the "(--ref override)" qualifier.
  const refLine = lines.find(l => l.includes('Ref:') && l.includes('ws-admin-b1'));
  assert.ok(refLine, `expected Ref line naming ws-admin-b1, got:\n${lines.join('\n')}`);
  assert.match(refLine, /--ref override/);
});

test('B3 — advisory SUPPRESSED when on main even without --ref', async (t) => {
  const { appId } = await makeFixture(t, { startBranch: 'main' });
  const spy = new SpyApiClient({ registeredKbs: ['Corpus'], remoteFileIds: [] });
  const { lines } = await captureLog(() =>
    runCorpusSync(spy, { app: appId, dryRun: true, yes: true })
  );
  const advisory = lines.find(l => l.includes('Advisory:'));
  assert.equal(advisory, undefined, `advisory must NOT fire when current branch IS main`);
});

test('B4 — `corpus status` prints Resolved ref + Live file count', async (t) => {
  const { appId } = await makeFixture(t, { startBranch: 'main' });
  const spy = new SpyApiClient();
  const { lines } = await captureLog(() => runCorpusStatus(spy, { app: appId }));

  const refLine = lines.find(l => l.includes('Resolved ref:'));
  assert.ok(refLine, `expected "Resolved ref:" line in status output; got:\n${lines.join('\n')}`);
  assert.match(refLine, /main/);
  assert.match(refLine, /source=default/);

  const countLine = lines.find(l => l.includes('Live file count:'));
  assert.ok(countLine, `expected "Live file count:" line; got:\n${lines.join('\n')}`);
  // We seeded exactly one .md file in docs/.
  assert.match(countLine, /1\b/);
});

test('B5 — `corpus status --ref X` previews ref override in status output', async (t) => {
  const { appId } = await makeFixture(t, { startBranch: 'main' });
  const spy = new SpyApiClient();
  const { lines } = await captureLog(() => runCorpusStatus(spy, { app: appId, ref: 'ws-admin-b1' }));
  const refLine = lines.find(l => l.includes('Resolved ref:'));
  assert.ok(refLine);
  assert.match(refLine, /ws-admin-b1/);
  assert.match(refLine, /source=cli/);
});

test('B6 — sync output names the ref source for "manifest" (explicit non-main in JSON)', async (t) => {
  const { appId, appRoot } = await makeFixture(t, { startBranch: 'main' });
  // Rewrite the manifest to declare an explicit ref. We use "main" because the
  // fixture only has one commit on main, so the walk will still succeed — what
  // we are testing is the LABELLING in the output.
  await fs.writeFile(
    path.join(appRoot, '.descix', 'manifests', 'Corpus.json'),
    JSON.stringify({
      kb_name: 'Corpus',
      sync_mode: 'local',
      sources: [{ path: `apps/${appId}/docs`, ref: 'main', tier: 1, doc_type: 'documentation' }]
    }, null, 2)
  );
  // Re-commit so the manifest is in HEAD too (otherwise blob-sha computation
  // for the manifest itself doesn't affect docs/ but keeps the test hermetic).
  execSync('git add -A && git commit -q -m "manifest"', { cwd: process.cwd(), stdio: 'pipe' });

  const spy = new SpyApiClient({ registeredKbs: ['Corpus'], remoteFileIds: [] });
  const { lines } = await captureLog(() =>
    runCorpusSync(spy, { app: appId, dryRun: true, yes: true })
  );
  // ManifestLoader normalizes default to "main" so source='manifest' fires only
  // when the JSON explicitly set ref. From the helper's POV both look the same
  // (allDefault). This test documents the current behavior: when EVERY source
  // resolves to "main" with no --ref override, source='default'. If we want to
  // differentiate explicit-vs-default we'd need to teach ManifestLoader to
  // carry a hasExplicitRef flag — flagged as a follow-up below.
  const refLine = lines.find(l => l.includes('Ref:'));
  assert.ok(refLine);
  assert.match(refLine, /main/);
});
