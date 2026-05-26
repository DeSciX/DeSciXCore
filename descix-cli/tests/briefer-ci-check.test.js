/**
 * WS-DESCIX-BRIEFER-CLI M5 — CI `--check` gate semantics.
 *
 * The M5 deliverable adds `.github/workflows/briefer-check.yml` as a path-filtered
 * PR gate. The workflow runs `descix briefer --check --env=demo` and fails the
 * PR if the canonical briefer is out of sync with the 6 watched source files:
 *
 *   1. DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js
 *   2. DeSciX/DeSciX_Cloud/microservice/services/apiFront.js
 *   3. DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js
 *   4. DeSciX/DeSciX_Core/descix-cloud-core/src/config.js
 *   5. DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js
 *   6. DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js
 *
 * Test strategy:
 *
 *   (1) `runCheckMode` SYNC path  — canonical equals regen → returns
 *       { drift: false } and does NOT call process.exit.
 *   (2) `runCheckMode` DRIFT path — canonical differs → process.exit(1) +
 *       stderr contains BRIEFER-DRIFT-DETECTED (the error code the GitHub
 *       Actions workflow grep-matches in its annotation).
 *   (3) `runCheckMode` MISSING-CANONICAL path → process.exit(2) + stderr
 *       contains "canonical briefer not found".
 *   (4) Workflow YAML structural integrity — the workflow exists, the paths
 *       filter covers all 6 watched files, and the run step invokes
 *       `briefer --check --env=demo` referencing the SA secret.
 *
 * Tests (1)-(3) use a synthetic BrieferDoc fixture so they're fully hermetic —
 * no gcloud auth, no DeSciX_Cloud tree, no live extractors. The fixture
 * exercises the public contract of runCheckMode (canonical file diff +
 * citation-trail diff) without coupling the test to any extractor's output.
 *
 * Run: `node --test tests/briefer-ci-check.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// process.exit + stream stubs — runCheckMode terminates via process.exit on
// drift / missing canonical. We catch the exit code by throwing from the stub
// (matches the convention M3 tests use for the same reason).
// ─────────────────────────────────────────────────────────────────────────────
async function withConsoleStubs(fn) {
  const realExit = process.exit;
  const realStderrWrite = process.stderr.write.bind(process.stderr);
  const realStdoutWrite = process.stdout.write.bind(process.stdout);
  let exitCode = null;
  const stderrChunks = [];
  const stdoutChunks = [];
  process.exit = (code) => {
    exitCode = code;
    const e = new Error(`__STUB_EXIT__:${code}`);
    e.__stubExit = true;
    e.exitCode = code;
    throw e;
  };
  process.stderr.write = (chunk) => { stderrChunks.push(String(chunk)); return true; };
  process.stdout.write = (chunk) => { stdoutChunks.push(String(chunk)); return true; };
  try {
    let stubExitError = null;
    try {
      await fn({
        getExitCode: () => exitCode,
        getStderr: () => stderrChunks.join(''),
        getStdout: () => stdoutChunks.join('')
      });
    } catch (err) {
      if (!err.__stubExit) throw err;
      stubExitError = err;
    }
    // Tests assert via getExitCode(); the throw is just control-flow.
    return { exitCode, stderr: stderrChunks.join(''), stdout: stdoutChunks.join(''), stubExitError };
  } finally {
    process.exit = realExit;
    process.stderr.write = realStderrWrite;
    process.stdout.write = realStdoutWrite;
  }
}

/**
 * Build a minimal BrieferDoc-shaped fixture. The shape matches the JSDoc
 * @typedef in lib/commands/briefer/index.js and is the contract runCheckMode
 * depends on. Citations are embedded as HTML comments matching the regex in
 * extractCitationTrail().
 */
