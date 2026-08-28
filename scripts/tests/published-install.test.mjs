#!/usr/bin/env node
/**
 * THE SUITE FOR THE POST-PUBLISH INSTALL GATE.
 *
 * It exists because the gate it covers is the LAST job of a publish workflow, and a publish
 * workflow cannot be dispatched to test a gate: dispatching it publishes. So the gate lives in a
 * module, and this file is where each half of it is shown RED on a negative control before it is
 * shown GREEN.
 *
 * WHAT WENT WRONG, AND WHAT THIS FILE IS THE ANSWER TO. The gate applied @descix/sdk's app-half
 * LEAK assertion and install-size CEILINGS to whatever package it was handed. Handed the app half
 * itself it reported 16 leaked packages and 587 installed — a RED that says nothing about
 * @descix/app-sdk, because the app half installed on its own IS every forbidden package at once by
 * construction. The gate could not reach a GREEN for a package it was never designed to judge.
 *
 * WHAT IT RUNS AGAINST. Real published artifacts on the real registry. There is no mocked install
 * anywhere in this file, and that is deliberate: the leak assertion is a PRESENCE CHECK over an
 * install tree, so a fixture that never installs cannot exhibit a leak and would not measure the
 * assertion however green it ran.
 *
 * THE ONE SYNTHETIC INPUT, NAMED HERE RATHER THAN BURIED. S4 injects the APP-HALF SET — not the
 * install. It runs the real `npm install @descix/sdk@1.1.0` and then asks the real assertion about
 * a set that contains `zod`, which that install really carries. `zod` is not in the app half
 * today; it is one plausible dependency away from being in it, and the app half demonstrably grows
 * (its published dependency list has already changed once). So S4 is the regression itself
 * arriving one publish early. S5 is S4's own control: the same injection mechanism with a package
 * the tree does NOT carry must go GREEN, which is what proves S4's RED comes from the leak and not
 * from the harness being red no matter what.
 *
 * COST. This file performs five real registry installs, one of which is the ~900MB app half. It is
 * slow on purpose — everything it could do faster, it could do without measuring anything.
 *
 *   node scripts/tests/published-install.test.mjs
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    runPublishedInstallGate,
    ownsLeakAndCeilings,
    parseSpec,
    publishedAppHalfPackages,
    LEAK_AND_CEILING_OWNER,
    MAX_PACKAGES,
} from '../check-published-install.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(REPO_ROOT, 'scripts', 'check-published-install-cli.mjs');

let failures = 0;
let checks = 0;
const section = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 74 - t.length))}`);
function check(label, ok, detail = '') {
    checks++;
    if (!ok) failures++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `\n          ${detail}` : ''}`);
}

/** Run the gate, hand the report to `fn`, and always clean the install directory up. */
function withGate(spec, options, fn) {
    const r = runPublishedInstallGate(spec, options);
    try {
        fn(r);
    } finally {
        r.cleanup();
    }
    return r;
}

const leakFailures = (r) => r.failures.filter((f) => /app-half package\(s\) reached/.test(f));
const ceilingFailures = (r) => r.failures.filter((f) => /ceiling is/.test(f));

console.log('published-install suite');
console.log(`  leak + ceiling owner: ${LEAK_AND_CEILING_OWNER}`);
console.log(`  package ceiling (owned by descix-sdk/scripts/check-install-size.mjs): ${MAX_PACKAGES}`);

// ── S1 · THE SCOPING DECISION, BOTH DIRECTIONS ──────────────────────────────────────────────
// A scoping rule that only ever says "no" is indistinguishable from deleting the assertion, and a
// rule that only ever says "yes" is the bug this change repairs. Both directions, explicitly.
section('S1 — the scoping decision answers YES for the owner and NO for everyone else');
check(`ownsLeakAndCeilings('${LEAK_AND_CEILING_OWNER}') is true`, ownsLeakAndCeilings(LEAK_AND_CEILING_OWNER) === true);
for (const other of ['@descix/app-sdk', '@descix/cloud-core', '@descix/cli', '@descix/platform-api']) {
    check(`ownsLeakAndCeilings('${other}') is false`, ownsLeakAndCeilings(other) === false);
}
// parseSpec is the ONE owner of the name/version split: the CLI takes `version` from it and the
// gate takes `name`. A scoped spec is where a second, hand-rolled split would drift, and the fact
// it decides is which assertions run — so both halves are checked here, on the same call.
for (const [spec, name, version] of [
    ['@descix/sdk@1.1.0', '@descix/sdk', '1.1.0'],
    ['@descix/app-sdk@0.1.2', '@descix/app-sdk', '0.1.2'],
    ['@descix/sdk', '@descix/sdk', null],
]) {
    const parsed = parseSpec(spec);
    check(`parseSpec('${spec}') -> name ${name}`, parsed.name === name, `got: ${parsed.name}`);
    check(`parseSpec('${spec}') -> version ${version}`, parsed.version === version, `got: ${parsed.version}`);
}
check(
    'the scoping decision is driven by the parsed name, not the raw spec',
    ownsLeakAndCeilings(parseSpec('@descix/sdk@1.1.0').name) === true
    && ownsLeakAndCeilings('@descix/sdk@1.1.0') === false
);

