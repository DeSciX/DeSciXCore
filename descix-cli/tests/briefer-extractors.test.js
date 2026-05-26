/**
 * WS-DESCIX-BRIEFER-CLI M2 — extractor tests.
 *
 * Coverage focuses on the two highest-scrutiny extractors per the audit:
 *   - identifiers.js (§1) — domain pattern + GCS path + model-resolver
 *   - routing.js     (§3) — path-rule construction + LB wiring
 *
 * AC coverage:
 *   AC-4: Removing or moving the host-pattern construct in
 *         update-mesh-routing.js:120 makes routing.js HARD-FAIL with a clear
 *         error.
 *   AC-5: Tests cover at least the routing and identifiers extractors.
 *   AC-3 partial: routing.js --env=dev is rejected with a clear message.
 *
 * Run: `node --test tests/briefer-extractors.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const cliPaths = {
  descixCliRoot: path.resolve(__dirname, '..'),
  descixCoreRoot: path.resolve(__dirname, '..', '..'),
  desciXRoot: path.resolve(__dirname, '..', '..', '..'),
  repoRoot: REPO_ROOT
};

// ─────────────────────────────────────────────────────────────────────────────
// §1 identifiers.js
// ─────────────────────────────────────────────────────────────────────────────

test('identifiers.extract({env, cliPaths}) returns code-grounded markdown + non-null SHAs', async () => {
  const mod = await import('../lib/commands/briefer/sources/identifiers.js');
  const result = await mod.extract({ env: 'demo', cliPaths });
  assert.ok(result.markdown.length > 500, 'markdown should be substantial');
  // The host pattern from update-mesh-routing.js:120 must appear verbatim
  // (or close to it) in the rendered markdown.
  assert.match(result.markdown, /const host = env === 'prod'/);
  // The GCS path pattern must appear.
  assert.match(result.markdown, /const pathPrefix = `\/\$\{env\}\/\$\{app\}\/site`/);
  // The agentic-app invariant must appear.
  assert.match(result.markdown, /Apps are the central unit/);
  // The model resolver must appear.
  assert.match(result.markdown, /resolveModelName/);
  // Every citation must have a non-null 12-char SHA.
  assert.ok(result.citations.length >= 4, 'identifiers should emit ≥4 citations');
  for (const c of result.citations) {
    assert.ok(c.sha, `citation.sha missing for ${c.file}`);
    assert.match(c.sha, /^[a-f0-9]{12}$/, `citation.sha not a 12-char hex: ${c.sha}`);
  }
});

test('identifiers.extract HARD-FAILS with BRIEFER-SRC-NOT-FOUND if the source moves', async () => {
  const mod = await import('../lib/commands/briefer/sources/identifiers.js');
  // Point cliPaths at a non-existent root.
  const badPaths = { ...cliPaths, repoRoot: '/nonexistent-briefer-test-root' };
  await assert.rejects(
    () => mod.extract({ env: 'demo', cliPaths: badPaths }),
    (err) => err.code === 'BRIEFER-SRC-NOT-FOUND' && /update-mesh-routing\.js/.test(err.source || err.message)
  );
});

test('identifiers.extract HARD-FAILS with PARSE_FAIL if the host construct moves outside the expected line range', async () => {
  // Build a temp fake repo where update-mesh-routing.js has the host pattern
  // at line 9999 (way outside the expected [100, 140] slack range).
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-m2-'));
  const meshPath = path.join(tmp, 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy');
  await fs.mkdir(meshPath, { recursive: true });
  const padded = Array(200).fill('// pad').join('\n') +
    "\nconst host = env === 'prod' ? `${app}.descix.net` : `${app}.${env}.descix.net`;\n" +
    "const pathPrefix = `/${env}/${app}/site`;\n";
  await fs.writeFile(path.join(meshPath, 'update-mesh-routing.js'), padded);
  // ALSO create the other source files identifiers expects (hydrate, gemini,
  // beast record) so we isolate the PARSE_FAIL signal to the host pattern.
  // Copy the real files into the fake root so they DO resolve.
  const realRoot = REPO_ROOT;
  for (const rel of [
    'DeSciX/DeSciX_Core/descix-platform-api/src/entitlements/index.js',
    'DeSciX/DeSciX_Cloud/microservice/services/geminiInteractions.js',
    'apps/unk-beast/kb/Org/agentic-app-invariant-2026-05-26.jsonl'
  ]) {
    const dst = path.join(tmp, rel);
    await fs.mkdir(path.dirname(dst), { recursive: true });
    await fs.copyFile(path.join(realRoot, rel), dst);
  }

  const mod = await import('../lib/commands/briefer/sources/identifiers.js');
  await assert.rejects(
    () => mod.extract({ env: 'demo', cliPaths: { ...cliPaths, repoRoot: tmp } }),
    (err) => err.code === 'BRIEFER-PARSE-FAIL' &&
             /host pattern/.test(err.source || err.message)
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// §3 routing.js
// ─────────────────────────────────────────────────────────────────────────────

test('routing.extract({env=demo}) returns code-grounded markdown with verbatim pathRules', async () => {
  const mod = await import('../lib/commands/briefer/sources/routing.js');
  const result = await mod.extract({ env: 'demo', cliPaths });
  assert.ok(result.markdown.length > 500);
  // The verbatim pathRules block must appear.
  assert.match(result.markdown, /const pathRules = \[/);
  assert.match(result.markdown, /proxyToExternalService/);
  assert.match(result.markdown, /No runtime "Gateway" middleware/);
  // Citations: all non-null SHAs.
  for (const c of result.citations) {
    assert.ok(c.sha, `citation.sha missing for ${c.file}`);
    assert.match(c.sha, /^[a-f0-9]{12}$/);
  }
});

test('routing.extract HARD-REJECTS --env=dev (per scope §2.1 — DEV has no LB URL map)', async () => {
  const mod = await import('../lib/commands/briefer/sources/routing.js');
  await assert.rejects(
    () => mod.extract({ env: 'dev', cliPaths }),
    (err) => err.code === 'BRIEFER-PARSE-FAIL' &&
             /DEV has no LB URL map/.test(err.recovery || err.message)
  );
});

test('routing.extract HARD-FAILS if ensureServerlessBackend is missing from update-mesh-routing.js (AC-4)', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-m2-routing-'));
  const meshPath = path.join(tmp, 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy');
  await fs.mkdir(meshPath, { recursive: true });
  // A mesh-routing.js without the ensureServerlessBackend function.
  const broken = [
    '// stripped of ensureServerlessBackend',
    'const ENV_CONFIG = { prod: {}, demo: {}, dev: {} };',
    Array(120).fill('//').join('\n'),
    "const host = env === 'prod' ? 'x' : 'y';",
    'const pathPrefix = `/${env}/${app}/site`;',
    'const pathRules = [];'
  ].join('\n');
  await fs.writeFile(path.join(meshPath, 'update-mesh-routing.js'), broken);

  const mod = await import('../lib/commands/briefer/sources/routing.js');
  await assert.rejects(
    () => mod.extract({ env: 'demo', cliPaths: { ...cliPaths, repoRoot: tmp } }),
    (err) => err.code === 'BRIEFER-SRC-NOT-FOUND' &&
             /ensureServerlessBackend/.test(err.source || err.expected || err.message)
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Citation SHA stability — same content yields same SHA
// ─────────────────────────────────────────────────────────────────────────────

test('citation SHAs are deterministic for unchanged source', async () => {
  const mod = await import('../lib/commands/briefer/sources/identifiers.js');
  const r1 = await mod.extract({ env: 'demo', cliPaths });
  const r2 = await mod.extract({ env: 'demo', cliPaths });
  const shas1 = r1.citations.map(c => `${c.file}@${c.lines}@${c.sha}`).sort();
  const shas2 = r2.citations.map(c => `${c.file}@${c.lines}@${c.sha}`).sort();
  assert.deepEqual(shas1, shas2, 'two regens against unchanged source must produce identical SHAs');
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-7 anti-regression repeated for M2 surface (util/ + sources/)
// ─────────────────────────────────────────────────────────────────────────────

test('AC-7 — no @google-cloud/firestore or @pinecone-database/pinecone imports in briefer M2 code', async () => {
  const root = path.resolve(__dirname, '..', 'lib', 'commands', 'briefer');
  // Match REAL import/require statements only — names appearing in doc-comments
  // ("NOT @google-cloud/firestore") are intentional and don't bypass the API.
  const importRe = /(?:^|\n)\s*(?:import\b[^\n]*from\s*['"]@google-cloud\/firestore['"]|import\b[^\n]*from\s*['"]@pinecone-database\/pinecone['"]|require\s*\(\s*['"]@google-cloud\/firestore['"]\s*\)|require\s*\(\s*['"]@pinecone-database\/pinecone['"]\s*\))/;
  const walk = async (dir) => {
    const out = [];
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...await walk(p));
      else if (e.isFile() && p.endsWith('.js')) out.push(p);
    }
    return out;
  };
  const files = await walk(root);
  const offenders = [];
  for (const f of files) {
    const raw = await fs.readFile(f, 'utf-8');
    if (importRe.test(raw)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `Forbidden direct DB imports in: ${offenders.join(', ')}`);
});
