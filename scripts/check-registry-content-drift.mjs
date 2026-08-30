#!/usr/bin/env node
/**
 * check-registry-content-drift.mjs
 *
 * A REPO VERSION THAT EQUALS A PUBLISHED VERSION MUST HAVE THE SAME CONTENT.
 * This is served==built for npm: what a consumer INSTALLS must be the code we BUILT.
 *
 * WHY THIS GATE EXISTS, AND WHY THE OBVIOUS GATE DID NOT CATCH IT. The acceptance row this
 * replaces said "no file:/link: dependencies". That was the INSTRUMENT, and by 2026-08-30 it was
 * fully satisfied: descix-cli declared clean semver ranges for every @descix package. The
 * PROPERTY it existed to protect had failed anyway — @descix/platform-api was published as 1.0.1
 * and the repo then moved on WITHOUT changing the version, so `^1.0.1` resolved to a tarball
 * whose two SSOT files (src/fabric/vocab.js, src/mcp-tools/nativeTools.js) no longer matched the
 * source they were built from. "No file: deps" cannot see that. Only content can.
 *
 * WHAT MAKES IT INVISIBLE OTHERWISE: the one consumer we verify continuously — the Cloud
 * microservice — depends on platform-api through a `file:` link, so it always reads the repo
 * source and is STRUCTURALLY INCAPABLE of exhibiting this bug. Every served==built proof that
 * runs through that link is silent about the registry. The consumers that DO hit it are the CLI
 * (bin/mcp-server.js imports NATIVE_MCP_TOOLS and validateToolParams from the registry copy) and
 * every microservice a developer scaffolds from the shipped template.
 *
 * HOW IT DECIDES, and why it never trusts a version string: for each package in the publish set
 * it asks the REGISTRY which versions exist. If the repo's version is not among them there is
 * nothing to collide with and it says so. If it IS among them, it packs BOTH — `npm pack` on the
 * working tree and `npm pack <name>@<version>` from the registry — and compares every shipped
 * file by SHA-256. Same version + different bytes is a RELEASE DEFECT.
 *
 * THE PUBLISH SET IS NOT LISTED HERE. It is read from its owner, the workflow's
 * `workflow_dispatch` options (scripts/publish-set.mjs), so this gate cannot drift out of sync
 * with what we actually publish.
 *
 * COVERAGE BOUNDARY, printed with the verdict:
 *   · It compares the repo tree against the registry. It says NOTHING about whether the registry
 *     copy matches the git tag it claims, and nothing about provenance attestations.
 *   · A package whose repo version is UNPUBLISHED is reported OK — correctly, there is no
 *     collision — but that is not a statement that its next publish will be sound.
 *   · It needs the network. An unreachable registry is exit 2, never a pass — and because it
 *     now runs in CI, an outage fails the build rather than passing it. That is the intended
 *     trade: "I could not measure" must never be reported as "clean".
 *   · IT RUNS AUTOMATICALLY. .github/workflows/ci-gates.yml runs it on every push and pull
 *     request, with nothing swallowing its exit status. It was a human-run script until
 *     2026-08-30; that is no longer true and this line changed with the fact.
 *
 * USAGE:  node scripts/check-registry-content-drift.mjs [--json]
 * EXIT :  0 no drift · 1 drift found · 2 could not measure (never a silent pass)
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflowPublishSets, WORKFLOW_PATH } from './publish-set.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const die = (m) => { console.error(`check-registry-content-drift: ${m}`); process.exit(2); };

/** Every shipped file -> sha256, from an extracted tarball's package/ directory. */
function hashTree(root) {
    const out = new Map();
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) { walk(p); continue; }
            out.set(path.relative(root, p), crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
        }
    };
    walk(root);
    return out;
}

