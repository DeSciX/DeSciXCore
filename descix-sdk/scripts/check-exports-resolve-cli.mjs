#!/usr/bin/env node
/**
 * Pack this package with the siblings it is CO-PUBLISHED with, install them into a throwaway
 * empty directory, and assert every subpath its exports map declares actually resolves.
 * PUBLISHED == PACKED: the working tree is never the thing measured, because the working tree
 * resolves files the tarball does not ship.
 *
 * WHY THE SET AND NOT THE PACKAGE ALONE (measured 2026-08-27, Core main e21fce7): installing
 * the @descix/sdk tarball by itself fails ETARGET on @descix/cloud-core@^1.1.0, which is in
 * this repo but not yet on the registry — and it failed as an UNHANDLED throw, so the gate
 * stack-traced instead of reporting itself RED. These packages ship on one publish, so the set
 * is the artifact a developer receives; measuring one member against a registry state that
 * will never exist measures nothing. installPackedSet owns that, and NAMES an install failure
 * as an install failure rather than letting it read as a package defect.
 *
 * Usage:  node scripts/check-exports-resolve-cli.mjs [--package <name>] [--from <installed-dir>]
 * With --from, checks an ALREADY-installed package — that is how the RED control is run
 * against a published version pulled from the registry.
 */
import fs from 'node:fs';
import { assertExportsResolve } from './check-exports-resolve.mjs';
import { installPackedSet } from './pack-set.mjs';

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
const pkgName = arg('--package')
    || JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).name;

let from = arg('--from');
let install = null;

if (!from) {
    // Optional peers ARE included here: a subpath this package DECLARES must resolve, and
    // ./app declares a target whose peer must be installable for an app developer. Leaving the
    // peer out would let ./app "pass" purely because require.resolve stops at the re-export
    // file — a gate passing for a reason unrelated to what it claims to check.
    install = installPackedSet({ includeOptionalPeers: true, label: 'exports-gate' });
    from = install.dir;
}

try {
    const r = assertExportsResolve({ packageName: pkgName, fromDir: from });
    console.log(`exports gate GREEN — ${pkgName}@${r.version}: all ${r.checked} declared subpath(s) resolve.`);
    console.log(`  ${r.subpaths.join(' ')}`);
} catch (err) {
    console.error(`exports gate RED\n${err.message}`);
    process.exitCode = 1;
} finally {
    if (install) install.cleanup();
}
