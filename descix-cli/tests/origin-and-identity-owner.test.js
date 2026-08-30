/**
 * GATES for I1 (ORIGIN OWNER) and I2 (IDENTITY OWNER) of
 * contract-ws-devplane-cli-must-not-misreport-itself.
 *
 * THE PROPERTY: no artifact the CLI writes or reports may name an origin, an identity or a
 * version the developer did not choose; a resolver miss FAILS LOUD, never resolves to a literal.
 *
 * HOW TO SHOW THESE GATES CAN FAIL (the negative control — run it, do not take it on trust):
 *
 *     cd descix-cli
 *     git stash push -- lib bin tests            # back to 4441a31, SAME node_modules
 *     node --test tests/origin-and-identity-owner.test.js   # expect: every gate RED
 *     git stash pop
 *     node --test tests/origin-and-identity-owner.test.js   # expect: every gate GREEN
 *
 * The stash toggle is deliberate. A separate baseline WORKTREE cannot run these gates at all:
 * a fresh worktree has no node_modules, `@descix/app-sdk` does not resolve, and the whole suite
 * reports 78 failures that measure nothing but a missing dependency. Toggling in place keeps the
 * resolved dependency graph identical so the only variable is the code under test. Every gate
 * below that touches disk also asserts its fixture actually RAN before it reads any verdict.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(CLI_ROOT, 'bin', 'descix.js');

/** The production origin. Written as parts so this FILE is not a seventh copy of the literal. */
const PROD_ORIGIN = 'https://' + 'descix' + '.net';

function tmpdir(tag) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `gate-${tag}-`));
}

/**
 * FIXTURE PRECONDITION. Doer 1's lesson, adopted verbatim: a fixture that cannot run the CLI
 * measures nothing, however green it goes. Any gate that shells out asserts this FIRST.
 */
