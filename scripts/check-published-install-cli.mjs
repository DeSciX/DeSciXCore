#!/usr/bin/env node
/**
 * Install a PUBLISHED artifact from the registry and exit non-zero if it does not install cleanly.
 *
 *   node scripts/check-published-install-cli.mjs --dir  descix-sdk
 *   node scripts/check-published-install-cli.mjs --spec @descix/sdk@1.1.0
 *   node scripts/check-published-install-cli.mjs --dir  descix-sdk --wait
 *
 * --dir  resolves name@version from that package's OWN package.json, so the workflow passes the
 *        guard's resolved package straight through and the job checks exactly what this run
 *        published.
 *        The name is never hand-mapped from the directory.
 * --spec names an explicit published version. This is what makes the gate runnable against a
 *        NEGATIVE CONTROL — a known-broken published artifact — without publishing anything.
 * --wait polls until the version is visible on the registry before installing. Only meaningful
 *        straight after a publish; harmless otherwise.
 *
 * WHICH ASSERTIONS RUN IS NOT THIS CLI'S DECISION. Every routed package is checked for a clean
 * install; the app-half leak assertion and the size ceilings belong to their owner and
 * check-published-install.mjs scopes them from the spec. There is deliberately no flag here that
 * turns either half on or off — a gate whose scope a caller can set is a gate that reports
 * whatever the caller wanted to hear.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    runPublishedInstallGate, waitForRegistry, parseSpec,
    MAX_PACKAGES, MAX_BYTES, LEAK_AND_CEILING_OWNER,
} from './check-published-install.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const valueOf = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? null : argv[i + 1];
};
const dirArg = valueOf('--dir');
const specArg = valueOf('--spec');
const wait = argv.includes('--wait');

// --no-size is GONE, and using it is an error rather than a no-op. It used to let the caller
// suppress the leak and ceiling assertions; those are now scoped by their owner inside the gate
// module, so the flag could only ever express a policy the caller is no longer entitled to set.
// Silently ignoring it would let a workflow keep passing it and believe it still did something.
if (argv.includes('--no-size')) {
    console.error(
        '--no-size has been removed, and this is a hard failure rather than a no-op.\n' +
        'The caller no longer decides which assertions run: check-published-install.mjs scopes\n' +
        `the app-half leak assertion and the size ceilings to ${LEAK_AND_CEILING_OWNER}, from the\n` +
        'spec it is handed. Drop the flag — for any other routed package those assertions were\n' +
        'already not running, and for that one they are not optional.'
    );
    process.exit(2);
}

if ((!dirArg && !specArg) || (dirArg && specArg)) {
    console.error('usage: check-published-install-cli.mjs (--dir <package-directory> | --spec <name@version>) [--wait]');
    process.exit(2);
}

let spec = specArg;
if (dirArg) {
    const manifest = path.join(path.resolve(REPO_ROOT, dirArg), 'package.json');
    if (!fs.existsSync(manifest)) {
        console.error(`check-published-install: no package.json at ${manifest}`);
        process.exit(2);
    }
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    spec = `${pkg.name}@${pkg.version}`;
}

const { name, version } = parseSpec(spec);

if (wait && version) {
    const w = waitForRegistry(name, version);
    console.log(`registry visibility for ${spec}: ${w.visible ? 'visible' : 'NOT VISIBLE'} after ${w.attempts} attempt(s)`);
    if (!w.visible) {
        console.error(
            `RED — ${spec} never became visible on the registry. Either the publish did not ` +
            `happen or propagation is far outside its normal window. NOT reporting this as a ` +
            `broken package: it is an unanswered question, and they are different facts.`
        );
        process.exit(1);
    }
}

const r = runPublishedInstallGate(spec);

console.log(`post-publish install gate: ${spec}`);
console.log(`  clean directory: ${r.dir}`);
console.log(`  installs from registry: ${r.installed ? 'YES' : 'NO'}`);
if (r.installed) {
    console.log(`  ${r.packages} packages, ${(r.bytes / 1024 / 1024).toFixed(1)}MB installed`);
    if (r.leakAndCeilings) {
        console.log(
            `  app half derived from the REGISTRY at @descix/app-sdk@${r.appHalf.version}: ` +
            `${r.appHalf.names.length} package(s) forbidden; ${r.leaked.length} present` +
            (r.leaked.length ? `: ${r.leaked.join(', ')}` : '')
        );
        console.log(`  ceilings (owned by descix-sdk/scripts/check-install-size.mjs): ${MAX_PACKAGES} packages / ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB`);
    } else {
        // Say what was NOT measured. A gate that quietly checks less than the reader assumes is
        // the same defect as a gate that cannot fail — the number above is an observation here,
        // not a threshold anything was compared against.
        console.log(
            `  leak assertion and size ceilings: NOT APPLIED. They belong to ` +
            `${LEAK_AND_CEILING_OWNER}, and ${r.name} is not it. The package count above is ` +
            `reported, not gated — no ceiling is designed for this package.`
        );
    }
}
console.log('');

if (r.green) {
    console.log(`GREEN — ${spec} installs cleanly from the registry into an empty directory.`);
    console.log('');
    console.log('        WHAT THIS DOES NOT LICENSE YOU TO BELIEVE: it proves the artifact');
    console.log(`        RESOLVES AND INSTALLS${r.leakAndCeilings
        ? ', and that it is within the size ceilings'
        : ' — and NOTHING about size, which is not gated for this package'}. It does`);
    console.log('        NOT import or execute the package, so a broken main/exports path, a');
    console.log('        missing build output inside the tarball, or a runtime crash on first');
    console.log('        require all pass this gate. Lifecycle scripts DO run, so a failing');
    console.log('        postinstall is caught — but only because npm itself fails the install.');
} else {
    console.error(`RED — ${spec}`);
    console.error('');
    for (const f of r.failures) console.error(`  - ${f}\n`);
    process.exitCode = 1;
}

r.cleanup();
