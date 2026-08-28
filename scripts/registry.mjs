/**
 * The ONE OWNER of "what the npm registry currently says".
 *
 * WHY IT EXISTS (measured 2026-08-27): @descix/sdk@1.1.0 published on a green run and is
 * uninstallable. It declares `@descix/cloud-core: ^1.1.0`; the registry carries cloud-core 1.0.1
 * only, so `npm install @descix/sdk` exits 1 with ETARGET — and that is the `latest` tag. Nothing
 * caught it because "the package appeared on the registry" was the gate, and no gate anywhere
 * asked the registry a question.
 *
 * Every registry fact in this repo is read THROUGH here. The monorepo already has an owner of
 * monorepo truth (descix-sdk/scripts/pack-set.mjs::monorepoPackages, filesystem-only by
 * construction); this is the registry-plane counterpart, and the two must never be merged —
 * measuring one against the other's state is the whole bug.
 *
 * RANGE SATISFACTION IS DELEGATED TO npm, NOT RE-DERIVED. `npm view "<name>@<range>" version`
 * makes npm resolve the range against the real registry with the same resolver `npm install`
 * uses. Hand-rolling semver here would be a second implementation of the one fact that matters,
 * and it would disagree with the installer on exactly the edge cases a gate is for.
 */
import { execFileSync } from 'node:child_process';

/** Run `npm <args>`, returning { ok, stdout, stderr }. Never throws; the caller branches. */
function npm(args) {
    try {
        const stdout = execFileSync('npm', args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            maxBuffer: 32 * 1024 * 1024,
        });
        return { ok: true, stdout, stderr: '' };
    } catch (err) {
        return {
            ok: false,
            stdout: (err.stdout || '').toString(),
            stderr: (err.stderr || err.message || '').toString(),
        };
    }
}

/**
 * Every version of `name` on the registry, newest last.
 *
 * Throws when the registry cannot be reached or answers something unparseable. That is
 * deliberate: "I could not ask" and "the answer is no" are different facts, and a gate that
 * collapses them reports a network blip as a broken package (or, far worse, the reverse).
 */
export function registryVersions(name) {
    const r = npm(['view', name, 'versions', '--json']);
    if (!r.ok) {
        if (/E404/.test(r.stderr) && !/No match found for version/.test(r.stderr)) return [];
        throw new Error(
            `registryVersions(${name}): npm view failed, and this is NOT the same as "no such ` +
            `version". Refusing to guess.\n  ${r.stderr.trim().split('\n').slice(-4).join('\n  ')}`
        );
    }
    const parsed = JSON.parse(r.stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * The version the registry would resolve `range` to, or null when nothing on the registry
 * satisfies it. `name` is checked for existence first so an absent PACKAGE is distinguishable
 * from a present package with an unsatisfiable RANGE — a caller that cannot tell those apart
 * cannot write a useful error message.
 */
export function resolveOnRegistry(name, range) {
    const versions = registryVersions(name);
    if (versions.length === 0) return { published: false, resolved: null, versions };

    const r = npm(['view', `${name}@${range}`, 'version', '--json']);
    if (!r.ok) {
        if (/No match found for version/.test(r.stderr) || /E404/.test(r.stderr)) {
            return { published: true, resolved: null, versions };
        }
        throw new Error(
            `resolveOnRegistry(${name}@${range}): npm view failed for a reason that is not ` +
            `"no matching version". Refusing to report an unreachable registry as an ` +
            `unsatisfiable range.\n  ${r.stderr.trim().split('\n').slice(-4).join('\n  ')}`
        );
    }
    const parsed = JSON.parse(r.stdout);
    // A range matching several versions yields an array; npm's install would take the highest.
    const resolved = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
    return { published: true, resolved: resolved || null, versions };
}

/** A published package's own declared dependencies, as the REGISTRY carries them. */
export function registryDependencies(name, version) {
    const r = npm(['view', `${name}@${version}`, 'dependencies', '--json']);
    if (!r.ok) {
        throw new Error(
            `registryDependencies(${name}@${version}): npm view failed.\n` +
            `  ${r.stderr.trim().split('\n').slice(-4).join('\n  ')}`
        );
    }
    const text = r.stdout.trim();
    if (!text) return {}; // a package with no dependencies prints nothing
    return JSON.parse(text);
}

/** The version the registry's `latest` dist-tag points at. */
export function registryLatest(name) {
    const r = npm(['view', name, 'dist-tags.latest', '--json']);
    if (!r.ok) {
        throw new Error(
            `registryLatest(${name}): npm view failed.\n` +
            `  ${r.stderr.trim().split('\n').slice(-4).join('\n  ')}`
        );
    }
    return JSON.parse(r.stdout);
}
