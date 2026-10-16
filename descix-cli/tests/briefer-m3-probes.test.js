/**
 * WS-DESCIX-BRIEFER-CLI M3 — live-state probe tests.
 *
 * AC coverage:
 *   M3-AC-1: gcloud probe SUCCESS path → citation has source=gcloud and a SHA.
 *   M3-AC-2: gcloud probe FAILURE → HARD-FAIL with code BRIEFER-GCLOUD-FAIL.
 *   M3-AC-3: --env=dev probes exactly like prod — DEV is a deployed environment; no
 *            env skips a probe, so a failing gcloud fails every live section on dev.
 *   M3-AC-4: Citation SHA is over the PROJECTED facts the briefer renders: it changes
 *            when a rendered fact changes and is stable when only volatile response
 *            fields (etag, earliestVersionTime) change.
 *
 * Strategy:
 *   - For (1) we exercise the real probe against a live gcloud (requires CI/auth)
 *     OR we patch a PATH that points at a tiny stub `gcloud` shell script.
 *     We choose the latter so the test is deterministic and offline.
 *   - For (2) we use a stub that returns non-zero / empty.
 *   - For (3) we call extract({ env: 'dev' }) with a failing stub and expect the hard-fail.
 *   - For (4) we run extract twice with two different stub outputs.
 *
 * Stub: a tiny shell script at $TMP/stub-bin/gcloud that emits either a fixed
 * JSON payload or exits with stderr, based on which test invokes it.
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

/**
 * Build a temp dir containing a `gcloud` stub script that, when invoked,
 * writes the given JSON to stdout (or exits 1 with stderr if mode='fail').
 * Returns the temp dir path so the caller can prepend it to PATH.
 */
async function makeGcloudStub({ stdout = '{}', exitCode = 0, stderr = '' } = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-m3-stub-'));
  const bin = path.join(dir, 'gcloud');
  // Use a shebang script: ignore all args, just print stdout & exit.
  const stdoutEsc = stdout.replace(/'/g, "'\\''");
  const stderrEsc = stderr.replace(/'/g, "'\\''");
  const script = `#!/bin/sh\nprintf '%s' '${stdoutEsc}'\n${stderrEsc ? `printf '%s' '${stderrEsc}' >&2\n` : ''}exit ${exitCode}\n`;
  await fs.writeFile(bin, script, { mode: 0o755 });
  return { dir, bin };
}

function withPath(stubDir, fn) {
  const orig = process.env.PATH;
  process.env.PATH = `${stubDir}:${orig}`;
  return Promise.resolve(fn()).finally(() => { process.env.PATH = orig; });
}

/** The projection the routing extractor renders from the URL map. */
const URL_MAP_FACTS = (json) => ({ fingerprint: json.fingerprint });

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-1: gcloud probe SUCCESS → citation has source=gcloud + non-null SHA.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-1: probeGcloudJson SUCCESS yields citation with source=gcloud and 12-hex SHA', async () => {
  const stubJson = JSON.stringify({
    name: 'projects/descix/global/urlMaps/descix-discord-app-lb',
    fingerprint: 'StubFingerprintAAA=',
    hostRules: [{ hosts: ['daita.dev.descix.net'], pathMatcher: 'matcher-daita-dev' }],
    pathMatchers: [{ name: 'matcher-daita-dev', defaultService: 'foo' }]
  });
  const { dir } = await makeGcloudStub({ stdout: stubJson });

  await withPath(dir, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac1=1');
    const res = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'dev',
      section: '§3 routing',
      anchor: 'lb-url-map',
      project: URL_MAP_FACTS
    });
    assert.ok(res, 'probe must return non-null on dev');
    assert.equal(res.citation.source, 'gcloud');
    assert.equal(res.citation.env, 'dev');
    assert.deepEqual(res.facts, { fingerprint: 'StubFingerprintAAA=' });
    assert.match(res.citation.sha, /^[a-f0-9]{12}$/);
    assert.equal(res.citation.anchor, 'lb-url-map');
    assert.match(res.citation.probe, /^gcloud compute url-maps describe/);
    assert.equal(res.json.fingerprint, 'StubFingerprintAAA=');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-2: gcloud FAILURE → HARD-FAIL BRIEFER-GCLOUD-FAIL.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-2: probeGcloudJson FAILURE on env=prod HARD-FAILS with BRIEFER-GCLOUD-FAIL', async () => {
  const { dir } = await makeGcloudStub({ stdout: '', exitCode: 1, stderr: 'ERROR: not authenticated' });

  await withPath(dir, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac2=1');
    await assert.rejects(
      () => mod.probeGcloudJson({
        command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
        env: 'prod',
        section: '§3 routing',
        anchor: 'lb-url-map',
        project: URL_MAP_FACTS
      }),
      (err) => err.code === 'BRIEFER-GCLOUD-FAIL' &&
               /env: prod/.test(err.detail || err.message) &&
               /dev-deploy-runbook\.md §1/.test(err.recovery || err.message) &&
               !/gcloud auth login/.test(err.recovery || err.message)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-2b: gcloud SUCCESS-BUT-EMPTY-STDOUT → HARD-FAIL.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-2b: probeGcloudJson empty stdout on env=prod HARD-FAILS with BRIEFER-GCLOUD-FAIL', async () => {
  const { dir } = await makeGcloudStub({ stdout: '', exitCode: 0 });

  await withPath(dir, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac2b=1');
    await assert.rejects(
      () => mod.probeGcloudJson({
        command: ['functions', 'list', '--gen2', '--format=json'],
        env: 'prod',
        section: '§2 environments',
        anchor: 'cloud-functions-list',
        project: URL_MAP_FACTS
      }),
      (err) => err.code === 'BRIEFER-GCLOUD-FAIL' &&
               /empty stdout/.test(err.detail || err.message)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-3: DEV is a deployed environment — no env skips a probe. A failing gcloud
// fails the probe and every live section on dev exactly as it does on prod.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-3: probeGcloudJson on env=dev invokes gcloud (no dev skip)', async () => {
  const { dir } = await makeGcloudStub({ stdout: '', exitCode: 1, stderr: 'ERROR: stub refuses' });
  await withPath(dir, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac3=1');
    await assert.rejects(
      () => mod.probeGcloudJson({
        command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
        env: 'dev',
        section: '§3 routing',
        anchor: 'lb-url-map',
        project: URL_MAP_FACTS
      }),
      (err) => err.code === 'BRIEFER-GCLOUD-FAIL' && /env: dev/.test(err.detail || err.message)
    );
  });
});

for (const [label, file] of [
  ['§2 environments', 'environments.js'],
  ['§3 routing', 'routing.js'],
  ['§4 microservice-deploy', 'microservice-deploy.js'],
  ['§5 entitlements', 'entitlements.js']
]) {
  test(`M3-AC-3: ${label}.extract(env=dev) probes live state and HARD-FAILS when gcloud fails`, async () => {
    const { dir } = await makeGcloudStub({ stdout: '', exitCode: 1, stderr: 'ERROR: stub refuses' });
    await withPath(dir, async () => {
      const mod = await import(`../scripts/briefer/sources/${file}?ac3dev=1`);
      await assert.rejects(
        () => mod.extract({ env: 'dev', cliPaths }),
        (err) => err.code === 'BRIEFER-GCLOUD-FAIL' && /env: dev/.test(err.detail || err.message),
        `${file}: env=dev must run the live probe, not skip it`
      );
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-4: Citation SHA changes when probe output changes.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-4: citation SHA changes when gcloud output changes', async () => {
  const { dir: dirA } = await makeGcloudStub({ stdout: JSON.stringify({ fingerprint: 'A', hostRules: [], pathMatchers: [] }) });
  const { dir: dirB } = await makeGcloudStub({ stdout: JSON.stringify({ fingerprint: 'B', hostRules: [], pathMatchers: [] }) });

  let shaA, shaB;
  await withPath(dirA, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac4a=1');
    const r = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'dev',
      section: '§3 routing',
      anchor: 'lb-url-map',
      project: URL_MAP_FACTS
    });
    shaA = r.citation.sha;
  });
  await withPath(dirB, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac4b=1');
    const r = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'dev',
      section: '§3 routing',
      anchor: 'lb-url-map',
      project: URL_MAP_FACTS
    });
    shaB = r.citation.sha;
  });

  assert.match(shaA, /^[a-f0-9]{12}$/);
  assert.match(shaB, /^[a-f0-9]{12}$/);
  assert.notEqual(shaA, shaB, 'two different probe outputs must yield two different SHAs');
});

