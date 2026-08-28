/**
 * THE POST-PUBLISH INSTALL CHECK — "install what was actually published, from the registry".
 *
 * ── What went wrong, and what this fixes ─────────────────────────────────────
 * On 2026-08-27 @descix/sdk@1.1.0 published on a GREEN run and is uninstallable (ETARGET on
 * @descix/cloud-core@^1.1.0), and it is the `latest` tag. It shipped because "the package
 * appeared on the registry" was treated as the gate: NOTHING, anywhere, ever installed what had
 * been published. This is the job that would have caught it, and it runs LAST so that what it
 * measures is the artifact the registry is serving rather than anything in a checkout.
 *
 * ── Verify against the EXECUTING artifact ────────────────────────────────────
 * Every measurement here comes from a fresh `npm install <name>@<version>` from the public
 * registry into an empty directory in the OS temp dir. Nothing reads the working tree. A local
 * build can differ from the published tarball in `files`, in build output, in lifecycle
 * scripts — and each of those differences is invisible to a gate that measures the checkout.
 *
 * ── WHICH ASSERTION APPLIES TO WHICH PACKAGE ─────────────────────────────────
 * For EVERY routed package the assertion is exactly one property: the clean-directory install of
 * the published `name@version` succeeds.
 *
 * The app-half LEAK assertion and the install-size CEILINGS are NOT that property. They belong to
 * @descix/sdk — the microservice half, whose design claim is "a microservice-only consumer does
 * not pay for the app half". They apply to @descix/sdk and to nothing else, and this module
 * decides that itself from the spec it is handed (LEAK_AND_CEILING_OWNER below). A caller cannot
 * turn them on for another package or off for this one: which package owns an assertion is part
 * of the assertion, not a workflow input and not a CLI flag.
 *
 * @descix/app-sdk is that leak assertion's designed NEGATIVE CONTROL, never its subject. The app
 * half installed on its own IS every forbidden package at once by construction — that is what
 * proves the detector fires, and it is meaningless as a verdict on app-sdk itself. No ceiling
 * applies to any other routed package until that package's own design sets one.
 *
 * ── PART (c): the published-artifact SIZE measurement, for @descix/sdk ───────
 * descix-sdk/scripts/check-install-size.mjs is the MONOREPO gate: its forbidden set comes from
 * monorepoPackages(), which reads the filesystem and by construction can never see the registry.
 * It stays that way — it is not extended into a second owner of registry truth.
 *
 * Instead this file measures the SAME two quantities at the OTHER end of the pipe, and IMPORTS
 * the thresholds from that module so there is ONE threshold owner and two measurement points.
 * The forbidden set is derived on the registry plane, from the published app half's OWN declared
 * dependencies (`npm view @descix/app-sdk@<v> dependencies`) — the registry-side mirror of what
 * appHalfPackages() does on disk, and derived for the same reason: a hand list stops gating
 * without saying so.
 *
 * The two derivations legitimately DISAGREE, and that is the point rather than a defect: one
 * number describes what developers can install today, the other what the next publish will make
 * installable. The app half GROWS, and that growth is the regression this assertion is for.
 *
 * ── The negative controls this file is required to survive ───────────────────
 * scripts/tests/published-install.test.mjs runs every one of these. Each is shown RED before any
 * GREEN here counts for anything, and each was measured on 2026-08-28.
 *
 *   INSTALL — applies to every routed package:
 *     @descix/sdk@9.9.9      RED. No such version: this is what "a developer cannot install it"
 *                            looks like, and it is the shape of the 2026-08-27 incident.
 *     @descix/sdk@1.1.0      GREEN, 241 packages.
 *     @descix/app-sdk@0.1.2  GREEN, 587 packages. Not a failure and not an exemption — no
 *                            ceiling is designed for the app half, so none is applied to it.
 *
 *   LEAK + CEILINGS — apply to @descix/sdk alone, and are shown able to fail there:
 *     @descix/sdk@1.1.0 checked against an app half containing a package its install really
 *     carries goes RED on the leak assertion. The suite injects `zod` for this: it is in
 *     @descix/sdk's real tree today and is one plausible dependency away from being in the app
 *     half, so the fixture is the regression itself arriving one publish early, not a mock.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { addedPackageCount, installedBytes } from '../descix-sdk/scripts/pack-set.mjs';
import { MAX_PACKAGES, MAX_BYTES } from '../descix-sdk/scripts/check-install-size.mjs';
import { registryLatest, registryDependencies, registryVersions } from './registry.mjs';

export { MAX_PACKAGES, MAX_BYTES };

/**
 * The ONE package that owns the app-half leak assertion and the install-size ceilings.
 *
 * It is a single name rather than a list because the ownership is a design fact, not a policy
 * knob: these two assertions encode @descix/sdk's own claim about itself. A second package
 * joining them is a new design row for that package, which is a code change here — not a flag
 * someone can pass, and not a set someone can grow by accident from a workflow input.
 */