// ── S2 · THE PACKAGE THE GATE COULD NOT PASS ────────────────────────────────────────────────
section('S2 — @descix/app-sdk@0.1.2 is GREEN, and is judged on install alone');
withGate('@descix/app-sdk@0.1.2', {}, (r) => {
    check('installs from the registry', r.installed === true, r.failures.join(' | '));
    check('leak + ceilings NOT applied to the app half', r.leakAndCeilings === false);
    check('no app-half set was even derived', r.appHalf === null);
    check('GREEN', r.green === true, r.failures.join(' | '));
    check(
        'its 587-package tree raised no ceiling failure',
        ceilingFailures(r).length === 0,
        `packages=${r.packages}, ceiling failures=${ceilingFailures(r).length}`
    );
});

// ── S3 · THE OWNER STILL GETS THE FULL CHECK ────────────────────────────────────────────────
// This is the axis that proves the change SCOPED the assertions rather than deleting them.
section('S3 — @descix/sdk@1.1.0 is GREEN *and* was actually leak-checked and ceiling-checked');
withGate('@descix/sdk@1.1.0', {}, (r) => {
    check('installs from the registry', r.installed === true, r.failures.join(' | '));
    check('leak + ceilings APPLIED to the owner', r.leakAndCeilings === true);
    check('an app-half set was derived from the registry', r.appHalf !== null && r.appHalf.names.length > 0,
        r.appHalf ? `${r.appHalf.names.length} forbidden names @ app-sdk@${r.appHalf.version}` : 'none');
    check('nothing leaked', r.leaked.length === 0, `leaked: ${r.leaked.join(', ')}`);
    check('within the package ceiling', r.packages <= MAX_PACKAGES, `packages=${r.packages}/${MAX_PACKAGES}`);
    check('GREEN', r.green === true, r.failures.join(' | '));
});

// ── S4 · THE LEAK ASSERTION IS SHOWN ABLE TO FAIL ───────────────────────────────────────────
// The real install of the real owner, asked about an app half that contains something the install
// really carries. If this cannot go RED, the gate has been scoped into uselessness.
section('S4 — a genuine app-half leak on the owner goes RED');
const real = publishedAppHalfPackages();
const leakInjected = () => ({ version: `${real.version}+zod`, names: [...real.names, 'zod'] });
console.log(`  real app half: ${real.names.length} names @ @descix/app-sdk@${real.version}`);
console.log(`  fixture: the same set plus 'zod', which @descix/sdk@1.1.0's install really carries`);
withGate('@descix/sdk@1.1.0', { readAppHalf: leakInjected }, (r) => {
    check('the install still really happened', r.installed === true);
    check('leak + ceilings were applied (the spec is the owner)', r.leakAndCeilings === true);
    check('RED', r.green === false, `failures: ${r.failures.length}`);
    check('RED *on the leak assertion* specifically', leakFailures(r).length === 1,
        r.failures.join(' | '));
    check("the leaked package is named as 'zod'", r.leaked.includes('zod'), `leaked: ${r.leaked.join(', ')}`);
    check('exactly the injected package leaked, nothing spurious', r.leaked.length === 1,
        `leaked: ${r.leaked.join(', ')}`);
});

// ── S5 · S4'S OWN CONTROL ───────────────────────────────────────────────────────────────────
// Same injection mechanism, same real install, a package that is NOT in the tree. GREEN here is
// what makes S4's RED attributable to the leak rather than to the fixture harness.
section("S5 — the same injection with an absent package goes GREEN (so S4's RED means something)");
const absentInjected = () => ({
    version: `${real.version}+absent`,
    names: [...real.names, '@descix/definitely-not-installed-here'],
});
withGate('@descix/sdk@1.1.0', { readAppHalf: absentInjected }, (r) => {
    check('leak + ceilings were applied', r.leakAndCeilings === true);
    check('nothing leaked', r.leaked.length === 0, `leaked: ${r.leaked.join(', ')}`);
    check('GREEN', r.green === true, r.failures.join(' | '));
});

// ── S6 · THE INSTALL ASSERTION IS SHOWN ABLE TO FAIL ────────────────────────────────────────
// The half that applies to EVERY routed package. Scoping the other half must not have disarmed it.
section('S6 — an artifact that does not install goes RED for the owner too');
withGate('@descix/sdk@9.9.9', {}, (r) => {
    check('did not install', r.installed === false);
    check('RED', r.green === false);
    check('npm\'s own words are attached', /ETARGET|No matching version/.test(r.npmOutput),
        r.npmOutput.slice(0, 120));
    check('reported as an install failure, not a leak', leakFailures(r).length === 0);
});

// ── S7 · THE DELETED CALLER-SIDE POLICY FLAG FAILS LOUD ─────────────────────────────────────
// --no-size used to let the caller suppress the leak/ceiling half. Ignoring it silently would let
// a workflow keep passing it and believe it still did something.
section('S7 — the removed --no-size flag is refused, naming what replaced it');
{
    let stdout = '';
    let stderr = '';
    let status = 0;
    try {
        stdout = execFileSync('node', [CLI, '--spec', '@descix/sdk@1.1.0', '--no-size'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
        status = err.status;
        stderr = (err.stderr || '').toString();
        stdout = (err.stdout || '').toString();
    }
    check('exits non-zero', status !== 0, `status=${status}`);
    check('says the flag was removed', /--no-size has been removed/.test(stderr), stderr.slice(0, 160));
    check(`names ${LEAK_AND_CEILING_OWNER} as the owner`, stderr.includes(LEAK_AND_CEILING_OWNER));
    check('refused BEFORE doing an install', !/installs from registry/.test(stdout));
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
