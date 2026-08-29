/**
 * PUBLISH-BUNDLE GATES — "the CLI must not misreport itself, and must be installable".
 *
 * Contract: contract-ws-devplane-cli-must-not-misreport-itself (I3 VERSION OWNER, and the
 * protocol half of I4 PUBLISHABLE).
 *
 * ── WHY THESE TWO GATES EXIST, measured not assumed ──────────────────────────
 * · PUBLISHED @descix/cli@1.0.1 ships `bin/descix.js:35` = `.version('1.0.0')` while its own
 *   package.json says 1.0.1. The defect has ALREADY shipped once, so a gate that only asserts
 *   "the current literal is right" would have passed on 1.0.1 the day it went out.
 * · The repo declared `"@descix/platform-api": "file:../descix-platform-api"`. A `file:` range
 *   resolves a path that exists on no consumer's machine; publishing it produces a package
 *   nobody can install.
 *
 * ── WHY THE VERSION GATE VARIES THE VERSION ──────────────────────────────────
 * A test pinning the literal '1.0.3' passes on the BROKEN code the moment package.json happens
 * to say 1.0.3 — it asserts a coincidence, not a derivation. So the fixture writes a RANDOM
 * version into a synthetic package root and asserts the CLI's own output FOLLOWS it. A
 * hardcoded `.version('...')` cannot track a version it has never seen, so this predicate
 * discriminates between the two states by construction rather than by luck.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Mirror the dependency trees the CLI resolves against into one flat node_modules.
 *
 * NOT cosmetic. descix-cli resolves `@descix/app-sdk` from the REPO-ROOT node_modules by walking
 * up the directory chain — `descix-cli/node_modules/@descix/` is empty. A fixture in os.tmpdir()
 * has no such parent chain, so a fixture that symlinks only the package-local node_modules cannot
 * launch the CLI at all: it dies with ERR_MODULE_NOT_FOUND before commander ever prints a
 * version. That reads RED, and it is a RED THAT MEASURES NOTHING — the version path never ran.
 * Measured while building this file. Scopes are merged entry-by-entry, package-local winning.
 */
function mirrorNodeModules(sources, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const src of sources) {
        if (!fs.existsSync(src)) continue;
        for (const entry of fs.readdirSync(src)) {
            const from = path.join(src, entry);
            const to = path.join(dest, entry);
            if (entry.startsWith('@')) {
                fs.mkdirSync(to, { recursive: true });
                for (const scoped of fs.readdirSync(from)) {
                    const target = path.join(to, scoped);
                    if (!fs.existsSync(target)) fs.symlinkSync(fs.realpathSync(path.join(from, scoped)), target);
                }
            } else if (!fs.existsSync(to)) {
                fs.symlinkSync(fs.realpathSync(from), to);
            }
        }
    }
}

/** Everything the CLI needs to answer `--version`, with an ARBITRARY version in its manifest. */
function makeVersionFixture(version) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-version-fixture-'));
    fs.cpSync(path.join(PKG_ROOT, 'bin'), path.join(dir, 'bin'), { recursive: true });
    fs.cpSync(path.join(PKG_ROOT, 'lib'), path.join(dir, 'lib'), { recursive: true });

    // Resolution only: the fixture's dependency TREE is the real one, its MANIFEST is synthetic.
    mirrorNodeModules(
        [path.join(PKG_ROOT, 'node_modules'), path.join(PKG_ROOT, '..', 'node_modules')],
        path.join(dir, 'node_modules'),
    );

    const real = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
    const manifest = version === null ? null : { ...real, version };
    if (manifest) fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest, null, 2));

    return dir;
}

/**
 * ASSERT THE FIXTURE CAN EXHIBIT THE FAILURE, before any verdict is read from it.
 * A fixture that cannot launch the CLI produces a RED indistinguishable from a real one.
 */
