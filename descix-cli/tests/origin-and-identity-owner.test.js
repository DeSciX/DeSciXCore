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

// ── I1 GATE 1: an unconfigured workspace must not resolve to production ──────────────────────
test('GATE I1-unconfigured-never-prod: getApiUrl() on a workspace naming no origin is not prod', async () => {
    const { WorkspaceConfig } = await import('../lib/workspace-config.js');
    const dir = tmpdir('i1');
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    const raw = { version: '2.1', type: 'workspace', env: { products: [] } };
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'), JSON.stringify(raw));

    const cfg = new WorkspaceConfig(raw, dir);
    const got = cfg.getApiUrl();

    assert.notEqual(got, PROD_ORIGIN,
        'an unconfigured workspace resolved to the PRODUCTION origin — the developer chose nothing');
    assert.equal(got, null, 'an unconfigured workspace must report null, not any origin');
});

// ── I1 GATE 2: the resolver's miss is LOUD and names the remedy ──────────────────────────────
test('GATE I1-miss-fails-loud: resolveOrigin() throws and names how to fix it', async () => {
    const { resolveOrigin, OriginUnresolvedError } = await import('../lib/origin.js');

    assert.throws(
        () => resolveOrigin({}),
        (err) => {
            assert.ok(err instanceof OriginUnresolvedError, 'must be the typed error, not a bare Error');
            assert.equal(err.code, 'ORIGIN_UNRESOLVED');
            assert.match(err.message, /set-env/, 'the failure must name the command that fixes it');
            assert.ok(!err.message.includes(PROD_ORIGIN),
                'the failure message must not hand the reader the production origin');
            return true;
        },
    );

    // And it must still RESOLVE when a source does name an origin — a gate that only ever
    // throws would pass on a module that throws unconditionally.
    assert.deepEqual(
        resolveOrigin({ workspaceEnvApiUrl: 'https://dev.descix.net/' }),
        { origin: 'https://dev.descix.net', source: '.descix/workspace.json env.apiUrl' },
    );
    // Precedence is part of the contract: the most explicit source wins.
    assert.equal(
        resolveOrigin({ envVar: 'https://a.example', workspaceEnvApiUrl: 'https://b.example' }).origin,
        'https://a.example',
    );
});

