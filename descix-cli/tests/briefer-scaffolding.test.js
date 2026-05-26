/**
 * WS-DESCIX-BRIEFER-CLI M1 — scaffolding tests.
 *
 * Coverage (per M1 AC):
 *  (a) subcommand registration in bin/descix.js
 *  (b) help text surfaces `descix briefer` with the documented flags
 *  (c) error class shape (BrieferExtractorError: code, source, expected, recovery)
 *  (d) extractor scaffolds all import the shared error class and expose SECTION + extract()
 *  (e) failing extractors → known-expected failures with clear messages
 *  (f) AC-7 anti-regression — no @google-cloud/firestore or @pinecone-database/pinecone
 *      direct imports in the briefer/ subtree
 *  (g) stitcher composes a non-empty document with citation trail comments
 *  (h) --help exits 0 (subcommand is wired through commander)
 *
 * Run: `node --test tests/briefer-scaffolding.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_BIN = path.resolve(__dirname, '..', 'bin', 'descix.js');
const BRIEFER_DIR = path.resolve(__dirname, '..', 'lib', 'commands', 'briefer');

// ─────────────────────────────────────────────────────────────────────────────
// (c) — BrieferExtractorError shape
// ─────────────────────────────────────────────────────────────────────────────
test('BrieferExtractorError — valid construction surfaces all fields', async () => {
  const { BrieferExtractorError, BRIEFER_ERROR_CODES } =
    await import('../lib/commands/briefer/errors.js');

  const err = new BrieferExtractorError({
    code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND,
    section: '§3 routing',
    source: 'update-mesh-routing.js:82-202',
    expected: 'ensureServerlessBackend function',
    recovery: 'Re-locate the function and update sources/routing.js'
  });

  assert.equal(err.name, 'BrieferExtractorError');
  assert.equal(err.code, 'BRIEFER-SRC-NOT-FOUND');
  assert.equal(err.section, '§3 routing');
  assert.match(err.message, /BRIEFER-SRC-NOT-FOUND/);
  assert.match(err.message, /update-mesh-routing\.js:82-202/);
  assert.match(err.message, /Re-locate the function/);
});

test('BrieferExtractorError — missing code is itself a hard-fail (no silent default)', async () => {
  const { BrieferExtractorError } = await import('../lib/commands/briefer/errors.js');

  assert.throws(() => {
    new BrieferExtractorError({
      source: 'x',
      expected: 'y',
      recovery: 'z'
      // no code → must throw (per feedback_no-hardcoded-fallbacks)
    });
  }, /requires a valid 'code'/);
});

test('BrieferExtractorError — missing source/expected/recovery all hard-fail', async () => {
  const { BrieferExtractorError, BRIEFER_ERROR_CODES } =
    await import('../lib/commands/briefer/errors.js');

  assert.throws(() => new BrieferExtractorError({
    code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND, expected: 'x', recovery: 'y'
  }), /requires a 'source'/);

  assert.throws(() => new BrieferExtractorError({
    code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND, source: 'x', recovery: 'y'
  }), /requires an 'expected'/);

  assert.throws(() => new BrieferExtractorError({
    code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND, source: 'x', expected: 'y'
  }), /requires a 'recovery'/);
});

test('BRIEFER_ERROR_CODES — all documented codes present and frozen', async () => {
  const { BRIEFER_ERROR_CODES } = await import('../lib/commands/briefer/errors.js');
  const expected = [
    'SRC_NOT_FOUND',
    'GCLOUD_AUTH',
    'PARSE_FAIL',
    'DRIFT_DETECTED',
    'NEGATIVE_CLAIM',
    'FIRESTORE',
    'NOT_IMPLEMENTED'
  ];
  for (const key of expected) {
    assert.ok(key in BRIEFER_ERROR_CODES, `missing code key: ${key}`);
    assert.ok(BRIEFER_ERROR_CODES[key].startsWith('BRIEFER-'), `bad prefix on ${key}`);
  }
  assert.ok(Object.isFrozen(BRIEFER_ERROR_CODES), 'BRIEFER_ERROR_CODES must be frozen');
});

// ─────────────────────────────────────────────────────────────────────────────
// (d) — Extractor scaffolds all conform to the contract
// ─────────────────────────────────────────────────────────────────────────────
const EXPECTED_EXTRACTORS = [
  'identifiers.js',
  'environments.js',
  'routing.js',
  'microservice-deploy.js',
  'entitlements.js',
  'what-is-not.js',
  'canonical-sources.js'
];

test('Extractor scaffolds — all 7 source files exist', async () => {
  for (const f of EXPECTED_EXTRACTORS) {
    const p = path.join(BRIEFER_DIR, 'sources', f);
    const stat = await fs.stat(p);
    assert.ok(stat.isFile(), `${f} must be a file`);
  }
});

test('Extractor scaffolds — each exports SECTION { number, heading, sourceFiles } and extract()', async () => {
  for (const f of EXPECTED_EXTRACTORS) {
    const mod = await import(`../lib/commands/briefer/sources/${f}`);
    assert.ok(mod.SECTION, `${f}: missing SECTION export`);
    assert.equal(typeof mod.SECTION.number, 'number', `${f}: SECTION.number not a number`);
    assert.equal(typeof mod.SECTION.heading, 'string', `${f}: SECTION.heading not a string`);
    assert.ok(Array.isArray(mod.SECTION.sourceFiles), `${f}: SECTION.sourceFiles not array`);
    assert.equal(typeof mod.extract, 'function', `${f}: extract() not a function`);
  }
});

test('Extractor scaffolds — extract() rejects missing env (NOT_IMPLEMENTED hard-fail)', async () => {
  for (const f of EXPECTED_EXTRACTORS) {
    const mod = await import(`../lib/commands/briefer/sources/${f}`);
    await assert.rejects(
      () => mod.extract({}),
      (err) => err.code === 'BRIEFER-NOT-IMPLEMENTED' || err.name === 'BrieferExtractorError',
      `${f}: extract({}) should reject with a BrieferExtractorError`
    );
  }
});

test('Extractor scaffolds — extract({env}) returns {markdown, citations[]}', async () => {
  // M2 extractors actually read source files; provide real cliPaths.
  // routing.js hard-rejects --env=dev (per scope §2.1), so use --env=demo
  // for this contract test. Real gcloud probe is best-effort — extractors
  // tolerate missing gcloud and still return {markdown, citations}.
  const cliPaths = {
    descixCliRoot: path.resolve(__dirname, '..'),
    descixCoreRoot: path.resolve(__dirname, '..', '..'),
    desciXRoot: path.resolve(__dirname, '..', '..', '..'),
    repoRoot: path.resolve(__dirname, '..', '..', '..', '..')
  };
  for (const f of EXPECTED_EXTRACTORS) {
    const mod = await import(`../lib/commands/briefer/sources/${f}`);
    const result = await mod.extract({ env: 'demo', cliPaths });
    assert.equal(typeof result.markdown, 'string', `${f}: markdown not a string`);
    assert.ok(result.markdown.length > 0, `${f}: markdown must be non-empty`);
    assert.ok(Array.isArray(result.citations), `${f}: citations not an array`);
    // Citations may be empty for a section that's purely editorial (rare).
    for (const c of result.citations) {
      // M3 — citations are EITHER code citations (have .file) OR live-state
      // probe citations (have .source = 'gcloud' | 'firestore-rest').
      assert.ok(c.file || c.source, `${f}: citation must have .file or .source`);
      assert.ok(c.lines, `${f}: citation.lines required`);
      assert.ok(c.anchor, `${f}: citation.anchor required`);
      assert.ok('sha' in c, `${f}: citation.sha key required`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// (g) — Stitcher composes a non-empty doc with citation trail
// ─────────────────────────────────────────────────────────────────────────────
test('Stitcher — buildBrieferDoc + stitchBriefer produce a coherent doc', async () => {
  const briefer = await import('../lib/commands/briefer/index.js');
  // M2: real repo paths so extractors can read source files. Use --env=demo
  // because routing.js hard-rejects dev (per scope §2.1).
  const cliPaths = {
    descixCliRoot: path.resolve(__dirname, '..'),
    descixCoreRoot: path.resolve(__dirname, '..', '..'),
    desciXRoot: path.resolve(__dirname, '..', '..', '..'),
    repoRoot: path.resolve(__dirname, '..', '..', '..', '..')
  };
  const doc = await briefer.buildBrieferDoc({
    env: 'demo',
    cliPaths,
    regenBy: 'test'
  });

  assert.equal(doc.env, 'demo');
  assert.equal(doc.sections.length, 7, 'must render all 7 sections');
  assert.match(doc.markdown, /^# DeSciX Platform Must-Know Briefer/);
  assert.match(doc.markdown, /## 1\. Identifiers & invariants/);
  assert.match(doc.markdown, /## 3\. Request routing/);
  assert.match(doc.markdown, /## 7\. Where to look for canonical answers/);
  assert.match(doc.markdown, /## Provenance \/ regeneration history/);
  assert.ok(doc.citationTrail.length > 0, 'citation trail must be non-empty');
  // Every trail entry must include anchor= and EITHER file= (code citation)
  // OR source= (M3 live-state probe citation).
  for (const t of doc.citationTrail) {
    assert.match(t, /(?:file=|source=)/);
    assert.match(t, /anchor=/);
  }
});

test('Stitcher — extractCitationTrail reads only the hidden citations', async () => {
  const { extractCitationTrail } = await import('../lib/commands/briefer/stitcher.js');
  const trail = extractCitationTrail([
    '# Title',
    'Body line.',
    '<!-- briefer-cite: file=foo.js lines=1-10 sha=abc anchor=fn -->',
    'More body.',
    '<!-- briefer-cite: file=bar.js lines=20 sha=def anchor=cls -->'
  ].join('\n'));
  assert.equal(trail.length, 2);
  assert.match(trail[0], /file=foo\.js/);
  assert.match(trail[1], /file=bar\.js/);
});

// ─────────────────────────────────────────────────────────────────────────────
// (b) + (h) — CLI subcommand registration and --help wiring
// ─────────────────────────────────────────────────────────────────────────────
test('CLI — `descix --help` lists the briefer subcommand', async () => {
  const { stdout, code } = await execFileAsync('node', [CLI_BIN, '--help'])
    .then(r => ({ ...r, code: 0 }))
    .catch(e => ({ stdout: e.stdout, stderr: e.stderr, code: e.code }));
  // Commander exits 0 for --help by default.
  assert.equal(code, 0, '--help should exit 0');
  assert.match(stdout, /\bbriefer\b/, '`briefer` must appear in top-level help');
});

test('CLI — `descix briefer --help` shows documented flags', async () => {
  const { stdout } = await execFileAsync('node', [CLI_BIN, 'briefer', '--help']);
  assert.match(stdout, /--env/,   '--env documented');
  assert.match(stdout, /--out/,   '--out documented');
  assert.match(stdout, /--check/, '--check documented');
  assert.match(stdout, /-v.*verbose|--verbose/i, '--verbose documented');
  // Description must reference the briefer's purpose.
  assert.match(stdout, /briefer|drift|gcloud|code-grounded|HARD-FAIL/i,
    'description should reference briefer regen / drift / gcloud / HARD-FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// (f) — Anti-regression: no direct Firestore/Pinecone imports in briefer/
//        (per feedback_never_bypass_platform_api + AC-7)
// ─────────────────────────────────────────────────────────────────────────────
test('AC-7 anti-regression — no direct @google-cloud/firestore or @pinecone-database/pinecone imports in briefer/', async () => {
  async function walk(dir, files = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full, files);
      else if (e.isFile() && full.endsWith('.js')) files.push(full);
    }
    return files;
  }
  const files = await walk(BRIEFER_DIR);
  assert.ok(files.length >= 8, `expected ≥8 JS files in briefer/ tree, got ${files.length}`);
  const offenders = [];
  for (const f of files) {
    const content = await fs.readFile(f, 'utf-8');
    // Match real import/require lines only — not the names appearing in a
    // doc-comment recap (e.g., "NOT @google-cloud/firestore"). The check is:
    // a statement-style `import ... from '@google-cloud/firestore'` or
    // `require('@google-cloud/firestore')`.
    const importRe = /(?:^|\n)\s*(?:import\b[^\n]*from\s*['"]@google-cloud\/firestore['"]|import\b[^\n]*from\s*['"]@pinecone-database\/pinecone['"]|require\s*\(\s*['"]@google-cloud\/firestore['"]\s*\)|require\s*\(\s*['"]@pinecone-database\/pinecone['"]\s*\))/;
    if (importRe.test(content)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `Forbidden direct DB imports in: ${offenders.join(', ')}`);
});
