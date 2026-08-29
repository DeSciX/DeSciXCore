/**
 * THE ONE OWNER OF "what version of the CLI is this".
 *
 * WHY THIS FILE EXISTS (measured, not assumed): PUBLISHED @descix/cli@1.0.1 declares version
 * 1.0.1 in its package.json and prints `1.0.0` from `bin/descix.js:35`'s `.version('1.0.0')`.
 * The same disagreement was live in the repo at 1.0.3. Two derivations of one fact is the
 * general form of mirror drift, and this is its purest instance: the manifest is the version,
 * and a literal beside it is a copy that can only go stale. There is now exactly one derivation,
 * and every self-report consumes it.
 *
 * NO FALLBACK. A package root whose manifest cannot be read has no version, and inventing one
 * is precisely the class of defect this contract exists to end — an artifact reporting something
 * the developer did not choose. A miss THROWS, naming what it could not determine.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Read the version out of a package root's manifest, or throw naming the failure.
 * @param {string} packageRoot - directory containing package.json
 * @returns {string} the manifest's `version`
 */
export function readVersionFrom(packageRoot) {
    const manifest = path.join(packageRoot, 'package.json');

    let raw;
    try {
        raw = fs.readFileSync(manifest, 'utf8');
    } catch (error) {
        throw new Error(
            `descix: cannot determine its own version — ${manifest} is unreadable (${error.code || error.message}). ` +
            `The version is read from the package manifest at runtime and has no default.`,
        );
    }

    let pkg;
    try {
        pkg = JSON.parse(raw);
    } catch (error) {
        throw new Error(
            `descix: cannot determine its own version — ${manifest} is not valid JSON (${error.message}).`,
        );
    }

    if (typeof pkg.version !== 'string' || pkg.version.trim() === '') {
        throw new Error(
            `descix: cannot determine its own version — ${manifest} declares no non-empty "version".`,
        );
    }

    return pkg.version;
}

/** This package's root: lib/ sits one level under it, in the checkout and in the published tarball alike. */
export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The CLI's version. The ONLY place any surface should read it from. */
export const CLI_VERSION = readVersionFrom(PACKAGE_ROOT);
