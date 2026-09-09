#!/usr/bin/env node
/**
 * check-packed-matches-source.mjs
 *
 * THE ARTIFACT WE PUBLISH MUST BE THE SOURCE WE COMMITTED. For every file in the tarball
 * `npm publish` is about to upload, the bytes must equal the git blob at the publishing sha.
 *
 * WHY THIS IS NOT THE GATE WE ALREADY HAVE. check-registry-content-drift.mjs answers a
 * different question — "does a repo version that EQUALS a published version have the same
 * content" — and it is the gate that catches a forgotten bump. It cannot cover the publish
 * itself, and the reason is structural rather than incidental: the version being published is,
 * by definition, not yet on the registry, so that gate takes its `!published.includes(version)`
 * branch and reports OK. It passes VACUOUSLY for exactly the artifact in flight. Running it in
 * the publish workflow would therefore add a green light that never once looked at the thing
 * being shipped. This gate looks at that thing, and only at that thing.
 *
 * WHAT IT CATCHES, that nothing else in npm-publish.yml does:
 *   · a publish from a DIRTY checkout — content that exists on no commit anywhere;
 *   · a `files` / .npmignore / prepack change that ships a file git does not have at this sha;
 *   · a build or codegen step that rewrites a shipped file on its way into the tarball;
 *   · a tarball assembled from a different tree than the one the release tag names.
 * Each of those produces a published artifact whose provenance link to the repo is a claim
 * rather than a fact, and each is invisible to a version-string check — which is the exact
 * class of defect that let five packages drift under unchanged version numbers.
 *
 * HOW IT DECIDES: `npm pack --ignore-scripts` the package directory, extract, and for every
 * shipped file compare its SHA-256 against `git show <sha>:<dir>/<file>`. PER-FILE CONTENT
 * HASHES ONLY. It never compares tarball bytes: gzip embeds an mtime, so two tarballs with
 * identical content routinely differ byte-for-byte, and a tarball-hash gate would be RED on
 * correct behaviour — an alarm that cries wolf is one people learn to route around. It never
 * falls back to comparing version strings, because a version string agreeing is precisely the
 * state in which this whole class of defect hides.
 *
 * --ignore-scripts is deliberate and is a REAL LIMIT, stated rather than implied: it measures
 * the tree as committed. A package that legitimately BUILDS a shipped artifact in prepack would
 * be reported as shipping files git does not have. No package in this publish set does that
 * today; if one starts, this gate must be taught the built paths explicitly rather than
 * loosened to ignore them.
 *
 * THE PUBLISH SET IS NOT LISTED HERE. With no directory argument it is read from its owner, the
 * workflow's workflow_dispatch options (scripts/publish-set.mjs), so this gate cannot drift out
 * of sync with what we actually publish.
 *
 * USAGE:  node scripts/check-packed-matches-source.mjs [<package-directory>] [--sha <sha>] [--json]
 *         (no directory = every package in the publish set; default sha = HEAD)
 * EXIT :  0 packed content equals source · 1 a mismatch · 2 could not measure (never a silent pass)
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflowPublishSets, WORKFLOW_PATH } from './publish-set.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const die = (m) => { console.error(`check-packed-matches-source: ${m}`); process.exit(2); };

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const shaIdx = argv.indexOf('--sha');
const shaArg = shaIdx === -1 ? 'HEAD' : argv[shaIdx + 1];
if (shaIdx !== -1 && !shaArg) die('--sha needs a value');
const dirArg = argv.find((a, i) => !a.startsWith('--') && i !== shaIdx + 1);

let SHA;
try {
    SHA = execFileSync('git', ['rev-parse', shaArg], { cwd: REPO, encoding: 'utf8' }).trim();
} catch (e) {
    die(`could not resolve sha "${shaArg}": ${(e.stderr || e.message).toString().trim()}`);
}

/** sha256 of a Buffer. */
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Every shipped file -> sha256, from an extracted tarball's package/ directory. */
function hashTree(root) {
    const out = new Map();
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) { walk(p); continue; }
            out.set(path.relative(root, p), sha256(fs.readFileSync(p)));
        }
    };
    walk(root);
    return out;
}