function assertFixtureRuns(cwd, env) {
    const probe = execFileSync(process.execPath, [BIN, '--help'], {
        cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.match(probe, /Usage: descix/,
        'FIXTURE INVALID: the CLI did not launch, so nothing this test reports measures the origin path');
}

/** A HOME the developer's real ~/.descix/config.json cannot leak into. */
function isolatedEnv(extra = {}) {
    const home = tmpdir('home');
    const { DESCIX_API_URL, ...rest } = process.env;
    return { ...rest, HOME: home, USERPROFILE: home, ...extra };
}

// ── I1 GATE 1: an unconfigured workspace resolves to the DECLARED default, and SAYS SO ──────
//
// REWRITTEN for (A', contract rev 2). This gate previously asserted `getApiUrl() === null` —
// that the unconfigured case must never yield production. Rev 2 inverted that property:
// CEO-D-2026-08-18 (the shipped default target is PROD) stands, and the defect was never the
// PROD target but the SILENCE around it. So the gate keeps measuring a property; the property
// changed and the assertion changed with it. It is NOT weaker: it now requires BOTH the origin
// AND the declaration, and it goes RED if either is missing.
test('GATE I1-unconfigured-declares-prod: nothing configured resolves to PROD carrying source=default', async () => {
    const { WorkspaceConfig } = await import('../lib/workspace-config.js');
    const { resolveOrigin, DEFAULT_ORIGIN_SOURCE } = await import('../lib/origin.js');
    const dir = tmpdir('i1');
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    const raw = { version: '2.1', type: 'workspace', env: { products: [] } };
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'), JSON.stringify(raw));

    const cfg = new WorkspaceConfig(raw, dir);
    assert.equal(cfg.getApiUrl(), PROD_ORIGIN,
        'an unconfigured workspace must resolve to the DECLARED default (CEO-D-2026-08-18)');

    // The declaration is the half that makes the default honest. Without the source, "chose
    // prod" and "chose nothing" are one observable state again — the original defect.
    const resolved = resolveOrigin({});
    assert.equal(resolved.origin, PROD_ORIGIN);
    assert.equal(resolved.source, DEFAULT_ORIGIN_SOURCE,
        'the resolution must carry the default SOURCE, or nothing downstream can declare it');
    assert.equal(resolved.isDefault, true);
    assert.match(resolved.source, /config init --env dev/,
        'the source must name the command that changes it, in the same breath');

    // And a CONFIGURED origin must not be mislabelled as the default — a gate that only ever
    // saw the default would pass on a resolver that hardcoded `isDefault: true`.
    const chosen = resolveOrigin({ workspaceEnvApiUrl: 'https://dev.descix.net' });
    assert.equal(chosen.isDefault, false);
    assert.notEqual(chosen.source, DEFAULT_ORIGIN_SOURCE);
});

// ── I1 GATE 2: a CONFIGURED-but-invalid origin is LOUD and names the remedy ─────────────────
//
// REWRITTEN for (A', contract rev 2). This gate previously asserted that a resolver MISS throws.
// Under rev 2 a miss is not a failure — it is the declared default. But "the developer typed
// something unusable" still must never be silently swallowed into the default, which would be
// the same defect from the other direction: an origin the developer did not choose. The loud
// path MOVED from the miss to the invalid; it was not removed, and this gate is not weaker.
test('GATE I1-invalid-config-fails-loud: an unusable configured origin throws and names how to fix it', async () => {
    const { resolveOrigin, OriginInvalidError } = await import('../lib/origin.js');

    assert.throws(
        () => resolveOrigin({ workspaceEnvApiUrl: 'not-a-url' }),
        (err) => {
            assert.ok(err instanceof OriginInvalidError, 'must be the typed error, not a bare Error');
            assert.equal(err.code, 'ORIGIN_INVALID');
            assert.match(err.message, /--env/, 'the failure must name the command that fixes it');
            assert.ok(!err.message.includes(PROD_ORIGIN),
                'the failure message must not hand the reader the production origin');
            return true;
        },
    );

    // A non-http scheme is not an origin either — otherwise `file://` or `ftp://` would sail
    // through the URL parser and be handed to axios.
    assert.throws(() => resolveOrigin({ envVar: 'ftp://example.com' }), OriginInvalidError);

    // And it must still RESOLVE when a source names a usable origin — a gate that only ever
    // throws would pass on a module that throws unconditionally.
    assert.deepEqual(
        resolveOrigin({ workspaceEnvApiUrl: 'https://dev.descix.net/' }),
        { origin: 'https://dev.descix.net', source: '.descix/workspace.json env.apiUrl', isDefault: false },
    );
    // Precedence is part of the contract: the most explicit source wins.
    assert.equal(
        resolveOrigin({ envVar: 'https://a.example', workspaceEnvApiUrl: 'https://b.example' }).origin,
        'https://a.example',
    );
    // An INVALID value in a higher-precedence source must not be skipped over in favour of a
    // valid lower one. Skipping is how a typo silently retargets a developer's whole session.
    assert.throws(
        () => resolveOrigin({ envVar: 'nonsense', workspaceEnvApiUrl: 'https://dev.descix.net' }),
        OriginInvalidError,
    );
});

// ── I1 GATE 3: nothing in lib/ or bin/ WRITES AN ORIGIN except a reviewed site ──────────────
//
// REBUILT TWICE, and the second rebuild is the one that matters.
//
// V1 matched the quoted token `'https://descix.net'` and skipped comment-looking lines, so it
// asserted SYNTAX rather than the fixture; three live prod origins appended to lib/origin.js as
// a backtick template, a `'https://' + 'descix.net'` concatenation and a `${host}` interpolation
// all ran GREEN. V2 fixed that by allowlisting every LINE CONTAINING THE HOST TOKEN by exact
// content, whatever its syntax.
//
// V2 STILL MISSED THREE LIVE SITES, and this is the lesson: it keyed on ONE HOST STRING,
// `descix.net`. `descix login --dev`, `admin-login --dev` and `quickstart --dev` each WROTE
// `https://localhost:4000` into the workspace — a different literal — so a gate scoped to the
// production host could not see them however carefully its 25 entries were audited. Measured
// 2026-08-30 by this contract's second doer; ruled by DEVPLANE the same hour: **the gate must
// key on "writes an origin", not on one host string. A gate that names one literal cannot see
// a second one.**
//
// So the predicate is now the PROPERTY: a line that assigns an absolute http(s) URL to an
// origin-shaped target (`apiUrl`, `api_url`, `baseUrl`, `origin`, `url`). That catches the
// production literal, the localhost literal, a concatenation, a template and an interpolation
// alike, because all of them have to land in an assignment to be used.
//
// WHAT THIS GATE CANNOT SEE (state the boundary with the verdict, not only in a report):
//   · a write whose VALUE is a named constant (`this.apiUrl = SOME_CONST`) — there is no URL on
//     the line. Covered instead by the BEHAVIOURAL gates above, which read what resolveOrigin
//     actually returns, and by GATE I1-tarball on the packed artifact.
//   · a write assembled across two statements. Same coverage as above.
//   · anything outside lib/ and bin/ — tests and templates are not shipped code.
//   · an ALREADY-allowlisted line duplicated within its own file; the key is `relpath::content`
//     and carries no line number. Relocation to a DIFFERENT file IS caught.
const ORIGIN_WRITE = /(apiUrl|api_url|baseUrl|origin|url)\s*[:=]\s*[^;]*(https?:\/\/|`https?:)/i;

const ALLOWED_ORIGIN_WRITES = new Set([
    // PROVENANCE — read this before trusting the seven entries below.
    //
    // WHO AUDITED THESE, AND HOW: this contract's SECOND doer (identity-DEVPLANE-CLI-DOER), on
    // 2026-08-30, while rebuilding this gate from the host-string form to the property form.
    // THIS IS A SINGLE-PARTY AUDIT AND IS NOT INDEPENDENT. It does NOT inherit the two-party
    // attestation the previous allowlist carried at ee62cb6: that audit was of a DIFFERENT
    // predicate over a DIFFERENT line set, and carrying its assurance across would claim more
    // than the record can show. The distinct verifier for this contract has not re-audited
    // these; when it does, that is a second audit and belongs here as one.
    //
    // The STRINGS below were generated from the scan, so they cannot be mistranscribed. The
    // REASONS were written by hand, one per line, after reading each site. That split is
    // deliberate: a fully generated list passes by construction and carries no assurance, while
    // a hand-typed list fails on invisible whitespace. The assurance is in the reasons.
    //
    // Tally: 7 entries. THREE construct a non-DeSciX address (Google Firestore, GitHub, a health
    // probe target). TWO are placeholder prose inside help/remediation text. TWO write a real
    // DeSciX origin, and BOTH are reached only after the developer explicitly named it.
    // NONE is a fallback on a resolver miss. NONE writes an origin nobody chose.

    // Google Firestore's REST endpoint, used by the briefer's source reader. A third-party
    // service address, not a DeSciX API origin — the developer never chooses it.
    'lib/commands/briefer/util/source-reader.js::const url = `https://firestore.googleapis.com/v1/projects/descix/databases/${dbPath}${qs}`;',
    // `descix health` probe target. `host` is parameterised by the --env the developer passed;
    // probing that host IS the command, not a fallback for an unset origin.
    'lib/commands/health.js::const url = `https://${host}/`;',
    // A git remote for corpus sync. github.com is not an API origin.
    'lib/core/CorpusWalker.js::const remoteUrl = `https://github.com/${repo}.git`;',
    // PLACEHOLDER PROSE inside ORIGIN_REMEDY. The `https://...` is a literal ellipsis shown to a
    // human; it cannot resolve to an origin.
    "lib/origin.js::'  export DESCIX_API_URL=https://...       (this shell only)';",
    // The interactive setup wizard, reached ONLY after the developer picks "Local Development
    // (localhost:4000)" from a menu (lib/wizard/setup.js:221). A menu selection is the developer
    // naming an origin — the opposite of the silent default this contract removed.
    "lib/wizard/setup.js::apiUrl = 'https://localhost:4000';",
    // `config set-env <custom-name>`: reached ONLY when a developer TYPES an environment name
    // that is not dev/demo/prod, so the host derives from the name they chose. An explicit
    // --url still wins via the `apiUrl ||`.
    'lib/workspace-config.js::resolvedUrl = apiUrl || `https://${normalized}.descix.net`;',
    // PLACEHOLDER PROSE in a remediation hint. `<env>` is not substituted; the string cannot
    // resolve to an origin.
    'bin/descix.js::`Site deploys target a cloud env — pass --env=<dev|demo|prod> or export DESCIX_API_URL=https://<env>.descix.net\\n`',
]);

test('GATE I1-no-origin-write: every line in lib/ + bin/ that writes an origin is a reviewed one', () => {
    const found = [];
    let scannedFiles = 0, scannedLines = 0;
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) { walk(full); continue; }
            if (!entry.name.endsWith('.js')) continue;
            scannedFiles++;
            const rel = path.relative(CLI_ROOT, full);
            for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
                scannedLines++;
                const t = line.trim();
                // Comments cannot write anything. This is safe HERE, unlike in the V1 gate,
                // because the predicate requires an ASSIGNMENT: prose about an assignment does
                // not assign. A comment that happens to contain `apiUrl = 'https://...'` is
                // documentation, and the behavioural gates cover the executing path regardless.
                if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue;
                if (ORIGIN_WRITE.test(line)) found.push(`${rel}::${t}`);
            }
        }
    };
    walk(path.join(CLI_ROOT, 'lib'));
    walk(path.join(CLI_ROOT, 'bin'));

    // FIXTURE PRECONDITION: if the walk read nothing, every assertion below is vacuous.
    assert.ok(scannedFiles > 20 && scannedLines > 5000,
        `FIXTURE INVALID: scanned only ${scannedFiles} files / ${scannedLines} lines`);

    const unreviewed = found.filter((f) => !ALLOWED_ORIGIN_WRITES.has(f));
    assert.deepEqual(unreviewed, [],
        'these lines WRITE an origin and are not in ALLOWED_ORIGIN_WRITES. Each is either a ' +
        'defect (an origin the developer did not choose) or needs an entry with its own audited ' +
        'reason:\n  ' + unreviewed.join('\n  '));

    // The allowlist must not rot: an entry for a line that no longer exists is a stale blessing
    // that would silently cover a future line with the same content.
    const stale = [...ALLOWED_ORIGIN_WRITES].filter((a) => !found.includes(a));
    assert.deepEqual(stale, [], `ALLOWED_ORIGIN_WRITES has entries matching nothing in the tree:\n  ${stale.join('\n  ')}`);

    // COVERAGE BOUNDARY, printed on GREEN as well as RED (served doer obligation, 2026-08-27).
    console.error(
        `[GATE I1-no-origin-write] compared ${found.length} origin-writing line(s) across ` +
        `${scannedFiles} files / ${scannedLines} lines in lib/ + bin/ against ` +
        `${ALLOWED_ORIGIN_WRITES.size} reviewed entries. CATCHES: any new line assigning an ` +
        `http(s) URL to an origin-shaped target, in any syntax, for ANY host. DOES NOT READ: ` +
        `writes whose value is a named constant or assembled across statements, anything ` +
        `outside lib/ + bin/, or the PACKED artifact (GATE I1-tarball reads that). RUN BY: ` +
        `npm test in descix-cli. Single-party audit — see the provenance block.`,
    );
});

