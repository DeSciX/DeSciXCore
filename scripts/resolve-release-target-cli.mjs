#!/usr/bin/env node
/**
 * Run the release router and report its decision the way the guard job needs it.
 *
 *   EVENT_NAME=release TAG=<package-dir>-v<version> node scripts/resolve-release-target-cli.mjs
 *   EVENT_NAME=workflow_dispatch INPUT_PACKAGE=<dir> CONFIRM_VERSION=<version> \
 *       INPUT_DIST_TAG=latest node scripts/resolve-release-target-cli.mjs
 *
 * EVERY INPUT ARRIVES BY ENVIRONMENT, none by `${{ }}` interpolation into the shell. Two reasons,
 * and both are load-bearing. A release tag is attacker-influenceable text and interpolating it
 * into a `run:` block is script injection. And an env-driven step is one anybody can run locally,
 * character for character, with no workflow dispatch — which is the only way a gate gets shown RED
 * on a negative control before it is trusted.
 *
 * EXIT CODES ARE THE CONTRACT, and there are three, not two:
 *   0 + should_publish=true   route settled, versions agree.
 *   0 + should_publish=false  this release is not ours. Skipping is a decision, not a failure.
 *   1                         REFUSED. The run must go red with the reason printed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflowPublishSets, WORKFLOW_PATH } from './publish-set.mjs';
import { resolveReleaseTarget, packageVersion } from './resolve-release-target.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const env = (k) => (process.env[k] || '').trim();

const { publishable } = workflowPublishSets(
    fs.readFileSync(path.join(REPO_ROOT, WORKFLOW_PATH), 'utf8')
);

const result = resolveReleaseTarget({
    event: env('EVENT_NAME'),
    tag: env('TAG'),
    inputPackage: env('INPUT_PACKAGE'),
    confirmVersion: env('CONFIRM_VERSION'),
    distTag: env('INPUT_DIST_TAG'),
    publishable,
    readVersion: (dir) => packageVersion(REPO_ROOT, dir),
});

console.log(`release router: event='${env('EVENT_NAME')}' tag='${env('TAG')}' input_package='${env('INPUT_PACKAGE')}'`);
console.log(`  publishable set (from ${WORKFLOW_PATH}): ${publishable.join(', ')}`);
console.log('');

/** The guard job's outputs. Written only here, so no step re-derives one of these four. */
function emit(pairs) {
    const text = Object.entries(pairs).map(([k, v]) => `${k}=${v}`).join('\n');
    console.log(text);
    const out = process.env.GITHUB_OUTPUT;
    if (out) fs.appendFileSync(out, `${text}\n`);
    else console.log('\n(GITHUB_OUTPUT is unset — printing outputs instead of writing them.)');
}

if (result.decision === 'refuse') {
    console.error(`::error::${result.reason}`);
    console.error('');
    console.error('RED — refusing to publish.');
    process.exit(1);
}

if (result.decision === 'skip') {
    console.log(result.reason);
    console.log('');
    emit({ should_publish: 'false' });
    process.exit(0);
}

console.log(`GREEN — ${result.reason}`);
console.log('');
console.log('        WHAT THIS DOES NOT LICENSE YOU TO BELIEVE: it has settled WHICH package and');
console.log('        that the tag and package.json agree about its version. It has asked the');
console.log('        registry nothing, and it has not looked inside the artifact. The dependency');
console.log('        refusal and the post-publish install check are what do that, and they run');
console.log('        on this path too.');
console.log('');
emit({
    should_publish: 'true',
    package: result.package,
    version: result.version,
    dist_tag: result.distTag,
});
