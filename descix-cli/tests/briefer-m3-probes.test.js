/**
 * WS-DESCIX-BRIEFER-CLI M3 — live-state probe tests.
 *
 * AC coverage:
 *   M3-AC-1: gcloud probe SUCCESS path → citation has source=gcloud and a SHA.
 *   M3-AC-2: gcloud probe FAILURE with --env=demo → HARD-FAIL with code BRIEFER-GCLOUD-FAIL.
 *   M3-AC-3: --env=dev → probe is SKIPPED and a "DEV: ... skipped" stanza is emitted.
 *   M3-AC-4: Citation SHA changes when probe output changes (two different mocked
 *            responses → two different SHAs).
 *
 * Strategy:
 *   - For (1) we exercise the real probe against a live gcloud (requires CI/auth)
 *     OR we patch a PATH that points at a tiny stub `gcloud` shell script.
 *     We choose the latter so the test is deterministic and offline.
 *   - For (2) we use a stub that returns non-zero / empty.
 *   - For (3) we just call extract({ env: 'dev' }) and verify the stanza.
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

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-1: gcloud probe SUCCESS → citation has source=gcloud + non-null SHA.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-1: probeGcloudJson SUCCESS yields citation with source=gcloud and 12-hex SHA', async () => {
  const stubJson = JSON.stringify({
    name: 'projects/descix/global/urlMaps/descix-discord-app-lb',
    fingerprint: 'StubFingerprintAAA=',
    hostRules: [{ hosts: ['daita.demo.descix.net'], pathMatcher: 'matcher-daita-demo' }],
    pathMatchers: [{ name: 'matcher-daita-demo', defaultService: 'foo' }]
  });
  const { dir } = await makeGcloudStub({ stdout: stubJson });

  await withPath(dir, async () => {
    const mod = await import('../lib/commands/briefer/util/source-reader.js?ac1=1');
    const res = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'demo',
      section: '§3 routing',
      anchor: 'lb-url-map'
    });
    assert.ok(res, 'probe must return non-null on demo');
    assert.equal(res.citation.source, 'gcloud');
    assert.equal(res.citation.env, 'demo');
    assert.match(res.citation.sha, /^[a-f0-9]{12}$/);
    assert.equal(res.citation.anchor, 'lb-url-map');
    assert.match(res.citation.probe, /^gcloud compute url-maps describe/);
    assert.equal(res.json.fingerprint, 'StubFingerprintAAA=');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-2: gcloud FAILURE with --env=demo → HARD-FAIL BRIEFER-GCLOUD-FAIL.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-2: probeGcloudJson FAILURE on env=demo HARD-FAILS with BRIEFER-GCLOUD-FAIL', async () => {
  const { dir } = await makeGcloudStub({ stdout: '', exitCode: 1, stderr: 'ERROR: not authenticated' });

  await withPath(dir, async () => {
    const mod = await import('../lib/commands/briefer/util/source-reader.js?ac2=1');
    await assert.rejects(
      () => mod.probeGcloudJson({
        command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
        env: 'demo',
        section: '§3 routing',
        anchor: 'lb-url-map'
      }),
      (err) => err.code === 'BRIEFER-GCLOUD-FAIL' &&
               /env: demo/.test(err.detail || err.message) &&
               /gcloud auth login/.test(err.recovery || err.message)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-2b: gcloud SUCCESS-BUT-EMPTY-STDOUT on env=demo → HARD-FAIL.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-2b: probeGcloudJson empty stdout on env=demo HARD-FAILS with BRIEFER-GCLOUD-FAIL', async () => {
  const { dir } = await makeGcloudStub({ stdout: '', exitCode: 0 });

  await withPath(dir, async () => {
    const mod = await import('../lib/commands/briefer/util/source-reader.js?ac2b=1');
    await assert.rejects(
      () => mod.probeGcloudJson({
        command: ['functions', 'list', '--gen2', '--format=json'],
        env: 'demo',
        section: '§2 environments',
        anchor: 'cloud-functions-list'
      }),
      (err) => err.code === 'BRIEFER-GCLOUD-FAIL' &&
               /empty stdout/.test(err.detail || err.message)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-3: --env=dev → probe SKIPPED (returns null), no HARD-FAIL.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-3: probeGcloudJson on env=dev returns null (skipped)', async () => {
  // Even without a stub, env=dev short-circuits BEFORE invoking gcloud.
  const mod = await import('../lib/commands/briefer/util/source-reader.js?ac3=1');
  const res = await mod.probeGcloudJson({
    command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
    env: 'dev',
    section: '§3 routing',
    anchor: 'lb-url-map'
  });
  assert.equal(res, null);
});

test('M3-AC-3b: §2 environments.extract(env=dev) emits "DEV: gcloud probes skipped" stanza', async () => {
  const mod = await import('../lib/commands/briefer/sources/environments.js?ac3b=1');
  const r = await mod.extract({ env: 'dev', cliPaths });
  assert.match(r.markdown, /DEV: gcloud probes skipped/);
  // No probe citations should be present for dev.
  const probeC = r.citations.filter(c => c.source === 'gcloud' || c.source === 'firestore-rest');
  assert.equal(probeC.length, 0, 'no probe citations on dev');
});

test('M3-AC-3c: §4 microservice-deploy.extract(env=dev) emits skipped stanza', async () => {
  const mod = await import('../lib/commands/briefer/sources/microservice-deploy.js?ac3c=1');
  const r = await mod.extract({ env: 'dev', cliPaths });
  assert.match(r.markdown, /DEV: gcloud probes skipped/);
  const probeC = r.citations.filter(c => c.source === 'gcloud' || c.source === 'firestore-rest');
  assert.equal(probeC.length, 0);
});

test('M3-AC-3d: §5 entitlements.extract(env=dev) emits skipped stanza', async () => {
  const mod = await import('../lib/commands/briefer/sources/entitlements.js?ac3d=1');
  const r = await mod.extract({ env: 'dev', cliPaths });
  assert.match(r.markdown, /DEV: Firestore probe skipped/);
  const probeC = r.citations.filter(c => c.source === 'gcloud' || c.source === 'firestore-rest');
  assert.equal(probeC.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// M3-AC-4: Citation SHA changes when probe output changes.
// ─────────────────────────────────────────────────────────────────────────────
test('M3-AC-4: citation SHA changes when gcloud output changes', async () => {
  const { dir: dirA } = await makeGcloudStub({ stdout: JSON.stringify({ fingerprint: 'A', hostRules: [], pathMatchers: [] }) });
  const { dir: dirB } = await makeGcloudStub({ stdout: JSON.stringify({ fingerprint: 'B', hostRules: [], pathMatchers: [] }) });

  let shaA, shaB;
  await withPath(dirA, async () => {
    const mod = await import('../lib/commands/briefer/util/source-reader.js?ac4a=1');
    const r = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'demo',
      section: '§3 routing',
      anchor: 'lb-url-map'
    });
    shaA = r.citation.sha;
  });
  await withPath(dirB, async () => {
    const mod = await import('../lib/commands/briefer/util/source-reader.js?ac4b=1');
    const r = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'demo',
      section: '§3 routing',
      anchor: 'lb-url-map'
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
    const mod = await import('../lib/commands/briefer/util/source-reader.js?ac4b1=1');
    const r1 = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'demo',
      section: '§3 routing',
      anchor: 'lb-url-map'
    });
    const r2 = await mod.probeGcloudJson({
      command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
      env: 'demo',
      section: '§3 routing',
      anchor: 'lb-url-map'
    });
    s1 = r1.citation.sha;
    s2 = r2.citation.sha;
  });
  assert.equal(s1, s2);
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-7 anti-regression repeated for M3 surface (probes do NOT bypass via NPM SDK).
// ─────────────────────────────────────────────────────────────────────────────
test('AC-7 (M3 surface) — no @google-cloud/firestore or @pinecone-database/pinecone imports in briefer code', async () => {
  const root = path.resolve(__dirname, '..', 'lib', 'commands', 'briefer');
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