/** Pack a package directory as npm publish would, and return its hashed file tree. */
function packAndHash(dir) {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'packed-src-'));
    try {
        execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', out],
            { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        die(`npm pack in ${dir} failed: ${(e.stderr || e.message).toString().trim().split('\n').pop()}`);
    }
    const tgz = fs.readdirSync(out).find((f) => f.endsWith('.tgz'));
    if (!tgz) die(`npm pack in ${dir} produced no tarball`);
    execFileSync('tar', ['xzf', tgz], { cwd: out, stdio: ['ignore', 'pipe', 'pipe'] });
    return hashTree(path.join(out, 'package'));
}

/** The git blob at <SHA>:<repoRelPath>, or null when the sha has no such file. */
function blobAt(repoRelPath) {
    try {
        return execFileSync('git', ['show', `${SHA}:${repoRelPath}`],
            { cwd: REPO, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
        return null;
    }
}

// THE PUBLISH SET, from its owner — never a second list here.
let dirs;
if (dirArg) {
    dirs = [dirArg.replace(/\/+$/, '')];
} else {
    try {
        dirs = workflowPublishSets(fs.readFileSync(path.join(REPO, WORKFLOW_PATH), 'utf8')).options;
    } catch (e) {
        die(`could not read the publish set from its owner (${e.message})`);
    }
}

const rows = [];
for (const dir of dirs) {
    const pkgDir = path.resolve(REPO, dir);
    const manifest = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(manifest)) die(`"${dir}" has no package.json — it is not a package directory`);
    const { name, version } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (!name || !version) die(`${dir}/package.json declares no name/version`);

    const packed = packAndHash(pkgDir);
    const differing = [], notInGit = [];
    for (const [file, hash] of packed) {
        const blob = blobAt(`${dir}/${file}`);
        if (blob === null) { notInGit.push(file); continue; }
        if (sha256(blob) !== hash) differing.push(file);
    }

    const bad = differing.length + notInGit.length;
    rows.push({
        dir, name, version, sha: SHA,
        state: bad ? 'MISMATCH' : 'OK',
        detail: bad
            ? `${differing.length} shipped file(s) differ from the source at ${SHA.slice(0, 7)}, ${notInGit.length} not in git at that sha`
            : `all ${packed.size} shipped files are byte-identical to the source at ${SHA.slice(0, 7)}`,
        files: { differing, notInGit },
    });
}

if (asJson) console.log(JSON.stringify(rows, null, 2));
else {
    console.log(`packed-vs-source gate at ${SHA}\n`);
    for (const r of rows) {
        console.log(`  ${r.state.padEnd(9)} ${r.name}@${r.version}  ${r.detail}`);
        for (const f of r.files.differing) console.log(`            CHANGED-IN-TARBALL  ${f}`);
        for (const f of r.files.notInGit) console.log(`            NOT-IN-GIT          ${f}`);
    }
}

const bad = rows.filter((r) => r.state === 'MISMATCH');
console.log(`\n${bad.length ? 'RED' : 'GREEN'} — packages whose tarball does not match the committed source: ${bad.length}`);
if (bad.length) {
    console.log('\n  The artifact about to be published contains bytes that are on no commit at this sha.\n' +
        '  A consumer installing it would get code the repository cannot account for, and every\n' +
        '  provenance claim tying that release to this sha would be false. Publish from a clean\n' +
        '  checkout of the sha being released, or explain the extra files and teach this gate them.');
}
console.log(
    '\n  COVERAGE BOUNDARY: compares each PACKED file to the git blob at the given sha, by SHA-256,\n' +
    '  per file. It never compares tarball bytes (gzip embeds an mtime, so identical content gives\n' +
    '  different tarball hashes) and it never compares version strings. IT DOES NOT ask whether\n' +
    '  that version is already on the registry with other content — that is\n' +
    '  check-registry-content-drift.mjs, which runs in ci-gates.yml and is the gate for a forgotten\n' +
    '  bump; this one passes happily on a version that should never have been reused. It packs with\n' +
    '  --ignore-scripts, so a package that legitimately BUILDS a shipped file in prepack would read\n' +
    '  NOT-IN-GIT here and must be taught explicitly rather than exempted. It reads no attestation\n' +
    '  and verifies no signature.\n' +
    `  RUNS AUTOMATICALLY: .github/workflows/npm-publish.yml, in the publish job, before \`npm\n` +
    '  publish\', keyed on the guard\'s resolved package — its exit status blocks the publish.');
process.exit(bad.length ? 1 : 0);
