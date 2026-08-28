/**
 * THE RELEASE ROUTER — "which package is this run about, and is its version the one it claims?"
 *
 * ── Why a router exists at all ───────────────────────────────────────────────
 * Publishing is domain authority under a signed contract, not a human click (CEO 2026-08-28,
 * "(A) align with FRQTL"). The trigger is therefore a GitHub RELEASE, and a release event carries
 * no per-package signal: `release:` supports no `paths:` filter, and one repo publishes three
 * packages. The tag is the only routing signal there is, so this file makes that signal EXPLICIT
 * and FAIL-LOUD instead of letting an ambiguous tag publish a confused version.
 *
 * ── The routing trap, and why the match is anchored and exact ────────────────
 * More than one package directory shares a trailing segment today. Any matcher that asks "does the
 * tag CONTAIN this package name", or that globs on a suffix such as `*-sdk-v*`, answers YES for
 * more than one package on at least one real tag, and a router that takes the first yes publishes
 * the wrong directory under the right version number. The set is not listed here — this file must
 * not carry a second copy of it; scripts/tests/release-target.test.mjs prints the live set and the
 * candidates each matcher produces for it, so the trap is measured rather than described.
 *
 * So the match is: the tag must START with the package directory followed by the literal `-v`.
 * That is the exact package SEGMENT preceding the version, anchored at position 0, compared as a
 * string — not a glob, not a substring, not a regex assembled from a name.
 *
 * And the router does not stop at the first match. It collects ALL of them and REFUSES when there
 * is more than one. Today no two of the three prefixes can both match a tag, and the suite proves
 * that by control. The point of the refusal is the day someone adds a fourth package whose name
 * makes two prefixes collide: on that day this fails loudly at the guard instead of publishing
 * whichever directory happened to be listed first.
 *
 * ── What it deliberately does NOT own ────────────────────────────────────────
 * The publish SET. That belongs to the workflow file and is read through scripts/publish-set.mjs.
 * A list of package names typed into this file would be a second copy of the one fact the whole
 * workflow is keyed on.
 */
import fs from 'node:fs';
import path from 'node:path';

/** The literal that separates the package segment from the version in a release tag. */
export const TAG_INFIX = '-v';

/** The tag form, for messages. Stated once so no error string re-derives it. */
export const tagForm = (dir) => `${dir}${TAG_INFIX}<version>`;

/**
 * Every package in `publishable` whose tag prefix the tag actually carries.
 *
 * Exported because the negative controls drive THIS, directly, with tags no release will ever
 * carry. A router whose matcher can only be reached through the CLI can only be tested through a
 * publish, and a publish workflow cannot be dispatched to test a gate.
 */
export function routeCandidates(tag, publishable) {
    const t = String(tag ?? '');
    return publishable.filter((dir) => {
        const prefix = `${dir}${TAG_INFIX}`;
        return t.startsWith(prefix) && t.length > prefix.length;
    });
}

/** The version a tag names for a package, or null when that package's prefix is not the tag's. */
export function versionFromTag(tag, dir) {
    const prefix = `${dir}${TAG_INFIX}`;
    const t = String(tag ?? '');
    return t.startsWith(prefix) && t.length > prefix.length ? t.slice(prefix.length) : null;
}

/** The version a package directory declares. The tree owns this; nothing here mirrors it. */
export function packageVersion(repoRoot, dir) {
    const manifest = path.join(repoRoot, dir, 'package.json');
    if (!fs.existsSync(manifest)) {
        throw new Error(`resolve-release-target: no package.json at ${manifest}`);
    }
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (!pkg.version) throw new Error(`resolve-release-target: ${manifest} declares no version`);
    return { name: pkg.name, version: pkg.version };
}