// ── I1 GATE 3: the prod origin cannot be RECONSTRUCTED anywhere in lib/ or bin/ ─────────────
//
// This gate was REBUILT after verifier acb71771 defeated its first version. That version matched
// the quoted token `'https://descix.net'` and skipped comment-looking lines, so it asserted
// SYNTAX rather than the fixture. Three live prod origins were appended to lib/origin.js itself
// — a backtick template, `'https://' + 'descix.net'`, and a `${host}` interpolation — and the
// gate ran GREEN. A gate that a two-line concatenation walks past is not a gate.
//
// It now allowlists by exact CONTENT: every line in lib/ and bin/ that names the host token at
// all must appear below, whatever its syntax. A concatenation, a template, or a new literal all
// produce a line that is not in the list, so all of them fail. Adding an entry is a deliberate
// act a reviewer can see in the diff — which is the point.
const ALLOWED_HOST_MENTIONS = new Set([
    // PROVENANCE — read this before trusting the 25 blessings below.
    //
    // This list is HAND-WRITTEN, and it is set-equal to the tree in both directions today: no
    // stale entries, no unlisted lines. That makes it indistinguishable by inspection from a
    // GENERATED list, and a generated allowlist passes by construction and carries no assurance
    // that what it blesses is correct. Its value is prospective — it fails the NEXT unreviewed
    // line — and that value is only real if these 25 were actually read.
    //
    // They were. Audited line by line TWICE and in agreement, 2026-08-29 at commit ee62cb6, by
    // the DOER and the VERIFIER of this contract. (Those two parties ran as SESSION AGENT IDS
    // — the doer as CLI-DOER-2, the verifier as acb71771ea6d95417 — not as served platform
    // identities: `identity-CLI-VERIFIER` returns 0 of 1 on the fabric. Read them as roles,
    // not as registered credentials.)
    //
    //   Tally, agreed by both: 8 comments, 17 non-comment, of which SIX construct a host —
    //   health.js's five prod probe targets at :51,:52,:53,:228,:231 (probing production is
    //   what `descix health --env prod` IS) and workspace-config.js:798's custom-env builder
    //   (reached only when a developer TYPES a custom env name, so the origin is the one they
    //   chose). NO entry blesses an I1 violation: none is a fallback on a resolver MISS, which
    //   is the only thing this contract forbids.
    //
    //   ON THE ORDER OF THE TWO AUDITS: the doer states it completed its classification before
    //   reading the verifier's tally. THAT ORDERING IS THE DOER'S ATTESTATION, NOT A RECORD
    //   FACT — this commit postdates the verifier's first published tally by ~4 minutes, so the
    //   record cannot establish independence, and "two independent audits agreeing" would claim
    //   more than it can show. What the record DOES show is two audits, by different parties,
    //   agreeing at ee62cb6. Every substantive claim above was confirmed by the verifier on its
    //   own measurement. This distinction is the whole point of the flag that produced this
    //   block: it would be absurd to close a finding about a list asserting more assurance than
    //   it can support by asserting more assurance than IT can support, one line lower.
    //
    // Adding an entry means doing that audit for the new line and writing its reason. An entry
    // without a reason is an unaudited blessing wearing an audited one's clothes.
    //
    // WHAT THIS GATE CANNOT SEE (measured by the verifier, recorded so no reader over-trusts it):
    //   - a token split across concatenation ('https://desc' + 'ix.net') defeats ANY line-content
    //     scan. It is covered instead by the BEHAVIOURAL gates: the verifier's control-B tamper
    //     used exactly that form and GATE I1-miss-fails-loud caught it. The two layers cover each
    //     other, which is why both must stay.
    //   - an ALREADY-allowlisted line duplicated within its own file, because the key is
    //     `relpath::content` and carries no line number. Relocation to a DIFFERENT file IS caught.
    // EXAMPLE in help text, and a DEV host. Names no prod origin.
    "bin/descix.js::.argument('<url>', 'Powch origin (e.g. https://powch.dev.descix.net), or \"none\" to remove')",
    // EXAMPLE in help text, and a DEMO host. Names no prod origin.
    "bin/descix.js::.option('--api-url <url>', 'Direct API URL override (e.g., https://demo.descix.net)');",
    // COMMENT. Prose about a literal already removed.
    "bin/descix.js::// The literal this replaced was `${ctx.appId}.descix.net`: the PROD host, scaffolded into",
    // Remediation hint. `<env>` is a PLACEHOLDER — the string cannot resolve to an origin.
    "bin/descix.js::`Site deploys target a cloud env \u2014 pass --env=<dev|demo|prod> or export DESCIX_API_URL=https://<env>.descix.net\\n`",
    // Prose inside a prompt string. Bare host, no scheme, not a resolvable origin.
    "bin/mcp-server.js::'3. **Environment:** \"Should this run against local dev backend (localhost:4000) or hosted API (descix.net)?\"',",
    // briefer DOC GENERATOR: emits prose about the LB host scheme, never an API origin.
    "lib/commands/briefer/sources/environments.js::`- LB host suffix: \\`.{env}.descix.net\\` for DEV/DEMO, \\`.descix.net\\` for PROD`,",
    // briefer DOC GENERATOR: documents the per-app domain pattern.
    "lib/commands/briefer/sources/identifiers.js::`- Domain pattern: \\`{app_id}.{env}.descix.net\\` for DEV/DEMO; \\`{app_id}.descix.net\\` for PROD. \u2014 \\`${MESH_FILE}:${hostMatch.lineNumber}\\``,",
    // briefer DOC GENERATOR: documents the wildcard cert.
    "lib/commands/briefer/sources/identifiers.js::`- Wildcard TLS cert: \\`*.descix.net\\` plus per-env wildcards. ONE cert. No per-app cert provisioning.`,",
    // briefer DOC GENERATOR: documents apex routing.
    "lib/commands/briefer/sources/routing.js::`- Apex singleton (\\`daita\\`): \\`demo.descix.net\\` / \\`descix.net\\` \u2192 GCS \\`/{env}/daita/site/\\` + \\`/apifront\\`, \\`/mcp\\`, \\`/api\\` \u2192 daita broker \u2014 \\`${LB_FILE}:${singletonMatcherMatch.lineNumber}\\``,",
    // briefer DOC GENERATOR: documents peer-host routing.
    "lib/commands/briefer/sources/routing.js::`- Platform peer host (\\`powch.{env}.descix.net\\`): GCS site + \\`/apifront\\`, \\`/mcp\\` \u2192 daita broker; \\`/api/*\\` \u2192 powch NEG`,",
    // briefer DOC GENERATOR: documents the DNS story.
    "lib/commands/briefer/sources/what-is-not.js::`- **No per-app DNS provisioning.** Wildcard \\`*.{env}.descix.net\\` cert + wildcard A record cover all apps. Adding an app does NOT touch DNS.${dnsMatches.length > 0 ? ` _(${dnsMatches.length} \\`gcloud dns\\`/\\`domain-mappings\\` reference(s) detected in deploy scripts \u2014 manually verify these are wildcard-cert touches, not per-app DNS.)_` : ''}`,",
    // EXAMPLE in a validation error, and a DEV host.
    "lib/commands/config.js::throw new Error(`${what} must be an absolute URL (e.g. https://powch.dev.descix.net), got \"${value}\".`);",
    // COMMENT (file header, probe-target prose).
    "lib/commands/health.js::*             powch.descix.net)",
    // COMMENT (file header, probe-target prose).
    "lib/commands/health.js::*             probes against *.demo.descix.net hosts",
    // COMMENT (file header, probe-target prose).
    "lib/commands/health.js::*             probes against the three in-scope hosts (descix.net, egpt.descix.net,",
    // CONSTRUCTS A PROD HOST — deliberate. `descix health --env prod` exists to probe production; the prod host IS the subject of the command, not a fallback for an unset origin.
    "lib/commands/health.js::daita: 'descix.net',",
    // CONSTRUCTS A PROD HOST — deliberate, same reason.
    "lib/commands/health.js::egpt:  'egpt.descix.net',",
    // CONSTRUCTS A PROD HOST — deliberate, same reason.
    "lib/commands/health.js::powch: 'powch.descix.net',",
    // CONSTRUCTS A PROD HOST — deliberate. Probe target for an app not in the table.
    "lib/commands/health.js::return PROD_HOST_BY_APP[appId] || `${appId}.descix.net`;",
    // CONSTRUCTS A HOST — parameterised BY env; yields prod only when the caller asked for prod.
    "lib/commands/health.js::return `${appId}.${env}.descix.net`;",
    // COMMENT. The defect this contract removed, described.
    "lib/origin.js::* `https://descix.net`): the CLI had no representation of \"nobody chose an origin\". Every",
    // COMMENT. Historical install example.
    "lib/wizard/setup.js:://   npm install -g https://app.descix.net/sdk/descix-cli-1.0.0.tgz",
    // COMMENT documenting the line below.
    "lib/workspace-config.js::* For custom envs, uses --url or defaults to https://{name}.descix.net.",
    // CONSTRUCTS AN ORIGIN — deliberate and NOT an I1 violation: reached only when a developer TYPES a custom env name, so the origin is the name they chose. Not a miss-path.
    "lib/workspace-config.js::resolvedUrl = apiUrl || `https://${normalized}.descix.net`;",
    // COMMENT. The defect this contract removed, described.
    "lib/workspace-identity.js::* `'my-app'` and `'https://descix.net'`. The measured result: the four generated",
]);

