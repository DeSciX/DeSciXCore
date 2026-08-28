#!/usr/bin/env node
/**
 * Run the pre-publish dependency refusal and exit non-zero when it is RED.
 *
 *   node scripts/check-prepublish-deps-cli.mjs <package-directory>
 *
 * The publish job passes the guard's resolved package here, which IS a directory name, so the
 * gate checks exactly the package this run is about to publish.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPrepublishDepGate, SCOPE } from './check-prepublish-deps.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const arg = process.argv[2];
if (!arg) {
    console.error('usage: check-prepublish-deps-cli.mjs <package-directory>');
    process.exit(2);
}
const dir = path.resolve(REPO_ROOT, arg);

const r = runPrepublishDepGate(dir);

console.log(`pre-publish dependency gate: ${r.packageName}@${r.packageVersion} (${arg})`);
if (r.checked.length === 0) {
    console.log(`  declares NO ${SCOPE}* ranges — nothing for this gate to satisfy.`);
} else {
    for (const c of r.checked) {
        const verdict = c.resolved ? `OK -> ${c.resolved}` : 'UNSATISFIABLE';
        console.log(`  ${c.kind.padEnd(14)} ${c.name}@${c.range}  ${verdict}`);
    }
}
console.log('');

if (r.green) {
    console.log('GREEN — every @descix/* range this package declares is satisfiable on the registry now.');
    console.log('');
    console.log('        WHAT THIS DOES NOT LICENSE YOU TO BELIEVE: it checks @descix/* ranges');
    console.log('        ONLY. A broken THIRD-PARTY range, a wrong `files` list, a missing build');
    console.log('        artifact, or a postinstall that throws all pass this gate untouched —');
    console.log('        that is what the post-publish install job exists to catch. A package');
    console.log('        declaring no @descix/* ranges passes VACUOUSLY: nothing was resolved.');
} else {
    console.error('RED — refusing to publish: this artifact would be broken on the registry.');
    console.error('');
    for (const f of r.failures) console.error(`  - ${f}\n`);
    process.exitCode = 1;
}
