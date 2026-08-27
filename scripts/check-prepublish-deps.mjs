/**
 * THE PRE-PUBLISH REFUSAL — "do not publish an artifact nobody can install".
 *
 * ── What went wrong, and what this fixes ─────────────────────────────────────
 * On 2026-08-27 @descix/sdk@1.1.0 published on a GREEN run and is uninstallable. It declares
 * `@descix/cloud-core: ^1.1.0`; the registry carries cloud-core 1.0.1 only. `npm install
 * @descix/sdk` exits 1 with ETARGET, and that is the `latest` tag. The publish workflow's gates
 * were checkout, a node/npm version floor, and a refusal list of packages that must never ship —
 * not one of them asks the registry a question, so "the package appeared on the registry" was the
 * only thing standing in for "the package works".
 *
 * This runs BEFORE the publish step and refuses when a declared @descix/* range cannot be
 * satisfied by what is on the registry at the moment of the click.
 *
 * ── Both classes BLOCK, and they are diagnosed DIFFERENTLY ───────────────────
 * A hard `dependencies` entry and a REQUIRED peer both make `npm install` fail outright. An
 * OPTIONAL peer does not: npm skips it, the install succeeds, and the consumer silently cannot
 * obtain the half the package advertises. That is a worse shape than ETARGET, not a milder one —
 * ETARGET at least says something. So both classes block.
 *
 * But they block with DIFFERENT SENTENCES, and that is load-bearing rather than cosmetic. A gate
 * that blocks mysteriously is one an operator learns to route around; a block that names the
 * class and the fix is one they comply with. Never collapse these two messages into one.
 *
 * ── The publish ORDER this mechanizes ────────────────────────────────────────
 * cloud-core and app-sdk before sdk. The runbook already says so in prose, and a documented rule
 * that nothing enforces is precisely what produced the P0 above.
 *
 * ── The negative control this gate is required to survive ────────────────────
 * Run it against descix-sdk while the registry carries cloud-core 1.0.1: it must go RED naming
 * @descix/cloud-core@^1.1.0. That RED is on the record before any GREEN from this file counts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveOnRegistry } from './registry.mjs';

/** The scope this gate speaks for. Third-party ranges are out of scope — see the CLI's boundary. */
export const SCOPE = '@descix/';

/**
 * Every @descix/* range `pkg` declares, tagged with the class that decides its diagnosis.
 * Derived from the package's own manifest — a hand list here would be a second copy of a fact
 * package.json already owns, and it would go stale the first time someone adds a dependency.
 */
export function descixRanges(pkg) {
    const out = [];
    const optionalMeta = pkg.peerDependenciesMeta || {};

    for (const [name, range] of Object.entries(pkg.dependencies || {})) {
        if (name.startsWith(SCOPE)) out.push({ name, range, kind: 'dependency' });
    }
    for (const [name, range] of Object.entries(pkg.peerDependencies || {})) {
        if (!name.startsWith(SCOPE)) continue;
        const optional = optionalMeta[name] && optionalMeta[name].optional === true;
        out.push({ name, range, kind: optional ? 'optional-peer' : 'required-peer' });
    }
    return out;
}

/** The sentence an operator reads. Different per class, deliberately. */
function diagnose({ name, range, kind, published, versions }) {
    const have = published
        ? `the registry has ${versions.join(', ')}`
        : `${name} is not published at all`;

    if (kind === 'optional-peer') {
        return (
            `OPTIONAL PEER UNOBTAINABLE — ${name}@${range}: ${have}. This package WILL install; ` +
            `npm skips optional peers. But the optional half it advertises cannot be obtained by ` +
            `anyone, and the consumer gets no error saying so. Publish ${name} at a version ` +
            `satisfying ${range} FIRST, then publish this package.`
        );
    }
    const label = kind === 'dependency' ? 'DEPENDENCY' : 'REQUIRED PEER';
    return (
        `${label} UNSATISFIABLE — ${name}@${range}: ${have}. This package WILL NOT INSTALL AT ` +
        `ALL: npm exits with ETARGET the moment anyone runs npm install. Publish ${name} at a ` +
        `version satisfying ${range} FIRST, then publish this package.`
    );
}

/**
 * Run the gate against a package directory. Returns a report; never throws for a RED result —
 * the caller decides how to present it, and the negative control needs to READ a red report
 * rather than catch a stack. A registry that cannot be REACHED still throws, because "I could
 * not ask" is not "the answer is no".
 */
export function runPrepublishDepGate(packageDir) {
    const manifest = path.join(packageDir, 'package.json');
    if (!fs.existsSync(manifest)) {
        throw new Error(`check-prepublish-deps: no package.json at ${manifest}`);
    }
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    const ranges = descixRanges(pkg);

    const checked = [];
    const failures = [];
    for (const entry of ranges) {
        const { published, resolved, versions } = resolveOnRegistry(entry.name, entry.range);
        checked.push({ ...entry, published, resolved, versions });
        if (!resolved) failures.push(diagnose({ ...entry, published, versions }));
    }

    return {
        green: failures.length === 0,
        packageName: pkg.name,
        packageVersion: pkg.version,
        packageDir,
        checked,
        failures,
    };
}