// ── I2 GATE 4: the writer STORES the community it was given ──────────────────────────────────
test('GATE I2-writer-stores-community: init records the community id it was passed', async () => {
    const { initWorkspace } = await import('../lib/commands/init.js');
    const dir = tmpdir('i2w');

    const res = await initWorkspace({ path: dir, communityId: 'egpt', appName: 'godsworld' });
    assert.ok(res?.created?.includes('.descix/workspace.json'),
        'FIXTURE INVALID: initWorkspace wrote no workspace.json, so nothing below measures it');

    const ws = JSON.parse(fs.readFileSync(path.join(dir, '.descix/workspace.json'), 'utf8'));
    const product = ws.env.products[0];
    assert.equal(product.appId, 'godsworld');
    assert.equal(product.communityId, 'egpt',
        'registerApp() accepted a communityId and discarded it — the workspace records no community');
});

// ── I2 GATE 5: the generated agent files name the DEVELOPER, not a placeholder ───────────────
//
// AMENDED for (A', rev 2). This gate used to assert the files contain NO production origin.
// Under (A') a workspace that configured no origin legitimately resolves to PROD, so that
// assertion inverted. What it measures instead is the property that actually matters and that
// the old assertion was standing in for: the files name the origin the resolver ACTUALLY
// returned — never a placeholder, and never an origin that contradicts the configuration. The
// second fixture is what makes it discriminate: a generator that simply hardcoded the prod
// origin would pass the first fixture and FAIL the second.
test('GATE I2-agent-files-name-the-developer: real ids, no my-app, and the RESOLVED origin', async () => {
    const { initWorkspace } = await import('../lib/commands/init.js');
    const generated = ['CLAUDE.md', '.cursorrules', '.clinerules', '.github/copilot-instructions.md'];

    // FIXTURE A — nothing configured. The resolved origin is the declared default, PROD.
    const dirA = tmpdir('i2a');
    const resA = await initWorkspace({ path: dirA, communityId: 'egpt', appName: 'godsworld' });
    for (const f of generated) {
        assert.ok(resA.created.includes(f), `FIXTURE INVALID: ${f} was not generated, so it measures nothing`);
    }
    for (const f of generated) {
        const text = fs.readFileSync(path.join(dirA, f), 'utf8');
        assert.ok(!text.includes('my-app'),
            `${f} names the placeholder app "my-app" instead of the developer's app`);
        assert.match(text, /godsworld/, `${f} does not name the developer's actual app`);
        assert.match(text, /egpt/, `${f} does not name the developer's actual community`);
        assert.ok(text.includes(PROD_ORIGIN),
            `${f} does not name the origin this workspace actually resolves to (the declared default)`);
    }

    // FIXTURE B — an origin IS configured, and it is not production. The files must follow the
    // configuration. Without this half the gate could not tell a correct generator from one
    // that writes the prod origin unconditionally.
    const dirB = tmpdir('i2b');
    const prior = process.env.DESCIX_API_URL;
    process.env.DESCIX_API_URL = 'https://dev.descix.net';
    try {
        const resB = await initWorkspace({ path: dirB, communityId: 'egpt', appName: 'godsworld' });
        for (const f of generated) {
            assert.ok(resB.created.includes(f), `FIXTURE INVALID: ${f} was not generated in fixture B`);
        }
        for (const f of generated) {
            const text = fs.readFileSync(path.join(dirB, f), 'utf8');
            assert.ok(text.includes('https://dev.descix.net'),
                `${f} does not name the DEV origin this workspace was pointed at`);
            assert.ok(!text.includes(PROD_ORIGIN),
                `${f} names the PRODUCTION origin although this workspace was pointed at DEV — ` +
                'the generator is not reading the resolved origin');
        }
    } finally {
        if (prior === undefined) delete process.env.DESCIX_API_URL;
        else process.env.DESCIX_API_URL = prior;
    }
});