function assertFixtureRuns(dir) {
    const probe = execFileSync(process.execPath, [path.join(dir, 'bin', 'descix.js'), '--help'], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.match(probe, /Usage: descix/,
        'FIXTURE INVALID: the CLI did not launch in the fixture, so nothing it reports measures the version path');
}

function runVersion(dir) {
    return execFileSync(process.execPath, [path.join(dir, 'bin', 'descix.js'), '--version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}

// ── GATE 1: --version is DERIVED from package.json, not a second literal ─────────────────────
test('GATE version-follows-manifest: --version tracks package.json, on two unrelated versions', () => {
    // Two arbitrary, unrelated versions. If --version were ANY fixed literal, at most one of
    // these could pass; a literal equal to neither fails both. This is the discrimination.
    for (const version of ['9.87.65', '0.0.1-gate-probe']) {
        const dir = makeVersionFixture(version);
        try {
            assertFixtureRuns(dir); // the tamper must land before the verdict is read
            assert.equal(runVersion(dir), version,
                `--version must report the manifest's ${version}, not a literal compiled into bin/descix.js`);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
});

test('GATE version-fails-loud: an unreadable package.json ERRORS, never falls back to a literal', () => {
    const dir = makeVersionFixture(null); // fixture deliberately has NO package.json
    try {
        let threw = false;
        let out = '';
        try {
            out = runVersion(dir);
        } catch (e) {
            threw = true;
            out = `${e.stdout || ''}${e.stderr || ''}`;
        }
        assert.ok(threw, `a version-less package root must FAIL, not print "${out}"`);
        assert.match(out, /version/i, 'the failure must name what could not be determined');
        // The standing rule: no hardcoded fallbacks. A miss must not resolve to any version.
        assert.doesNotMatch(out, /^\d+\.\d+\.\d+\s*$/m,
            'a version-less package root must not emit a version string at all');
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

// ── GATE 2: no @descix dependency may use a local-path protocol ──────────────────────────────
const LOCAL_PROTOCOLS = ['file:', 'link:', 'workspace:', 'portal:'];

/** Exported shape so the predicate is one function, applied to real and fixture manifests alike. */
function localProtocolOffenders(pkg) {
    const offenders = [];
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        for (const [name, range] of Object.entries(pkg[field] || {})) {
            if (!name.startsWith('@descix/')) continue;
            const hit = LOCAL_PROTOCOLS.find((p) => String(range).startsWith(p));
            if (hit) offenders.push(`${field}.${name} = "${range}" (${hit} protocol)`);
        }
    }
    return offenders;
}

test('GATE registry-resolvable: no @descix dependency uses file:/link:/workspace:/portal:', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
    const offenders = localProtocolOffenders(pkg);
    assert.deepEqual(offenders, [],
        `@descix ranges must be registry ranges; a local-path protocol publishes an ` +
        `UNINSTALLABLE package:\n  ${offenders.join('\n  ')}`);
});

test('GATE registry-resolvable NEGATIVE CONTROL: the predicate detects a file: range', () => {
    // The predicate must READ DIFFERENTLY on a manifest that carries the defect. Without this,
    // an empty-deps or mis-scoped predicate would pass the gate above vacuously.
    const offenders = localProtocolOffenders({
        dependencies: { '@descix/platform-api': 'file:../descix-platform-api', '@descix/sdk': '^1.0.0' },
        devDependencies: { 'some-third-party': 'file:../elsewhere' },
    });
    assert.deepEqual(offenders, ['dependencies.@descix/platform-api = "file:../descix-platform-api" (file: protocol)'],
        'the predicate must flag the @descix file: range and ONLY it — third-party and caret ranges are out of scope');
});

// ── GATE 3: a credential records the environment it was obtained against ────────────────────
test('GATE wallet-environment-stamp: the origin decides the environment, and a missing origin throws', async () => {
    const { walletEnvironmentStamp } = await import('../lib/wallet-environment.js');
    const { WorkspaceConfig } = await import('../lib/workspace-config.js');

    // Driven off the canonical ENV_MAP, so this cannot drift from what `--env` resolves.
    for (const [name, entry] of Object.entries(WorkspaceConfig.ENV_MAP)) {
        assert.deepEqual(walletEnvironmentStamp(entry.url), { apiUrl: entry.url, environment: name });
        assert.deepEqual(walletEnvironmentStamp(`${entry.url}/`), { apiUrl: entry.url, environment: name },
            'a trailing slash must not change the environment a credential is stamped with');
    }

    // DISCRIMINATION: dev and prod must not stamp the same. If they did, the field would be
    // decorative and a DEV credential would still be indistinguishable from a PROD one.
    assert.notEqual(
        walletEnvironmentStamp(WorkspaceConfig.ENV_MAP.dev.url).environment,
        walletEnvironmentStamp(WorkspaceConfig.ENV_MAP.prod.url).environment,
    );

    // An origin that is real but unlisted is 'custom' — an honest answer, not an invented one.
    assert.equal(walletEnvironmentStamp('https://localhost:4000').environment, 'custom');

    // No hardcoded fallback: an absent origin is a throw, never a guessed environment.
    assert.throws(() => walletEnvironmentStamp(''), /no origin/);
    assert.throws(() => walletEnvironmentStamp(undefined), /no origin/);
});

// ── COVERAGE BOUNDARY — printed on GREEN as well as RED ──────────────────────────────────────
test('coverage boundary of this file', () => {
    console.log(`
COVERAGE BOUNDARY — what these gates do and do not measure:
  COMPARES : (1) the string \`descix --version\` prints vs the version in the package root's
             package.json, across two synthetic versions and one absent manifest;
             (2) the RANGE TEXT of every @descix/* dependency in this package's manifest.
  CATCHES  : a second version literal anywhere in the --version path; a silent fallback when
             the manifest cannot be read; a file:/link:/workspace:/portal: @descix range.
  DOES NOT READ:
    · whether the declared @descix range is SATISFIABLE on the registry — that is
      scripts/check-prepublish-deps.mjs, and it is expected RED for @descix/platform-api@^1.0.1
      until that package's first publish exists (it is 404 today).
    · whether the npm publish workflow would accept this package AT ALL. It would not:
      .github/workflows/npm-publish.yml refuses \`descix-cli\` BY NAME in "Refuse to publish
      excluded packages", which runs BEFORE the dependency gate. Nothing in this file measures
      that, and nothing in this file should be read as evidence about it.
    · the PUBLISHED tarball. These gates read this checkout; a merge is not a publish.
    · every other self-report the CLI makes (origin, app identity) — other lanes of this contract.
    · whether a REAL login actually WRITES the environment stamp to wallet.json end to end.
      GATE 3 measures the stamp function only. Exercising the two acquisition sites in
      lib/commands/auth.js would require a live device or admin login, which mutates account
      state, so it is deliberately NOT measured here — the consumption at those two call sites
      is asserted by code review, not by this file.
    · that nothing REFUSES a mismatched wallet. Enforcement is out of scope on purpose; the
      field is write-only until every wallet already on disk without it has a migration.
  RUN BY  : \`npm test\` in descix-cli (\`node --test "tests/*.test.js"\`), which globs this
            directory FLATLY — a test in a subdirectory here would never run.
`);
});
