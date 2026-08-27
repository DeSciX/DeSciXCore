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
 * ── PART (c): the published-artifact SIZE measurement ────────────────────────
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
 * The two derivations legitimately DISAGREE, and that is the point rather than a defect: on
 * 2026-08-27 the tree's app-sdk 0.1.2 declared 15 dependencies and the registry's 0.1.0 declared
 * 14 (`vite` is a local-only addition not yet published). One number describes what developers
 * can install today; the other describes what the next publish will make installable.
 *
 * ── The negative controls this file is required to survive ───────────────────
 *   INSTALL:  --spec @descix/sdk@1.1.0     must go RED (ETARGET, the real P0)
 *             --spec @descix/sdk@1.0.0     must go GREEN (installs, 95 packages)
 *   SIZE:     --spec @descix/app-sdk@0.1.0 must go RED on the leak assertion — the app half
 *             installed on its own is every forbidden package at once, which is what proves the
 *             leak detector fires at all rather than reporting zero forever.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { addedPackageCount, installedBytes } from '../descix-sdk/scripts/pack-set.mjs';
import { MAX_PACKAGES, MAX_BYTES } from '../descix-sdk/scripts/check-install-size.mjs';
import { registryLatest, registryDependencies, registryVersions } from './registry.mjs';

export { MAX_PACKAGES, MAX_BYTES };

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
export function runPublishedInstallGate(spec, { checkSize = true } = {}) {
    const at = spec.lastIndexOf('@');
    const name = at > 0 ? spec.slice(0, at) : spec;

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-published-'));
    fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: 'published-install-probe', version: '1.0.0', private: true }) + '\n'
    );

    const report = {
        green: false, spec, name, dir, installed: false,
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

    if (checkSize) {
        const appHalf = publishedAppHalfPackages();
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
