#!/usr/bin/env node
/**
 * check-gate-negative-controls.mjs
 *
 * RUN EVERY descix-cli ORIGIN/IDENTITY GATE AGAINST A DELIBERATELY BROKEN TREE, AND REQUIRE IT
 * TO GO RED.
 *
 * WHY THIS IS A COMMITTED SCRIPT AND NOT SOMETHING A DOER RUNS BY HAND. A gate that has only
 * ever been observed PASSING is not known to be a gate: it may be asserting something that is
 * true of every state, or its harness may be misreading the result. That claim can only be
 * settled by breaking the code and watching the gate fail — and a check nobody can re-run is a
 * claim, not evidence. The same argument npm-publish.yml makes for putting routing logic in a
 * script rather than inline YAML applies here: a script can be run, shown RED, and shown GREEN,
 * by anyone reviewing it.
 *
 * THREE THINGS THIS DOES THAT A NAIVE CONTROL RUNNER DOES NOT, each earned by a measured failure
 * on 2026-08-30:
 *
 *   1. IT SELF-TESTS THE HARNESS FIRST. The original version judged pass/fail by matching the
 *      string "# fail 0" in stdout. Node prints "ℹ fail 0", so the predicate NEVER matched and
 *      every control reported RED REGARDLESS OF STATE. Five REDs that meant nothing. A control
 *      that cannot read GREEN proves nothing about the RED beside it, so this now proves it can
 *      read GREEN on the untampered tree before it applies a single tamper — and it judges on
 *      the process EXIT CODE, not on scraped text.
 *
 *   2. IT REFUSES TO RUN AGAINST A DIRTY TREE. Restore is `git checkout --`, which reverts to
 *      the last commit. Run with uncommitted work in a target file and the restore SILENTLY
 *      DESTROYS it — measured: a fix was wiped mid-run and the next self-test reported the gate
 *      RED, which was very nearly read as a finding rather than as the harness eating the work.
 *
 *   3. IT ASSERTS THE TAMPER LANDED BEFORE READING THE RESULT. A RED against a tamper that never
 *      applied is not a RED; it is a broken edit reported as a passing control (VISION, 0.25.0
 *      rev 11). Every control checks the tampered text is actually in the file on disk first,
 *      and checks the original is back after restore.
 *
 * COVERAGE BOUNDARY, printed with the verdict: this runs the gates in ONE test file against
 * source-level tampers. It does NOT prove those gates cover every defect in their domain, does
 * not read the packed tarball, and NOTHING RUNS IT AUTOMATICALLY — it is a reviewer's tool.
 *
 * USAGE:  node scripts/check-gate-negative-controls.mjs
 * EXIT :  0 all controls RED (good) · 1 a control stayed GREEN or the harness is broken
 *         2 refused to run (dirty tree)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(REPO, 'descix-cli');
const SUITE = 'tests/origin-and-identity-owner.test.js';

/** [gate name, file relative to descix-cli, exact text to replace, replacement, what it breaks] */
const CONTROLS = [
    ['GATE I1-prints-resolved-env', 'lib/api-client.js',
     '    reportEnvironment({ origin: this.baseUrl, source: originSource });',
     '    // TAMPER: print removed',
     'silence: a network-bound command declares no environment'],
    ['GATE I1-unconfigured-declares-prod', 'lib/origin.js',
     '        source: DEFAULT_ORIGIN_SOURCE,',
     "        source: '.descix/workspace.json env.apiUrl',",
     'mislabel: the declared default is reported as a configured source'],
    ['GATE I1-invalid-config-fails-loud', 'lib/origin.js',
     "    return parsed.protocol === 'http:' || parsed.protocol === 'https:';",
     '    return true; // TAMPER: accept anything',
     'MODULE: the validator is neutered, so nothing throws'],
    ['GATE I1-invalid-config-fails-loud', 'bin/descix.js',
     '  console.error(chalk.red(`\\n${message}\\n`));',
     '  // TAMPER: swallow the reason, as the 27 bare catches did',
     'ARTIFACT: the error is built then discarded — exit 1 with zero bytes'],
    ['GATE I1-no-origin-write', 'lib/origin.js',
     'export function normalizeOrigin(origin) {',
     "export const SNEAKY = { apiUrl: 'https://evil.example' };\nexport function normalizeOrigin(origin) {",
     'an unreviewed new line writes an origin'],
    ['GATE I2-agent-files-name-the-developer', 'lib/workspace-identity.js',
     '        apiUrl: resolved.origin,',
     "        apiUrl: 'https://descix.net',",
     'hardcode: the generator ignores the resolved origin'],
];

