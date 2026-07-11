/**
 * corpus-deny-lint.test.js — Tier-P KB-publishing deny-class lint (K1 + K2).
 *
 * Ratified: CEO-D-2026-07-11-KB-CURATION-RATIFIED.
 * Spec: docs/audit/kb-curation-2026-07-11/redteam-AUDIT.md §"PROPOSED DENY-LINT
 *       PATTERN SET" + docs/design/kb-publishing-model-2026-07-11.md §4.
 *
 * Covers:
 *   - Table over EVERY DENY_PATH_PATTERN: a matching Tier-P source FAILS
 *     assertNoViolations, and (wired through a real fixture sync) NEVER reaches a
 *     Pinecone write (spy.hasAnyWriteCall() === false).
 *   - *.jsonl + lint_exempt:["jsonl-working-log"] PASSES and prints an exemption.
 *   - synced_from_edit: byte-identical copy FAILS; a genuinely edited copy PASSES.
 *   - ManifestLoader: Tier-P doc_class:"manuscript-draft" fails validation;
 *     missing doc_class in a Tier-P manifest fails.
 *   - primary-source without license_basis fails (content #19).
 *
 * Reuses the SpyApiClient (READ_ONLY vs WRITE classification, hasAnyWriteCall)
 * and temp-git-workspace fixture patterns from corpus-rebuild-safety.test.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { runCorpusSync } from '../lib/commands/corpus.js';
import { loadManifest } from '../lib/core/ManifestLoader.js';
import {
  DENY_PATH_PATTERNS,
  lintManifestForDenyClasses,
  assertNoViolations,
} from '../lib/core/CorpusDenyLint.js';

// ── Spy (mirrors corpus-rebuild-safety.test.js) ──────────────────────────────
const WRITE_ENDPOINTS = new Set(['kb_sync_chunks', 'kb_delete_chunks']);

class SpyApiClient {
  constructor({ registeredKbs = ['Pub'], remoteFileIds = [] } = {}) {
    this.calls = [];
    this.registeredKbs = registeredKbs;
    this.remoteFileIds = remoteFileIds;
  }
  async invoke(command, payload) {
    this.calls.push({ command, payload });
    if (WRITE_ENDPOINTS.has(command)) return { status: 'ok', message: { upserted: 0, deleted: 0 } };
    if (command === 'list_knowledge_bases') {
      return { status: 'ok', message: { knowledgebases: this.registeredKbs.map(name => ({ knowledgebase_name: name })) } };
    }
    if (command === 'get_product_context') return { status: 'ok', community_id: payload?.app_id || 'testcommunity' };
    if (command === 'kb_list_file_ids') {
      return { status: 'ok', message: { file_ids: this.remoteFileIds, unique_count: this.remoteFileIds.length, total_chunks: this.remoteFileIds.length * 3 } };
    }
    return { status: 'ok', message: {} };
  }
  callsTo(command) { return this.calls.filter(c => c.command === command); }
  hasAnyWriteCall() { return this.calls.some(c => WRITE_ENDPOINTS.has(c.command)); }
}

// ── Lint-only fixture: write files + manifest, load canonically, return manifest ─
// `files` maps workspace-relative path → string content (or '' for zero-byte).
async function loadLintManifest(t, { manifestObj, files = {} }) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deny-lint-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(wsRoot, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  const mdir = path.join(wsRoot, '.descix', 'manifests');
  await fs.mkdir(mdir, { recursive: true });
  const mfPath = path.join(mdir, `${manifestObj.kb_name}.json`);
  await fs.writeFile(mfPath, JSON.stringify(manifestObj, null, 2));

  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  const manifest = await loadManifest(mfPath, wsRoot);
  return { wsRoot, manifest };
}

// ── Sync fixture: real git workspace + app so runCorpusSync reaches the lint ──
async function makeSyncFixture(t, { manifestObj, files }) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deny-sync-'));
  const appId = 'testapp-deny-lint';
  const appRoot = path.join(wsRoot, 'apps', appId);
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(wsRoot, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  await fs.writeFile(
    path.join(appRoot, '.descix', 'manifests', `${manifestObj.kb_name}.json`),
    JSON.stringify(manifestObj, null, 2)
  );
  const workspace = {
    version: '2.1', workspaceRoot: wsRoot, type: 'workspace',
    env: { products: [{ appId, localPath: `apps/${appId}`, kbId: manifestObj.kb_name }] }
  };
  await fs.writeFile(path.join(wsRoot, '.descix', 'workspace.json'), JSON.stringify(workspace, null, 2));

  execSync('git init -q -b main', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git config user.email "test@test"', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git config user.name "test"', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git add -A', { cwd: wsRoot, stdio: 'pipe' });
  execSync('git commit -q -m seed', { cwd: wsRoot, stdio: 'pipe' });

  const origCwd = process.cwd();
  process.chdir(wsRoot);
  t.after(async () => { process.chdir(origCwd); await fs.rm(wsRoot, { recursive: true, force: true }); });
  return { wsRoot, appRoot, appId };
}

// ── Per-pattern sample paths that trigger each DENY_PATH_PATTERN ──────────────
// (workspace-relative; every one carries a publishable doc_class so it clears
//  ManifestLoader and is caught by the LINT, not by schema validation.)
const PATH_CASES = {
  archive:            'content/archive/note.md',
  'lean-dev':         'Lean/Complexity/Dev/x.md',
  'draft-filename':   'papers/My_DRAFT_paper.md',
  'nature-draft':     'content/Papers/Nature_PeqNP/v3.md',
  'jsonl-working-log':'logs/debate_log.jsonl',
  'dot-claude':       'content/.claude/agents/x.md',
  private:            'content/PRIVATE/secret.md',
  handoff:            'content/HANDOFF_notes.md',
  'test-dump':        'code/tests/foo.md',
  'internal-pm':      'pm/tasks/todo.md',
  'status-file':      'content/STATUS.md',
  'investor-material':'content/Executive_Summary.md',
  'patent-application':'content/Patent_Application.md',
  wip:                'PM/wip/notes.md',
  'zero-byte':        'content/empty.md',
};

// ─────────────────────────────────────────────────────────────────────────────
// K2.1 — Table: EVERY path pattern → assertNoViolations THROWS.
// ─────────────────────────────────────────────────────────────────────────────
for (const pattern of DENY_PATH_PATTERNS) {
  test(`path-pattern #${pattern.id} (${pattern.class}) → deny lint reports a violation`, async (t) => {
    const relPath = PATH_CASES[pattern.class];
    assert.ok(relPath, `no sample path wired for class "${pattern.class}"`);
    const content = pattern.class === 'zero-byte' ? '' : `# doc\n\nBody for ${pattern.class}.\n`;
    const manifestObj = {
      kb_name: 'Pub',
      publish_tier: 'P',
      sources: [{ path: relPath, doc_class: 'guide' }]
    };
    const { wsRoot, manifest } = await loadLintManifest(t, { manifestObj, files: { [relPath]: content } });

    const report = await lintManifestForDenyClasses(manifest, wsRoot);
    assert.ok(
      report.violations.some(v => v.path === relPath),
      `expected a violation for ${relPath} (pattern #${pattern.id}); got ${JSON.stringify(report.violations)}`
    );
    assert.throws(() => assertNoViolations(report), /deny-class lint FAILED/);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// K2.2 — Wired through a real sync, a deny-class Tier-P manifest NEVER writes.
// ─────────────────────────────────────────────────────────────────────────────
test('sync of a Tier-P manifest with an archive source THROWS before any Pinecone write', async (t) => {
  const relPath = `apps/testapp-deny-lint/content/archive/leak.md`;
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: relPath, doc_class: 'guide' }] };
  const { appId } = await makeSyncFixture(t, { manifestObj, files: { [relPath]: '# leak\n\nbody\n' } });
  const spy = new SpyApiClient({ registeredKbs: ['Pub'] });

  await assert.rejects(
    runCorpusSync(spy, { app: appId, yes: true }),
    /deny-class lint FAILED/
  );
  assert.equal(spy.hasAnyWriteCall(), false,
    `deny-class sync wrote to Pinecone! calls=${JSON.stringify(spy.calls.map(c => c.command))}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// K2.3 — *.jsonl + lint_exempt PASSES and prints an exemption.
// ─────────────────────────────────────────────────────────────────────────────
test('*.jsonl with lint_exempt:["jsonl-working-log"] passes and records a printed exemption', async (t) => {
  const relPath = 'logs/debate_log.jsonl';
  const manifestObj = {
    kb_name: 'Pub',
    publish_tier: 'P',
    sources: [{
      path: relPath,
      doc_class: 'debate-record',
      lint_exempt: ['jsonl-working-log'],
      exempt_reason: 'public-record-by-intent, CEO ruling D-KB2 2026-07-11'
    }]
  };
  const { wsRoot, manifest } = await loadLintManifest(t, { manifestObj, files: { [relPath]: '{"x":1}\n' } });

  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.equal(report.violations.length, 0, `expected no violations; got ${JSON.stringify(report.violations)}`);
  assert.doesNotThrow(() => assertNoViolations(report));
  const jsonlExemption = report.exemptions.find(e => e.class === 'jsonl-working-log');
  assert.ok(jsonlExemption, 'expected a jsonl-working-log exemption');
  assert.match(jsonlExemption.line, /EXEMPTED:/);
  assert.match(jsonlExemption.line, /jsonl-working-log/);
  assert.match(jsonlExemption.line, /public-record-by-intent/);
});

// ─────────────────────────────────────────────────────────────────────────────
// K2.4 — synced_from_edit byte-hash: identical FAILS, edited PASSES.
// ─────────────────────────────────────────────────────────────────────────────
test('synced_from_edit: edited copy byte-identical to raw_path FAILS', async (t) => {
  const edited = 'edited/why.md';
  const raw = 'raw/why.md';
  const same = '# Why P=NP\n\nidentical bytes\n';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: edited, doc_class: 'guide', raw_path: raw }] };
  const { wsRoot, manifest } = await loadLintManifest(t, { manifestObj, files: { [edited]: same, [raw]: same } });

  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.ok(report.violations.some(v => /byte-identical/.test(v.reason)),
    `expected a byte-identical violation; got ${JSON.stringify(report.violations)}`);
  assert.throws(() => assertNoViolations(report), /deny-class lint FAILED/);
});

test('synced_from_edit: a genuinely edited copy PASSES', async (t) => {
  const edited = 'edited/why.md';
  const raw = 'raw/why.md';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: edited, doc_class: 'guide', raw_path: raw }] };
  const { wsRoot, manifest } = await loadLintManifest(t, {
    manifestObj,
    files: { [edited]: '# Why P=NP\n\nreviewer-edited copy, header stripped\n', [raw]: '<!-- @[debate_context] load moderator -->\n# Why P=NP\n\nraw\n' }
  });

  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.equal(report.violations.length, 0, `expected no violations; got ${JSON.stringify(report.violations)}`);
  assert.doesNotThrow(() => assertNoViolations(report));
});

// ─────────────────────────────────────────────────────────────────────────────
// K2.5 — content #16: debate-context header with NO raw_path FAILS.
// ─────────────────────────────────────────────────────────────────────────────
test('content #16: @[debate_context] header without raw_path FAILS', async (t) => {
  const relPath = 'guides/WHY.md';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: relPath, doc_class: 'guide' }] };
  const { wsRoot, manifest } = await loadLintManifest(t, {
    manifestObj,
    files: { [relPath]: '<!-- @[debate_context] load pnp-moderator.md -->\n# Why\n\nbody\n' }
  });
  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.ok(report.violations.some(v => v.pattern === '#16'),
    `expected a #16 violation; got ${JSON.stringify(report.violations)}`);
  assert.throws(() => assertNoViolations(report), /deny-class lint FAILED/);
});

// ─────────────────────────────────────────────────────────────────────────────
// K2.6 — content #17: active-draft body marker FAILS.
// ─────────────────────────────────────────────────────────────────────────────
test('content #17: frontmatter status: draft marker in body FAILS', async (t) => {
  const relPath = 'papers/timeline.md';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: relPath, doc_class: 'paper' }] };
  const { wsRoot, manifest } = await loadLintManifest(t, {
    manifestObj,
    files: { [relPath]: '---\nstatus: draft\n---\n# Timeline\n' }
  });
  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.ok(report.violations.some(v => v.pattern === '#17'),
    `expected a #17 violation; got ${JSON.stringify(report.violations)}`);
  assert.throws(() => assertNoViolations(report), /deny-class lint FAILED/);
});

// ─────────────────────────────────────────────────────────────────────────────
// K2.7 — content #18: mailto: in a guide → WARN only (does NOT fail).
// ─────────────────────────────────────────────────────────────────────────────
test('content #18: mailto: in a non-PDF guide is a WARNING, not a violation', async (t) => {
  const relPath = 'papers/quantum.md';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: relPath, doc_class: 'guide' }] };
  const { wsRoot, manifest } = await loadLintManifest(t, {
    manifestObj,
    files: { [relPath]: '# Quantum\n\nBy [Essam](mailto:essam@aspirevc.com)\n' }
  });
  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.equal(report.violations.length, 0, `mailto must not be a violation; got ${JSON.stringify(report.violations)}`);
  assert.ok(report.warnings.some(w => w.pattern === '#18'), 'expected a #18 warning');
  assert.doesNotThrow(() => assertNoViolations(report));
});

// ─────────────────────────────────────────────────────────────────────────────
// K2.8 — content #19: primary-source without license_basis FAILS; with it PASSES.
// ─────────────────────────────────────────────────────────────────────────────
test('content #19: primary-source without license_basis FAILS', async (t) => {
  const relPath = 'sources/jvm-1931.md';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: relPath, doc_class: 'primary-source' }] };
  const { wsRoot, manifest } = await loadLintManifest(t, { manifestObj, files: { [relPath]: '# JvM 1931\n\nprimary source\n' } });
  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.ok(report.violations.some(v => v.pattern === '#19'),
    `expected a #19 violation; got ${JSON.stringify(report.violations)}`);
  assert.throws(() => assertNoViolations(report), /deny-class lint FAILED/);
});

test('content #19: primary-source WITH license_basis PASSES', async (t) => {
  const relPath = 'sources/jvm-1931.md';
  const manifestObj = {
    kb_name: 'Pub', publish_tier: 'P',
    sources: [{ path: relPath, doc_class: 'primary-source', license_basis: 'AMS public-domain, pre-1978' }]
  };
  const { wsRoot, manifest } = await loadLintManifest(t, { manifestObj, files: { [relPath]: '# JvM 1931\n\nprimary source\n' } });
  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.equal(report.violations.length, 0, `expected no violations; got ${JSON.stringify(report.violations)}`);
  assert.doesNotThrow(() => assertNoViolations(report));
});

// ─────────────────────────────────────────────────────────────────────────────
// K1 — ManifestLoader validation for Tier-P doc_class.
// ─────────────────────────────────────────────────────────────────────────────
test('ManifestLoader: Tier-P source with doc_class "manuscript-draft" fails validation', async (t) => {
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: 'x.md', doc_class: 'manuscript-draft' }] };
  await assert.rejects(
    loadLintManifest(t, { manifestObj, files: { 'x.md': '# x\n' } }),
    /doc_class "manuscript-draft" is a deny-class/
  );
});

test('ManifestLoader: Tier-P source missing doc_class fails validation', async (t) => {
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: 'x.md' }] };
  await assert.rejects(
    loadLintManifest(t, { manifestObj, files: { 'x.md': '# x\n' } }),
    /requires a doc_class/
  );
});

test('ManifestLoader: Tier-P source with a non-publishable doc_class fails validation', async (t) => {
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: 'x.md', doc_class: 'not-a-real-class' }] };
  await assert.rejects(
    loadLintManifest(t, { manifestObj, files: { 'x.md': '# x\n' } }),
    /is not a publishable class/
  );
});

test('ManifestLoader: a non-Tier-P (default "I") manifest needs no doc_class and skips the lint gate', async (t) => {
  const manifestObj = { kb_name: 'Internal', sources: [{ path: 'content/archive/note.md' }] };
  const { manifest } = await loadLintManifest(t, { manifestObj, files: { 'content/archive/note.md': '# note\n' } });
  assert.equal(manifest.publish_tier, 'I', 'publish_tier defaults to "I"');
});

test('ManifestLoader: invalid publish_tier value fails validation', async (t) => {
  const manifestObj = { kb_name: 'Pub', publish_tier: 'Z', sources: [{ path: 'x.md', doc_class: 'guide' }] };
  await assert.rejects(
    loadLintManifest(t, { manifestObj, files: { 'x.md': '# x\n' } }),
    /publish_tier must be one of/
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// K1 — pattern #9 README exclusion: a *_README.md inside tests/ is NOT denied.
// ─────────────────────────────────────────────────────────────────────────────
test('pattern #9: a named *_README.md summary inside tests/ is EXCLUDED (no violation)', async (t) => {
  const relPath = 'code/tests/RET_README.md';
  const manifestObj = { kb_name: 'Pub', publish_tier: 'P', sources: [{ path: relPath, doc_class: 'guide' }] };
  const { wsRoot, manifest } = await loadLintManifest(t, { manifestObj, files: { [relPath]: '# RET summary\n' } });
  const report = await lintManifestForDenyClasses(manifest, wsRoot);
  assert.equal(report.violations.length, 0, `*_README.md summary must be excluded; got ${JSON.stringify(report.violations)}`);
  assert.doesNotThrow(() => assertNoViolations(report));
});
