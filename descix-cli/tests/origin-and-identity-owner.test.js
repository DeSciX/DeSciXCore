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

// ── I1 GATE 3: the literal is GONE from the resolution path (contract A1's own check) ────────
test('GATE I1-no-literal: the production origin appears in no executable line of lib/ or bin/', () => {
    const offenders = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, entry.name);
            if (entry.isDirectory()) { walk(p); continue; }
            if (!entry.name.endsWith('.js')) continue;
            fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
                if (!line.includes(`'${PROD_ORIGIN}'`) && !line.includes(`"${PROD_ORIGIN}"`)) return;
                // Comments are prose ABOUT the defect, not the defect.
                if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
                offenders.push(`${path.relative(CLI_ROOT, p)}:${i + 1}: ${line.trim()}`);
            });
        }
    };
    walk(path.join(CLI_ROOT, 'lib'));
    walk(path.join(CLI_ROOT, 'bin'));

    assert.deepEqual(offenders, [],
        `the production origin is still hardcoded as a value in:\n${offenders.join('\n')}`);
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