const runGate = (gate) => spawnSync('node',
    gate ? ['--test', '--test-name-pattern', gate, SUITE] : ['--test', SUITE],
    { cwd: CLI, encoding: 'utf8' }).status === 0;

const restore = (rel) =>
    execFileSync('git', ['checkout', '--', `descix-cli/${rel}`], { cwd: REPO });

// ── 2. REFUSE A DIRTY TREE ───────────────────────────────────────────────────────────────────
const dirty = execFileSync('git', ['status', '--porcelain', 'descix-cli'],
    { cwd: REPO, encoding: 'utf8' }).trim();
if (dirty) {
    console.error('REFUSED: descix-cli has uncommitted changes, and this harness restores with');
    console.error('`git checkout --`, which would DISCARD them. Commit first.\n');
    console.error(dirty);
    process.exit(2);
}

let ok = true;

// ── 1. SELF-TEST: can this harness read GREEN at all? ────────────────────────────────────────
for (const [gate] of CONTROLS) {
    const green = runGate(gate);
    console.log(`  self-test (untampered) ${gate}: ${green ? 'GREEN (harness can read GREEN)' : 'RED  <-- HARNESS BROKEN'}`);
    if (!green) ok = false;
}
if (!ok) {
    console.error('\n  !! HARNESS CANNOT READ GREEN — no RED below would mean anything. STOP.');
    process.exit(1);
}
console.log('');

// ── 3. TAMPER, ASSERT IT LANDED, REQUIRE RED, RESTORE, ASSERT RESTORED ───────────────────────
for (const [gate, rel, from, to, why] of CONTROLS) {
    const file = path.join(CLI, rel);
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes(from)) {
        console.error(`  !! TAMPER TARGET NOT FOUND in ${rel} for ${gate} — CONTROL INVALID`);
        ok = false;
        continue;
    }
    fs.writeFileSync(file, src.replace(from, to));
    const landed = fs.readFileSync(file, 'utf8').includes(to.split('\n')[0]);
    if (!landed) {
        console.error(`  !! TAMPER DID NOT LAND in ${rel} — CONTROL INVALID`);
        ok = false;
        restore(rel);
        continue;
    }
    const stayedGreen = runGate(gate);
    console.log(`  tamper landed=true  ${gate}: ${stayedGreen ? 'GREEN (BAD — gate cannot fail)' : 'RED  (good)'}   [${why}]`);
    if (stayedGreen) ok = false;
    restore(rel);
    if (!fs.readFileSync(file, 'utf8').includes(from)) {
        console.error(`  !! RESTORE FAILED for ${rel}`);
        process.exit(1);
    }
}

const suiteGreen = runGate(null);
console.log(`  ALL RESTORED -> suite: ${suiteGreen ? 'GREEN (good)' : 'RED (BAD)'}`);
if (!suiteGreen) ok = false;

console.log(
    `\n[check-gate-negative-controls] ran ${CONTROLS.length} controls over ${SUITE}. ` +
    'CATCHES: a gate that passes on a broken tree, and a harness that cannot read GREEN. ' +
    'DOES NOT READ: the packed tarball, gates outside that file, or defect classes those gates ' +
    'do not assert. RUN BY: a human — nothing runs this automatically.');
process.exit(ok ? 0 : 1);