export const LEAK_AND_CEILING_OWNER = '@descix/sdk';

/** Does the leak/ceiling half of this gate apply to `name`? The gate asks this; callers do not. */
export function ownsLeakAndCeilings(name) {
    return name === LEAK_AND_CEILING_OWNER;
}

/**
 * Split `name@version` into its parts, tolerating the leading @ of a scope.
 *
 * The ONE owner of that split. The CLI needs the version and this module needs the name, and when
 * each derived it for itself the two could disagree about where a scoped spec divides — the
 * general form of mirror drift, on the string that decides which assertions run.
 */
export function parseSpec(spec) {
    const at = spec.lastIndexOf('@');
    return at > 0
        ? { name: spec.slice(0, at), version: spec.slice(at + 1) }
        : { name: spec, version: null };
}

/** The app half, as the REGISTRY publishes it: the package plus its own declared dependencies. */
export function publishedAppHalfPackages(version = registryLatest('@descix/app-sdk')) {
    const deps = registryDependencies('@descix/app-sdk', version);
    return { version, names: ['@descix/app-sdk', ...Object.keys(deps)] };
}

/** Synchronous sleep — this runs in a CLI gate, not in a server. */
function sleepSync(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Wait for `name@version` to be visible on the registry. A publish is not instantly readable
 * everywhere, and a gate that reports CDN propagation as a broken package is a gate that cries
 * wolf — which trains the operator to ignore it the one time it is right.
 */
export function waitForRegistry(name, version, { attempts = 10, delayMs = 6000 } = {}) {
    for (let i = 1; i <= attempts; i++) {
        if (registryVersions(name).includes(version)) return { visible: true, attempts: i };
        if (i < attempts) sleepSync(delayMs);
    }
    return { visible: false, attempts };
}

/**
 * Install `spec` from the registry into a fresh empty directory and measure it.
 *
 * Returns a report; never throws for a RED result. An install FAILURE is reported as RED with
 * npm's own words attached — never swallowed, and never reported as anything other than a
 * failure. A gate whose crash reads as a stack trace cannot tell a reader "the package is
 * broken" apart from "the gate is broken".
 */
export function runPublishedInstallGate(spec, { readAppHalf = publishedAppHalfPackages } = {}) {
    const { name } = parseSpec(spec);
    const leakAndCeilings = ownsLeakAndCeilings(name);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-published-'));
    fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: 'published-install-probe', version: '1.0.0', private: true }) + '\n'
    );

    const report = {
        green: false, spec, name, dir, installed: false, leakAndCeilings,
        failures: [], packages: null, bytes: null, leaked: [], appHalf: null, npmOutput: '',
    };

    try {
        report.npmOutput = execFileSync(
            'npm', ['install', spec, '--no-audit', '--no-fund'],
            { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
        );
        report.installed = true;
    } catch (err) {
        const said = (err.stderr || err.stdout || err.message).toString().trim();
        report.npmOutput = said;
        report.failures.push(
            `${spec} DOES NOT INSTALL from the registry. This is what a developer gets when ` +
            `they run \`npm install ${name}\` today:\n` +
            said.split('\n').filter((l) => /npm error/.test(l)).slice(0, 6).map((l) => `      ${l}`).join('\n')
        );
        return { ...report, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
    }

    report.packages = addedPackageCount(report.npmOutput);
    report.bytes = installedBytes(dir);

    if (leakAndCeilings) {
        const appHalf = readAppHalf();
        report.appHalf = appHalf;
        report.leaked = appHalf.names.filter((n) =>
            fs.existsSync(path.join(dir, 'node_modules', ...n.split('/'), 'package.json')));

        if (report.leaked.length > 0) {
            report.failures.push(
                `${report.leaked.length} app-half package(s) reached this install: ` +
                `${report.leaked.join(', ')}. The app half must be an OPTIONAL PEER, never a ` +
                `dependency — a microservice-only consumer does not pay for the app half.`
            );
        }
        if (report.packages > MAX_PACKAGES) {
            report.failures.push(`${report.packages} packages installed, ceiling is ${MAX_PACKAGES}.`);
        }
        if (report.bytes > MAX_BYTES) {
            report.failures.push(
                `${(report.bytes / 1024 / 1024).toFixed(1)}MB installed, ceiling is ` +
                `${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB.`
            );
        }
    }

    report.green = report.failures.length === 0;
    return { ...report, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
