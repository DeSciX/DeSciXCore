#!/usr/bin/env node
/**
 * sync-licenses.mjs — ONE owner for the licence text shipped in every published package.
 *
 * THE DEFECT THIS CLOSES (measured 2026-08-21, ws-devplane/license-metadata):
 * every publishable package in this repo shipped with NO licence file at all, and three of
 * them were already live on npm — @descix/sdk and @descix/cli declaring a bare path fragment
 * that is neither valid SPDX nor npm's `SEE LICENSE IN <file>` form, and @descix/app-sdk
 * declaring UNLICENSED (all-rights-reserved) on a developer-facing SDK. Consumers therefore
 * received no licence grant on its own stated terms.
 *
 * THE SHAPE (SUPER-DRY, same pattern as templates/DeSciXAppSDK.template.js + its --check gate):
 * repo-root LICENSE.md is the single in-repo owner; this script COPIES it into each publishable
 * package. Nobody hand-pastes a licence, so six copies cannot drift into five-plus-one.
 *
 * UPSTREAM SOURCE: the root LICENSE.md is itself generated from the canonical LaTeX the licence
 * is authored in — Unkamon repo DeSciX/DSCL/DeSciX_Community_License_v1.tex. That file lives in a
 * DIFFERENT repo, so it cannot be a build-time dependency here; the root copy is the vendored
 * boundary and its header names the regeneration command. The .tex changing is a deliberate,
 * rare, human act — regenerate the root file then re-run this script.
 *
 * Usage:
 *   node scripts/sync-licenses.mjs            write the per-package copies
 *   node scripts/sync-licenses.mjs --check    verify they match; exit 1 and NAME the drift
 *
 * --check is the CI gate. It fails loud: no auto-repair, no warning-and-continue.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(REPO_ROOT, 'LICENSE.md');

/**
 * Packages that ship the DeSciX Community License.
 *
 * cryptoapis-sdk is DELIBERATELY ABSENT: it is vendored third-party code and correctly declares
 * UNLICENSED (proprietary). Note UNLICENSED is not the `Unlicense` public-domain licence — that
 * one-keystroke difference had dedicated this vendored code to the public domain until it was
 * corrected in Core 768320d. Do not "fix" cryptoapis by adding it here.
 */
const PACKAGES = [
    'descix-cloud-core',
    'descix-platform-api',
    'descix-app-sdk',
    'descix-sdk',
    'descix-cli',
    'descix-vscode',
];

const check = process.argv.includes('--check');

if (!existsSync(SOURCE)) {
    console.error(`sync-licenses: canonical ${SOURCE} is MISSING. It is the one owner of the licence text; regenerate it from DeSciX/DSCL/DeSciX_Community_License_v1.tex before publishing anything.`);
    process.exit(1);
}
const canonical = readFileSync(SOURCE, 'utf8');

const drifted = [];
const missing = [];
let written = 0;

for (const pkg of PACKAGES) {
    const pkgDir = join(REPO_ROOT, pkg);
    if (!existsSync(join(pkgDir, 'package.json'))) {
        console.error(`sync-licenses: ${pkg} has no package.json — the package list is stale. Fix the list, do not skip silently.`);
        process.exit(1);
    }
    const target = join(pkgDir, 'LICENSE.md');
    if (check) {
        if (!existsSync(target)) missing.push(pkg);
        else if (readFileSync(target, 'utf8') !== canonical) drifted.push(pkg);
    } else {
        writeFileSync(target, canonical);
        written++;
    }
}

if (check) {
    if (missing.length || drifted.length) {
        console.error('sync-licenses --check FAILED.');
        if (missing.length) console.error(`  MISSING LICENSE.md: ${missing.join(', ')}`);
        if (drifted.length) console.error(`  DRIFTED from root LICENSE.md: ${drifted.join(', ')}`);
        console.error('  Run: node scripts/sync-licenses.mjs');
        process.exit(1);
    }
    console.log(`sync-licenses --check OK — ${PACKAGES.length} packages carry the canonical licence.`);
} else {
    console.log(`sync-licenses: wrote ${written} package LICENSE.md copies from ${SOURCE}.`);
}