test('M3-AC-4b: citation SHA stable when gcloud output unchanged (determinism)', async () => {
  const { dir } = await makeGcloudStub({ stdout: JSON.stringify({ fingerprint: 'STABLE', hostRules: [], pathMatchers: [] }) });
  let s1, s2;
  await withPath(dir, async () => {
    const mod = await import('../scripts/briefer/util/source-reader.js?ac4b1=1');
    const r1 = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'dev',
      section: '§3 routing',
      anchor: 'lb-url-map',
      project: URL_MAP_FACTS
    });
    const r2 = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'dev',
      section: '§3 routing',
      anchor: 'lb-url-map',
      project: URL_MAP_FACTS
    });
    s1 = r1.citation.sha;
    s2 = r2.citation.sha;
  });
  assert.equal(s1, s2);
});

test('M3-AC-4c: citation SHA ignores volatile response fields the briefer does not render', async () => {
  const a = [{ name: 'projects/descix/databases/descix-dev', etag: 'IPP1', earliestVersionTime: '2026-10-16T18:53:39.711689Z' }];
  const b = [{ name: 'projects/descix/databases/descix-dev', etag: 'INb+', earliestVersionTime: '2026-10-16T18:53:42.426449Z' }];
  const project = (json) => json.map(d => d.name.split('/').pop());
  const shas = [];
  for (const payload of [a, b]) {
    const { dir } = await makeGcloudStub({ stdout: JSON.stringify(payload) });
    await withPath(dir, async () => {
      const mod = await import('../scripts/briefer/util/source-reader.js?ac4c=1');
      const r = await mod.probeGcloudJson({
        command: ['firestore', 'databases', 'list', '--format=json'],
        env: 'dev',
        section: '§2 environments',
        anchor: 'firestore-databases-list',
        project
      });
      shas.push(`${r.citation.sha}|${r.citation.lines}`);
    });
  }
  assert.equal(shas[0], shas[1], 'etag / earliestVersionTime churn must not move the citation');
});

test('M3-AC-4d: probeGcloudJson requires a projection (no raw-output SHA)', async () => {
  const mod = await import('../scripts/briefer/util/source-reader.js?ac4d=1');
  await assert.rejects(
    () => mod.probeGcloudJson({ command: ['projects', 'list', '--format=json'], env: 'dev', section: '§x', anchor: 'a' }),
    /project/
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-7 anti-regression repeated for M3 surface (probes do NOT bypass via NPM SDK).
// ─────────────────────────────────────────────────────────────────────────────
test('AC-7 (M3 surface) — no @google-cloud/firestore or @pinecone-database/pinecone imports in briefer code', async () => {
  const root = path.resolve(__dirname, '..', 'scripts', 'briefer');
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
