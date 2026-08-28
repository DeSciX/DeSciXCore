#!/usr/bin/env node
/**
 * THE SUITE FOR THE RELEASE ROUTER — and it exists because of what it is allowed to run against.
 *
 * A publish workflow cannot be dispatched to test a gate: dispatching it publishes. So every gate
 * in this workflow lives in a script, and this file is where each one is shown RED on a negative
 * control before it is shown GREEN. A gate that has only ever been shown GREEN has not been shown
 * to discriminate, and a fixture whose inputs cannot exhibit the failure does not measure the
 * failure however green it runs.
 *
 * WHAT IT RUNS AGAINST. The real workflow file and the real package.json versions in this tree,
 * wherever the real tree can exhibit the case. Synthetic inputs appear ONLY where the tree cannot:
 * a tag no release will ever carry, and a deliberately colliding package set that does not exist.
 *
 * WHAT IT CANNOT MEASURE, STATED HERE RATHER THAN IMPLIED. GitHub's own evaluation of `needs:` and
 * `if:` is not executed by this file and cannot be from a laptop. T5 checks the WIRING in the YAML
 * and then SIMULATES the expression. That is a hypothesis about GitHub's semantics, not a
 * measurement of them, and it is labelled as such in its own output.
 *
 *   node scripts/tests/release-target.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflowPublishSets, publishJobWiring, WORKFLOW_PATH } from '../publish-set.mjs';
import {
    resolveReleaseTarget,
    routeCandidates,
    packageVersion,
    TAG_INFIX,
} from '../resolve-release-target.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowText = fs.readFileSync(path.join(REPO_ROOT, WORKFLOW_PATH), 'utf8');
const { publishable } = workflowPublishSets(workflowText);
const readVersion = (dir) => packageVersion(REPO_ROOT, dir);

let failures = 0;
let checks = 0;
const section = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 74 - t.length))}`);
function check(label, ok, detail = '') {
    checks++;
    if (!ok) failures++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `\n          ${detail}` : ''}`);
}
const release = (tag) => resolveReleaseTarget({ event: 'release', tag, publishable, readVersion });

console.log(`release-target suite`);
console.log(`  publishable set read from ${WORKFLOW_PATH}: ${publishable.join(', ')}`);
console.log(`  package.json versions: ${publishable.map((d) => `${d}=${readVersion(d).version}`).join(', ')}`);

// ── D3 · ROUTING, BOTH DIRECTIONS ───────────────────────────────────────────────────────────
// Two of the three directories end in `-sdk`. The claim under test is not "the router works" but
// "the router routes each tag to exactly ONE package, and never to the other one".
section('D3 — cross-package routing, each direction');
for (const dir of publishable) {
    const version = readVersion(dir).version;
    const tag = `${dir}${TAG_INFIX}${version}`;
    const cands = routeCandidates(tag, publishable);
    check(
        `'${tag}' routes to exactly [${dir}]`,
        cands.length === 1 && cands[0] === dir,
        `candidates: [${cands.join(', ')}]`
    );
    for (const other of publishable.filter((d) => d !== dir)) {
        check(
            `'${tag}' does NOT route to ${other}`,
            !cands.includes(other)
        );
    }
}

// The trap is not hypothetical prose: it is a property of the MATCHER. Measure the canonical one
// against two naive ones on the same tags and report where they differ, rather than asserting a
// collision this particular set of names may or may not produce.
section('D3 — the naive matchers this router deliberately is not');
const naiveSubstring = (tag, set) => set.filter((d) => tag.includes(d));
const naiveSuffixGlob = (tag, set) =>
    set.filter((d) => {
        const tail = d.split('-').slice(-1)[0]; // `sdk`, `core` — the shape a `*-sdk-v*` glob keys on
        return tag.includes(`${tail}${TAG_INFIX}`);
    });
for (const dir of publishable) {
    const tag = `${dir}${TAG_INFIX}${readVersion(dir).version}`;
    const exact = routeCandidates(tag, publishable);
    const sub = naiveSubstring(tag, publishable);
    const glob = naiveSuffixGlob(tag, publishable);
    console.log(
        `  '${tag}'\n` +
        `        anchored-exact-segment : [${exact.join(', ')}]  <- what this router uses\n` +
        `        naive substring        : [${sub.join(', ')}]\n` +
        `        naive suffix glob      : [${glob.join(', ')}]`
    );
    check(`anchored matcher is unambiguous for '${tag}'`, exact.length === 1);
}
check(
    'the suffix-glob matcher is measurably ambiguous on at least one real tag',
    publishable.some((d) => naiveSuffixGlob(`${d}${TAG_INFIX}${readVersion(d).version}`, publishable).length > 1),
    'if this ever reads FAIL the trap has stopped being demonstrable with these names — the ' +
        'anchored matcher is still correct, but this control no longer discriminates'
);

// ── D1 · VERSION GUARD ──────────────────────────────────────────────────────────────────────
// The RED needs no injection: a tag naming a version the tree does not carry is a real input.
section('D1 — tag/package.json version agreement');
for (const dir of publishable) {
    const { version } = readVersion(dir);
    const good = release(`${dir}${TAG_INFIX}${version}`);
    check(`'${dir}${TAG_INFIX}${version}' (matching)   -> publish`, good.decision === 'publish', good.reason);
    check(`  ... and it carries dist_tag 'latest'`, good.distTag === 'latest');

    const badVersion = '0.0.0-not-a-version-this-tree-carries';
    const bad = release(`${dir}${TAG_INFIX}${badVersion}`);
    check(`'${dir}${TAG_INFIX}${badVersion}' (mismatched) -> REFUSE`, bad.decision === 'refuse');
    check(
        `  ... and the refusal names BOTH versions`,
        bad.decision === 'refuse' && bad.reason.includes(badVersion) && bad.reason.includes(version),
        bad.reason
    );
}

// ── D2 · A TAG THAT IS NOT OURS ─────────────────────────────────────────────────────────────
section('D2 — a foreign or unknown tag skips, and does not refuse');
for (const tag of [
    'frqtl-sdk-v1.0.0',            // a real tag from the reference repo this shape was taken from
    'egpt-math-sdk-v2.3.4',        // the other package that shares that repo's release stream
    'v1.1.0',                      // a bare version tag
    'descix-sdk',                  // the package name with no version at all
    `descix-sdk${TAG_INFIX}`,      // the prefix with an empty version
    '',                            // no tag
]) {
    const r = release(tag);
    check(`'${tag}' -> skip (exit 0, not a failure)`, r.decision === 'skip', r.reason);
}

// ── D5 · MANUAL DISPATCH ────────────────────────────────────────────────────────────────────
section('D5 — workflow_dispatch confirm_version is the check');
for (const dir of publishable) {
    const { version } = readVersion(dir);
    const ok = resolveReleaseTarget({
        event: 'workflow_dispatch', inputPackage: dir, confirmVersion: version,
        distTag: 'latest', publishable, readVersion,
    });
    check(`${dir} + correct confirm_version -> publish`, ok.decision === 'publish', ok.reason);

    const no = resolveReleaseTarget({
        event: 'workflow_dispatch', inputPackage: dir, confirmVersion: '0.0.0-wrong',
        distTag: 'latest', publishable, readVersion,
    });
    check(`${dir} + wrong confirm_version   -> REFUSE`, no.decision === 'refuse');
    check(
        `  ... and the refusal names both values`,
        no.decision === 'refuse' && no.reason.includes('0.0.0-wrong') && no.reason.includes(version),
        no.reason
    );
}
const emptyConfirm = resolveReleaseTarget({
    event: 'workflow_dispatch', inputPackage: publishable[0], confirmVersion: '',
    publishable, readVersion,
});
check('empty confirm_version -> REFUSE', emptyConfirm.decision === 'refuse');
const unknownPkg = resolveReleaseTarget({
    event: 'workflow_dispatch', inputPackage: 'descix-cli', confirmVersion: '1.0.0',
    publishable, readVersion,
});
check('a dispatch naming a package outside the publish set -> REFUSE', unknownPkg.decision === 'refuse');

// ── AMBIGUITY AND UNKNOWN TRIGGERS ──────────────────────────────────────────────────────────
// The colliding set is synthetic BECAUSE no colliding set exists today. That is the point: the
// refusal must be shown to fire before anyone relies on it to catch a fourth package.
//
// AND THE FIXTURE HAS TO BE ABLE TO EXHIBIT THE REAL FAILURE. A set with the same name twice
// would go red here too, but it exhibits a duplicate LIST ENTRY, not two DISTINCT package names
// whose anchored prefixes overlap — a different bug wearing the same output. So the fixture is
// two distinct, entirely plausible directory names: adding a `descix-sdk-v2` beside `descix-sdk`
// is exactly the kind of thing a major-version split does, and on that day `descix-sdk-v2-v...`
// carries both prefixes.
section('Ambiguity and unsupported triggers');
const colliding = ['descix-sdk', 'descix-sdk-v2'];
const collidingTag = `descix-sdk-v2${TAG_INFIX}1.0.0`;
check(
    'the colliding fixture really is ambiguous under the anchored matcher (the fixture is part of the gate)',
    routeCandidates(collidingTag, colliding).length === 2,
    `candidates: [${routeCandidates(collidingTag, colliding).join(', ')}]`
);
const amb = resolveReleaseTarget({
    event: 'release', tag: collidingTag, publishable: colliding, readVersion,
});
check('a publishable set with colliding prefixes -> REFUSE as ambiguous',
    amb.decision === 'refuse' && /AMBIGUOUS/.test(amb.reason), amb.reason);
const weird = resolveReleaseTarget({ event: 'push', tag: 'x', publishable, readVersion });
check("an event nobody designed for ('push') -> REFUSE", weird.decision === 'refuse', weird.reason);
const noSet = resolveReleaseTarget({ event: 'release', tag: 'x', publishable: [], readVersion });
check('an empty publishable set -> REFUSE', noSet.decision === 'refuse');

// ── D2 (second half) · WIRING, AND THE PART THAT IS A SIMULATION ────────────────────────────
section('D2 — the publish job is wired to the guard (YAML measured, GitHub semantics simulated)');
const wiring = publishJobWiring(workflowText);
console.log(`  publish job: needs=${JSON.stringify(wiring.needs)} if=${JSON.stringify(wiring.if)} environment=${JSON.stringify(wiring.environment)}`);
const IF_EXPR = "needs.guard.outputs.should_publish == 'true'";
check('publish `needs: guard`', wiring.needs === 'guard');
check(`publish \`if: ${IF_EXPR}\``, wiring.if === IF_EXPR);
check("publish still declares `environment: npm-publish`", wiring.environment === 'npm-publish');

// A SIMULATION of GitHub's job-level `if:`, restricted to the exact expression above. It is here
// so "the publish job is not reached" is a checkable consequence of the guard's own output rather
// than a reading of the YAML — but GitHub evaluates the real thing, and this file does not.
function simulateIf(expr, outputs) {
    const m = expr.match(/^needs\.guard\.outputs\.(\w+)\s*==\s*'([^']*)'$/);
    if (!m) throw new Error(`simulateIf: this simulator only understands the one expression shape; got: ${expr}`);
    return (outputs[m[1]] ?? '') === m[2];
}
const skipOutputs = { should_publish: 'false' };
const goOutputs = { should_publish: 'true' };
check('SIMULATED: guard says should_publish=false -> publish job does NOT run', simulateIf(IF_EXPR, skipOutputs) === false);
check('SIMULATED: guard says should_publish=true  -> publish job runs', simulateIf(IF_EXPR, goOutputs) === true);
console.log('  NOTE: the two lines above are a SIMULATION of GitHub expression evaluation, not a');
console.log('        measurement of it. Only a real run measures GitHub.');

// ── THE PARSER'S OWN NEGATIVE CONTROL ───────────────────────────────────────────────────────
// publish-set.mjs keys the refusal set on `case "$PKG" in`. If it also accepted the superseded
// `case "${{ inputs.package }}" in`, it would be a reader that cannot tell the two paths apart —
// and the refusal step would silently go back to being unreachable on the release path.
section('publish-set.mjs reads the current shape and refuses the superseded one');
const supersededCase = workflowText.replace('case "$PKG" in', 'case "${{ inputs.package }}" in');
let threw = null;
try { workflowPublishSets(supersededCase); } catch (e) { threw = e; }
check('the superseded `${{ inputs.package }}` refusal shape -> THROWS', threw !== null, threw ? threw.message : 'it parsed, which means the parser cannot tell the two apart');
let threwNoOptions = null;
try { workflowPublishSets(workflowText.replace(/^\s*options:\s*$/m, '        notoptions:')); } catch (e) { threwNoOptions = e; }
check('a workflow with no `options:` block -> THROWS', threwNoOptions !== null);
check('the unmodified workflow parses', workflowPublishSets(workflowText).publishable.length === publishable.length);

console.log('');
if (failures) {
    console.error(`RED — ${failures} of ${checks} checks failed.`);
    process.exit(1);
}
console.log(`GREEN — ${checks} checks passed.`);
console.log('');
console.log('        WHAT THIS DOES NOT LICENSE YOU TO BELIEVE: it exercises ROUTING and VERSION');
console.log('        agreement, plus the parser that reads the publish set. It asks the registry');
console.log('        nothing — the dependency gate and the post-publish install check are');
console.log('        separate scripts with their own controls. And it does not run GitHub: the');
console.log('        job-gating checks above are a simulation of an expression, and only a real');
console.log('        run measures whether the publish job was reached.');