/** Pack something (a directory, or a registry spec) and return its hashed file tree. */
function packAndHash(spec, cwd) {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-'));
    try {
        execFileSync('npm', ['pack', spec, '--pack-destination', out],
            { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        die(`npm pack ${spec} failed: ${(e.stderr || e.message).toString().trim().split('\n').pop()}`);
    }
    const tgz = fs.readdirSync(out).find((f) => f.endsWith('.tgz'));
    if (!tgz) die(`npm pack ${spec} produced no tarball`);
    execFileSync('tar', ['xzf', tgz], { cwd: out, stdio: ['ignore', 'pipe', 'pipe'] });
    return hashTree(path.join(out, 'package'));
}

// THE PUBLISH SET, from its owner — never a second list here.
let dirs;
try {
    dirs = workflowPublishSets(fs.readFileSync(path.join(REPO, WORKFLOW_PATH), 'utf8')).options;
} catch (e) {
    die(`could not read the publish set from its owner (${e.message})`);
}

const rows = [];
for (const dir of dirs) {
    const manifest = path.join(REPO, dir, 'package.json');
    if (!fs.existsSync(manifest)) die(`publish set names "${dir}" but ${dir}/package.json does not exist`);
    const { name, version } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (!name || !version) die(`${dir}/package.json declares no name/version`);

    let published;
    try {
        published = JSON.parse(execFileSync('npm', ['view', name, 'versions', '--json'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
        if (!Array.isArray(published)) published = [published];
    } catch (e) {
        const err = (e.stderr || '').toString();
        if (/E404/.test(err)) { rows.push({ dir, name, version, state: 'UNPUBLISHED', detail: 'not on the registry' }); continue; }
        die(`npm view ${name} failed and this gate will not guess: ${err.trim().split('\n').pop()}`);
    }

    if (!published.includes(version)) {
        rows.push({ dir, name, version, state: 'OK', detail: `repo ${version} is not published (published: ${published.join(', ')})` });
        continue;
    }

    const repoTree = packAndHash('.', path.join(REPO, dir));
    const pubTree = packAndHash(`${name}@${version}`, os.tmpdir());
    const differing = [], onlyRepo = [], onlyPub = [];
    for (const [f, h] of repoTree) {
        if (!pubTree.has(f)) onlyRepo.push(f);
        else if (pubTree.get(f) !== h) differing.push(f);
    }
    for (const f of pubTree.keys()) if (!repoTree.has(f)) onlyPub.push(f);

    const drift = differing.length + onlyRepo.length + onlyPub.length;
    rows.push({
        dir, name, version,
        state: drift ? 'DRIFT' : 'OK',
        detail: drift
            ? `repo ${version} and published ${version} differ: ${differing.length} changed, ${onlyRepo.length} only-in-repo, ${onlyPub.length} only-in-registry`
            : `repo ${version} and published ${version} are byte-identical across ${repoTree.size} shipped files`,
        files: { differing, onlyRepo, onlyPub },
    });
}

if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else {
    for (const r of rows) {
        console.log(`  ${r.state.padEnd(11)} ${r.name}@${r.version}  ${r.detail}`);
        for (const f of r.files?.differing || []) console.log(`               CHANGED  ${f}`);
        for (const f of r.files?.onlyRepo || []) console.log(`               ONLY-REPO ${f}`);
        for (const f of r.files?.onlyPub || []) console.log(`               ONLY-REGISTRY ${f}`);
    }
}

const bad = rows.filter((r) => r.state === 'DRIFT');
console.log(`\n${bad.length ? 'RED' : 'GREEN'} — packages whose repo version is published with DIFFERENT content: ${bad.length}`);
if (bad.length) {
    console.log('\n  A consumer installing that version gets code we did not build. Bump the version.\n' +
        '  If the delta DELETES exports, the bump is MAJOR: under a minor, a consumer pinned to a\n' +
        '  caret range upgrades silently into missing exports and fails at CALL time; under a major\n' +
        '  the resolver refuses at INSTALL time. Fail loud at resolve, not at call.');
}
console.log(
    '\n  COVERAGE BOUNDARY: compares the repo tree to the REGISTRY by packing both and hashing\n' +
    '  every shipped file. It does NOT check the registry copy against its git tag, does not read\n' +
    '  provenance attestations, and reports an unpublished repo version as OK (no collision — not\n' +
    '  a promise about its next publish). Needs the network; an unreachable registry is exit 2,\n' +
    '  which FAILS the build rather than passing it.\n' +
    '  RUNS AUTOMATICALLY: .github/workflows/ci-gates.yml, every push and pull request, with no\n' +
    '  continue-on-error and no condition — this gate\'s exit status is the job\'s.');
process.exit(bad.length ? 1 : 0);