// ── I2 GATE 6: an unnameable identity REFUSES rather than inventing one ──────────────────────
test('GATE I2-identity-fails-loud: agent files are refused, not fabricated, when ids are absent', async () => {
    const { generateAgentFiles } = await import('../lib/agent-files.js');
    const dir = tmpdir('i2f');
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    // A workspace that names NO app and NO community.
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'),
        JSON.stringify({ version: '2.1', type: 'workspace', env: { products: [] } }));

    await assert.rejects(
        () => generateAgentFiles(dir),
        (err) => {
            assert.match(err.message, /app id|community id/i, 'the refusal must name what was missing');
            return true;
        },
        'generateAgentFiles invented an identity instead of refusing',
    );

    assert.ok(!fs.existsSync(path.join(dir, 'CLAUDE.md')),
        'a CLAUDE.md was written despite the workspace naming no app — it can only contain fabricated facts');
});

// ── I1 GATE 7: the EXECUTING CLI, not the source, refuses an unconfigured origin ─────────────
test('GATE I1-executing-cli-refuses: a real invocation with nothing configured names the remedy', () => {
    const dir = tmpdir('i1x');
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'),
        JSON.stringify({ version: '2.1', type: 'workspace', env: { products: [] } }));
    const env = isolatedEnv();

    assertFixtureRuns(dir, env);

    // `config init` with no environment named must refuse. It used to write PRODUCTION.
    let out = '', failed = false;
    try {
        out = execFileSync(process.execPath, [BIN, 'config', 'init'], {
            cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (e) {
        failed = true;
        out = `${e.stdout || ''}${e.stderr || ''}`;
    }

    assert.ok(failed, `\`descix config init\` with no environment succeeded. Output:\n${out}`);
    assert.match(out, /--env/, 'the refusal must name the flag that fixes it');

    const ws = JSON.parse(fs.readFileSync(path.join(dir, '.descix/workspace.json'), 'utf8'));
    assert.ok(!JSON.stringify(ws).includes(PROD_ORIGIN),
        'a refused `config init` still wrote the PRODUCTION origin into workspace.json');
});

// ── I1 GATE 8: the PACKED ARTIFACT, not the checkout, is what ships ──────────────────────────
//
// Contract A1 asks for a grep of the PACKED TARBALL. My first pass verified only the checkout,
// and verifier acb71771 found the difference mattered: `bin/descix.js` shipped an --option help
// string reading "(default https://descix.net)" while the real default had become
// `apiClient.baseUrl`. A comment-skipping source scan walked past it because it looked like
// prose. The published CLI reported a production origin the developer never chose, in its own
// --help. This gate reads the artifact.
test('GATE I1-tarball: the packed artifact resolves the prod origin only in prose', { timeout: 120000 }, () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-pack-'));
    execFileSync('npm', ['pack', '--pack-destination', out], {
        cwd: CLI_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    const tgz = fs.readdirSync(out).find((f) => f.endsWith('.tgz'));
    assert.ok(tgz, 'FIXTURE INVALID: npm pack produced no tarball, so nothing here measures the artifact');
    execFileSync('tar', ['xzf', tgz], { cwd: out, stdio: ['ignore', 'pipe', 'pipe'] });

    const offenders = [];
    let scanned = 0;
    const walk = (dir) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, entry.name);
            if (entry.isDirectory()) { walk(p); continue; }
            if (!entry.name.endsWith('.js')) continue;
            scanned++;
            fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
                if (!line.includes(PROD_ORIGIN)) return;
                // Prose ABOUT the removed defect is allowed; a value is not. This is the ONLY
                // place a comment check is legitimate, because the allowlist gate above already
                // covers every syntax that could reconstruct the origin from parts.
                if (/^\s*(\/\/|\*|\/\*)/.test(line.trim()) || line.trim().startsWith('*')) return;
                offenders.push(`${path.relative(out, p)}:${i + 1}: ${line.trim()}`);
            });
        }
    };
    walk(path.join(out, 'package', 'lib'));
    walk(path.join(out, 'package', 'bin'));

    assert.ok(scanned > 50,
        `FIXTURE INVALID: only ${scanned} packed .js files scanned — the tarball did not extract as expected`);
    assert.deepEqual(offenders, [],
        `the PUBLISHED artifact states the production origin as a value:\n${offenders.join('\n')}`);

    fs.rmSync(out, { recursive: true, force: true });
});

