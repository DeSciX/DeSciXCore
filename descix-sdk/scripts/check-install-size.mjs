/**
 * The INSTALL-SIZE GATE — "a microservice-only consumer does not pay for the app half".
 *
 * ── What went wrong before, and what this fixes ──────────────────────────────
 * The previous version of this acceptance was a NUMBER in a report: "241 packages / 100M,
 * PASS". It passed for the wrong reason. The app half's dependencies did not exist anywhere in
 * @descix/sdk's tree at the time — not as a dependency, not as a peer, not at all — so no edit
 * to that tree could have turned the number red. It gated a value that happened to be correct
 * rather than the mechanism that keeps it correct.
 *
 * ── Gate the MECHANISM ───────────────────────────────────────────────────────
 * The mechanism is `peerDependenciesMeta { optional: true }` on the app half. So the primary
 * assertion is not a number at all: it is that NONE of the app half's packages are present in
 * a microservice-only consumer's node_modules. The counts are a numeric backstop behind that,
 * for regressions that arrive through some path nobody predicted.
 *
 * ── The forbidden set is DERIVED ─────────────────────────────────────────────
 * It is @descix/app-sdk's OWN declared dependency list, read off disk from the package that
 * owns it, plus the package itself. A hand-typed list of "heavy things" would go stale the
 * first time app-sdk adds a dependency, and a stale forbidden list is a gate that stops
 * gating without saying so.
 *
 * ── The negative control this gate is required to survive ────────────────────
 * Flip @descix/app-sdk in package.json from `peerDependencies` + optional to a hard
 * `dependencies` entry and re-run: every assertion below must trip. That RED is shown on the
 * record before any GREEN from this file counts for anything.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
    installPackedSet, addedPackageCount, installedBytes, monorepoPackages,
} from './pack-set.mjs';

/**
 * The measured baseline for a microservice-only consumer, Core main e21fce7, 2026-08-27.
 * These are CEILINGS, not targets: the gate fails when an install grows past them, and they
 * are only ever raised deliberately, with the reason stated in the commit that raises them.
 */
export const MAX_PACKAGES = 241;
export const MAX_BYTES = 110 * 1024 * 1024;

/** The app half, as its owner declares it: the package plus everything it depends on. */
export function appHalfPackages() {
    const appSdk = monorepoPackages().get('@descix/app-sdk');
    if (!appSdk) {
        throw new Error(
            'check-install-size: @descix/app-sdk is not in this monorepo, so the forbidden set ' +
            'cannot be derived. Refusing to fall back to a hand-typed list — that is the stale ' +
            'list this gate exists to avoid.'
        );
    }
    return ['@descix/app-sdk', ...Object.keys(appSdk.pkg.dependencies || {})];
}

/** Which of `names` are physically present under `dir`/node_modules. */
export function presentIn(dir, names) {
    return names.filter((n) => fs.existsSync(path.join(dir, 'node_modules', ...n.split('/'), 'package.json')));
}

/**
 * Run the gate. Returns a report; never throws for a RED result — the caller decides how to
 * present it, and the negative control needs to READ a red report rather than catch a stack.
 */
export function runInstallSizeGate() {
    const forbidden = appHalfPackages();
    const install = installPackedSet({ includeOptionalPeers: false, label: 'size-gate' });

    try {
        const leaked = presentIn(install.dir, forbidden);
        const packages = addedPackageCount(install.npmOutput);
        const bytes = installedBytes(install.dir);

        const failures = [];
        if (leaked.length > 0) {
            failures.push(
                `${leaked.length} app-half package(s) reached a microservice-only install: ` +
                `${leaked.join(', ')}. The app half must be an OPTIONAL PEER, never a dependency.`
            );
        }
        if (packages > MAX_PACKAGES) {
            failures.push(`${packages} packages installed, ceiling is ${MAX_PACKAGES}.`);
        }
        if (bytes > MAX_BYTES) {
            failures.push(
                `${(bytes / 1024 / 1024).toFixed(1)}MB installed, ceiling is ` +
                `${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB.`
            );
        }

        return {
            green: failures.length === 0,
            failures, leaked, packages, bytes,
            forbiddenCount: forbidden.length,
            dir: install.dir,
        };
    } finally {
        install.cleanup();
    }
}