/**
 * Decide what this run publishes.
 *
 * Returns a REPORT and never throws for a RED result: the negative controls have to READ a red
 * report rather than catch a stack, and a caller that can only see an exception cannot print the
 * sentence an operator needs. Three outcomes, and they are three, never two:
 *
 *   { decision: 'publish' }  route settled, version agrees — the publish job may run.
 *   { decision: 'skip'    }  this release belongs to no package here. Exit 0. NOT a failure:
 *                            a monorepo release event fires for every package's tag.
 *   { decision: 'refuse'  }  the run must FAIL, loudly, with `reason` naming both sides.
 *
 * `event` is GitHub's `github.event_name`. Anything other than `release` or `workflow_dispatch`
 * REFUSES rather than defaulting: a trigger nobody designed for is not a trigger to guess at.
 */
export function resolveReleaseTarget({
    event,
    tag = '',
    inputPackage = '',
    confirmVersion = '',
    distTag = '',
    publishable,
    readVersion,
}) {
    if (!Array.isArray(publishable) || publishable.length === 0) {
        return { decision: 'refuse', reason: 'resolve-release-target: no publishable set was supplied.' };
    }
    const forms = publishable.map(tagForm).join(', ');

    if (event === 'release') {
        const candidates = routeCandidates(tag, publishable);

        if (candidates.length === 0) {
            return {
                decision: 'skip',
                reason:
                    `Tag '${tag}' names no package published from this repository (expected one of: ` +
                    `${forms}). This release belongs somewhere else — skipping, which is not a failure.`,
            };
        }
        if (candidates.length > 1) {
            return {
                decision: 'refuse',
                reason:
                    `AMBIGUOUS TAG — '${tag}' matches the release-tag prefix of more than one package: ` +
                    `${candidates.join(', ')}. Two packages cannot be published by one release, and ` +
                    `guessing which one was meant is how the wrong directory ships under the right ` +
                    `version number. Rename a package directory so the prefixes are disjoint, or fix ` +
                    `the tag.`,
            };
        }

        const dir = candidates[0];
        const tagVersion = versionFromTag(tag, dir);
        const { name, version } = readVersion(dir);
        if (tagVersion !== version) {
            return {
                decision: 'refuse',
                package: dir,
                reason:
                    `VERSION MISMATCH — release tag '${tag}' names version '${tagVersion}', but ` +
                    `${dir}/package.json is at '${version}' (${name}). Refusing to publish: the tag ` +
                    `and the artifact disagree about what this release IS. Bump package.json to ` +
                    `'${tagVersion}', or delete the release and re-tag as '${dir}${TAG_INFIX}${version}'.`,
            };
        }
        return {
            decision: 'publish',
            package: dir,
            packageName: name,
            version,
            // A release carries no dist-tag input and must not invent one: `latest` is what a
            // release of a package means, and anything else is a decision a human makes on a
            // dispatch run.
            distTag: 'latest',
            reason: `Release tag '${tag}' routes to ${dir} (${name}@${version}).`,
        };
    }

    if (event === 'workflow_dispatch') {
        if (!publishable.includes(inputPackage)) {
            return {
                decision: 'refuse',
                reason:
                    `UNKNOWN PACKAGE — '${inputPackage}' is not one of the packages this workflow ` +
                    `publishes (${publishable.join(', ')}).`,
            };
        }
        const { name, version } = readVersion(inputPackage);
        if (confirmVersion !== version) {
            return {
                decision: 'refuse',
                package: inputPackage,
                reason:
                    `CONFIRM_VERSION MISMATCH — you typed '${confirmVersion}', but ` +
                    `${inputPackage}/package.json is at '${version}' (${name}). There is no tag to ` +
                    `check on a manual run, so this input IS the check. Re-run with the exact ` +
                    `current version if this is intentional.`,
            };
        }
        return {
            decision: 'publish',
            package: inputPackage,
            packageName: name,
            version,
            distTag: distTag || 'latest',
            reason: `Manual dispatch confirmed for ${inputPackage} (${name}@${version}).`,
        };
    }

    return {
        decision: 'refuse',
        reason:
            `UNSUPPORTED TRIGGER — this workflow routes 'release' and 'workflow_dispatch' events. ` +
            `It was started by '${event}', which nothing here was designed to route. Refusing ` +
            `rather than assuming.`,
    };
}
