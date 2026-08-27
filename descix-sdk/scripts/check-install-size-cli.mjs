#!/usr/bin/env node
/**
 * Run the install-size gate and exit non-zero when it is RED.
 * Usage: node scripts/check-install-size-cli.mjs
 */
import { runInstallSizeGate, MAX_PACKAGES, MAX_BYTES } from './check-install-size.mjs';

const r = runInstallSizeGate();

console.log(
    `microservice-only consumer: ${r.packages} packages, ` +
    `${(r.bytes / 1024 / 1024).toFixed(1)}MB installed`
);
console.log(
    `checked ${r.forbiddenCount} app-half package(s) for leakage; ` +
    `${r.leaked.length} present` + (r.leaked.length ? `: ${r.leaked.join(', ')}` : '')
);

if (r.green) {
    console.log(
        `install-size gate GREEN — the app half is absent, and the install is within ` +
        `${MAX_PACKAGES} packages / ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB.`
    );
} else {
    console.error('install-size gate RED');
    for (const f of r.failures) console.error(`  ${f}`);
    process.exitCode = 1;
}