function makeFixtureDoc({ env = 'demo', extraLine = '' } = {}) {
  const markdown = [
    '# Fixture Briefer',
    `**Env:** ${env}`,
    '',
    '## §1 — Identifiers',
    '- app_id is a globally unique slug.',
    '<!-- briefer-cite: file=DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js lines=120 sha=abc123def456 anchor=host-pattern -->',
    '',
    '## §3 — Routing',
    'Single global URL map.',
    '<!-- briefer-cite: file=DeSciX/DeSciX_Cloud/microservice/services/apiFront.js lines=83-186 sha=789abcdef012 anchor=middleware-order -->',
    extraLine,
    ''
  ].filter(Boolean).join('\n');
  return {
    env,
    mechanism: 'fixture-test',
    regenBy: 'test-suite',
    sections: [],
    markdown,
    citationTrail: [
      '<!-- briefer-cite: file=DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js lines=120 sha=abc123def456 anchor=host-pattern -->',
      '<!-- briefer-cite: file=DeSciX/DeSciX_Cloud/microservice/services/apiFront.js lines=83-186 sha=789abcdef012 anchor=middleware-order -->'
    ]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test (1): sync case — canonical equals regen → in-sync, no exit.
// ─────────────────────────────────────────────────────────────────────────────
test('(1) runCheckMode SYNC: canonical matches regen → drift:false, no process.exit', async () => {
  const { runCheckMode } = await import('../lib/commands/briefer/index.js');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-ci-check-sync-'));
  const outPath = path.join(tmpDir, 'platform-must-know-briefer.md');

  const doc = makeFixtureDoc({ env: 'demo' });
  await fs.writeFile(outPath, doc.markdown, 'utf-8');

  const { exitCode, stdout, stubExitError } = await withConsoleStubs(async () => {
    const result = await runCheckMode({ doc, outPath, verbose: false });
    assert.equal(result.drift, false);
  });

  assert.equal(exitCode, null, 'sync case must not call process.exit');
  assert.equal(stubExitError, null, 'sync case must not throw via exit stub');
  assert.match(stdout, /in sync|no drift detected/i);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test (2): drift case — canonical differs → exit 1 + BRIEFER-DRIFT-DETECTED.
// ─────────────────────────────────────────────────────────────────────────────
test('(2) runCheckMode DRIFT: canonical differs → process.exit(1) + BRIEFER-DRIFT-DETECTED in stderr', async () => {
  const { runCheckMode } = await import('../lib/commands/briefer/index.js');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-ci-check-drift-'));
  const outPath = path.join(tmpDir, 'platform-must-know-briefer.md');

  // Write a canonical that's slightly different from the regen.
  const canonicalDoc = makeFixtureDoc({ env: 'demo', extraLine: '<!-- I am the canonical -->' });
  const regenDoc = makeFixtureDoc({ env: 'demo' });  // no extra line — different from canonical
  await fs.writeFile(outPath, canonicalDoc.markdown, 'utf-8');

  const { exitCode, stderr } = await withConsoleStubs(async () => {
    await runCheckMode({ doc: regenDoc, outPath, verbose: false });
  });

  assert.equal(exitCode, 1, 'drift case must process.exit(1)');
  assert.match(stderr, /BRIEFER-DRIFT-DETECTED/, 'stderr must contain the error code GitHub Actions matches on');
  assert.match(stderr, /Canonical:/, 'stderr must reference the canonical path');
  assert.match(stderr, /Regen length:/, 'stderr must show byte counts for debug');
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test (3): missing canonical → exit 2 + clear error.
// ─────────────────────────────────────────────────────────────────────────────
test('(3) runCheckMode MISSING-CANONICAL: file absent → process.exit(2) + clear stderr', async () => {
  const { runCheckMode } = await import('../lib/commands/briefer/index.js');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-ci-check-missing-'));
  const missingPath = path.join(tmpDir, 'nonexistent.md');

  const doc = makeFixtureDoc({ env: 'demo' });
  const { exitCode, stderr } = await withConsoleStubs(async () => {
    await runCheckMode({ doc, outPath: missingPath, verbose: false });
  });

  assert.equal(exitCode, 2, 'missing-canonical must process.exit(2)');
  assert.match(stderr, /canonical briefer not found/, 'stderr must explain the missing file');
  assert.match(stderr, /descix briefer/, 'stderr must suggest the recovery command');
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test (4): citation-trail drift detection — when the markdown is the same
// BUT the embedded citation SHAs differ, --check still reports drift (the
// invariant scope §3 calls out as "highest scrutiny" for routing).
// ─────────────────────────────────────────────────────────────────────────────
test('(4) runCheckMode DETECTS citation-SHA drift even when prose is unchanged', async () => {
  const { runCheckMode } = await import('../lib/commands/briefer/index.js');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-ci-check-shadrift-'));
  const outPath = path.join(tmpDir, 'platform-must-know-briefer.md');

  // Two docs identical in prose but with one different citation SHA.
  const canon = makeFixtureDoc({ env: 'demo' });
  const regen = {
    ...canon,
    markdown: canon.markdown.replace('sha=abc123def456', 'sha=fff000eee999'),
    citationTrail: canon.citationTrail.map(c => c.replace('sha=abc123def456', 'sha=fff000eee999'))
  };
  await fs.writeFile(outPath, canon.markdown, 'utf-8');

  const { exitCode, stderr } = await withConsoleStubs(async () => {
    await runCheckMode({ doc: regen, outPath, verbose: false });
  });

  assert.equal(exitCode, 1, 'SHA-only drift must process.exit(1)');
  assert.match(stderr, /BRIEFER-DRIFT-DETECTED/);
  assert.match(stderr, /Citation trail drift: YES/, 'stderr must indicate citation-trail drift specifically');
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test (5): workflow YAML structural integrity.
//
// The GitHub Actions workflow IS the gate; if its paths filter drifts away
// from the 6 watched files (someone adds/removes a path), the gate stops
// being meaningful. This test pins:
//   - workflow exists at .github/workflows/briefer-check.yml
//   - all 6 watched files are in the `paths:` filter
//   - workflow runs `briefer --check --env=demo`
//   - workflow references the BRIEFER_CHECK_GCP_SA_KEY secret
// ─────────────────────────────────────────────────────────────────────────────
test('(5) .github/workflows/briefer-check.yml has the canonical paths filter + invokes briefer --check --env=demo', async () => {
  const workflowPath = path.join(REPO_ROOT, '.github', 'workflows', 'briefer-check.yml');
  let raw;
  try {
    raw = await fs.readFile(workflowPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      assert.fail(`Expected workflow at ${workflowPath} — M5 deliverable missing.`);
    }
    throw err;
  }

  const watched = [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Cloud/microservice/services/apiFront.js',
    'DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js',
    'DeSciX/DeSciX_Core/descix-cloud-core/src/config.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js'
  ];
  for (const w of watched) {
    assert.ok(raw.includes(w), `paths filter missing watched file: ${w}`);
  }
  assert.match(raw, /briefer --check --env=demo/, 'workflow must invoke `briefer --check --env=demo`');
  assert.match(raw, /BRIEFER_CHECK_GCP_SA_KEY/, 'workflow must reference BRIEFER_CHECK_GCP_SA_KEY secret');
  assert.match(raw, /google-github-actions\/auth/, 'workflow must use google-github-actions/auth for SA auth');
});