// ── I1 GATE 9: the EXECUTING CLI PRINTS the environment it resolved — SILENCE IS RED ─────────
//
// This is (A')'s other half and the reason the PROD default is allowed to stand. CEO-D
// 2026-08-18 (the shipped default target is PROD) was never the defect; the defect was that
// 1.0.1 hit production SILENTLY, so "the developer chose prod" and "the developer chose
// nothing" were one observable state. The default is legitimate ONLY because it is declared.
//
// WHY THIS GATE CAN FAIL, which is the only thing that makes it a gate: it asserts the presence
// of a line on stderr of a REAL invocation. Delete the reportEnvironment() call in
// api-client.js::initialize() and both halves go RED — measured on a tamper, twice, 2026-08-30;
// the tamper was asserted present in the file before the RED was read.
//
// It runs the SHIPPED binary rather than importing the module, because the print is only
// correct if it survives the whole command path — the seam it hangs off (initialize(), not
// detectApiUrl()) was chosen precisely because six construction sites bypass detectApiUrl.
test('GATE I1-prints-resolved-env: every network-bound invocation declares env + origin + source', () => {
    const { DEFAULT_ORIGIN_SOURCE } = { DEFAULT_ORIGIN_SOURCE: 'default' }; // substring only

    // ── A: nothing configured. The line must say prod, AND say it came from the default. ──
    const dirA = tmpdir('i1p');
    fs.mkdirSync(path.join(dirA, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dirA, '.descix/workspace.json'),
        JSON.stringify({ version: '2.1', type: 'workspace', env: { products: [] } }));
    const envA = isolatedEnv();
    assertFixtureRuns(dirA, envA);

    let errA = '';
    try {
        execFileSync(process.execPath, [BIN, 'credits', 'balance'], {
            cwd: dirA, env: envA, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (e) { errA = String(e.stderr || ''); }

    assert.match(errA, /^env: /m,
        'SILENCE. A network-bound command printed no env line at all — this is the 1.0.1 defect ' +
        `(a silent origin), and it is what this gate exists to catch. stderr was:\n${errA}`);
    assert.match(errA, /env: prod \(/, 'the line must name the ENVIRONMENT it resolved');
    assert.ok(errA.includes(DEFAULT_ORIGIN_SOURCE),
        'the line must name the SOURCE as the default — without it, "chose prod" and "chose ' +
        'nothing" are one observable state again, which is the whole defect');
    assert.ok(errA.includes(PROD_ORIGIN), 'the line must name the ORIGIN, not only the env name');
    assert.match(errA, /config init --env dev/,
        'the default line must name the command that changes it, in the same breath');

    // ── B: an origin IS configured, and it is not prod. The line must follow it. ──
    // This half is what proves the print is not a hardcoded string: a `console.error("env: prod
    // (default...)")` would pass A and fail B.
    const dirB = tmpdir('i1p2');
    fs.mkdirSync(path.join(dirB, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dirB, '.descix/workspace.json'), JSON.stringify({
        version: '2.1', type: 'workspace', env: { products: [], apiUrl: 'https://dev.descix.net' },
    }));
    const envB = isolatedEnv();
    assertFixtureRuns(dirB, envB);

    let errB = '';
    try {
        execFileSync(process.execPath, [BIN, 'credits', 'balance'], {
            cwd: dirB, env: envB, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (e) { errB = String(e.stderr || ''); }

    assert.match(errB, /^env: /m, `SILENCE on a configured workspace. stderr was:\n${errB}`);
    assert.match(errB, /env: dev \(/, 'a workspace pointed at DEV must not print prod');
    assert.ok(errB.includes('https://dev.descix.net'), 'the line must name the configured origin');
    assert.ok(!errB.includes(DEFAULT_ORIGIN_SOURCE),
        'a CONFIGURED origin must not be reported as the default — that mislabels the ' +
        "developer's own choice as something they did not make");
    assert.ok(errB.includes('workspace.json'), 'the line must name WHICH source supplied it');

    // ── C: the print goes to stderr, never stdout. stdout is a data channel under --json and ──
    // the protocol channel for the MCP stdio server; a status line there corrupts both.
    let outC = '';
    try {
        outC = execFileSync(process.execPath, [BIN, 'credits', 'balance'], {
            cwd: dirA, env: envA, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        });
    } catch (e) { outC = String(e.stdout || ''); }
    assert.ok(!outC.includes('env: prod'),
        'the env line reached STDOUT, which corrupts --json output and the MCP stdio protocol');

    console.error(
        '[GATE I1-prints-resolved-env] compared the stderr of REAL `descix credits balance` ' +
        'invocations in 2 workspace fixtures (unconfigured, dev-configured) plus a stdout-purity ' +
        'check. CATCHES: a missing env line, a hardcoded one, a mislabelled source, and the line ' +
        'landing on stdout. DOES NOT READ: authenticated command paths, the packed tarball, or ' +
        'commands that exit before touching the api-client. RUN BY: npm test in descix-cli.',
    );
});