test('GATE I1-no-literal: every mention of the prod host in lib/ + bin/ is a reviewed one', () => {
    const found = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, entry.name);
            if (entry.isDirectory()) { walk(p); continue; }
            if (!entry.name.endsWith('.js')) continue;
            const rel = path.relative(CLI_ROOT, p);
            fs.readFileSync(p, 'utf8').split('\n').forEach((line) => {
                if (line.includes('descix.net')) found.push(`${rel}::${line.trim()}`);
            });
        }
    };
    walk(path.join(CLI_ROOT, 'lib'));
    walk(path.join(CLI_ROOT, 'bin'));

    const unreviewed = found.filter((f) => !ALLOWED_HOST_MENTIONS.has(f));
    assert.deepEqual(unreviewed, [],
        'These lines name the production host and are not in the reviewed allowlist. If one is ' +
        'legitimate (an example URL, a health probe target, prose) add it explicitly. If it ' +
        'RESOLVES to the production origin at runtime, it is the defect this contract removes:\n' +
        unreviewed.join('\n'));

    // A fixture assertion: the allowlist must actually be exercised. If the walker stopped
    // finding anything (wrong root, changed extension) the filter above would trivially pass.
    assert.ok(found.length >= 20,
        `FIXTURE INVALID: only ${found.length} host mentions scanned — the walker is not reading the tree`);
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
test('GATE I2-agent-files-name-the-developer: no my-app, no prod origin, real ids present', async () => {
    const { initWorkspace } = await import('../lib/commands/init.js');
    const dir = tmpdir('i2a');

    const res = await initWorkspace({ path: dir, communityId: 'egpt', appName: 'godsworld' });
    const generated = ['CLAUDE.md', '.cursorrules', '.clinerules', '.github/copilot-instructions.md'];
    for (const f of generated) {
        assert.ok(res.created.includes(f), `FIXTURE INVALID: ${f} was not generated, so it measures nothing`);
    }

    for (const f of generated) {
        const text = fs.readFileSync(path.join(dir, f), 'utf8');
        assert.ok(!text.includes('my-app'),
            `${f} names the placeholder app "my-app" instead of the developer's app`);
        assert.ok(!text.includes(PROD_ORIGIN),
            `${f} names the PRODUCTION origin, which this workspace never configured`);
        assert.match(text, /godsworld/, `${f} does not name the developer's actual app`);
        assert.match(text, /egpt/, `${f} does not name the developer's actual community`);
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
