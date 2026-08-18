/**
 * Anti-regression for `descix serve` flag plumbing.
 *
 * A subcommand option whose long name duplicates a PROGRAM-level option is
 * silently swallowed: commander binds the flag to the program, the subcommand's
 * `options.x` is undefined, and the user's explicit override is ignored with no
 * error. That happened with a serve-local `--api-url` shadowing the global one;
 * the fix is that `serve` CONSUMES the global channel (DESCIX_API_URL, written
 * by the program's preAction hook) instead of declaring a second flag.
 *
 * These are source-shape guards: comments are stripped first, so a flag named in
 * a comment (this file's own subject matter) never counts as a declaration.
 *
 * Run: `node --test tests/serve-flags.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');

/** Strip block and line comments so guards never match their own prose. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const binSrc = stripComments(fs.readFileSync(path.join(CLI_ROOT, 'bin', 'descix.js'), 'utf8'));
const serveSrc = stripComments(fs.readFileSync(path.join(CLI_ROOT, 'lib', 'commands', 'serve.js'), 'utf8'));

/** Long option names declared on the top-level program. */
function programOptionNames() {
  const block = binSrc.slice(binSrc.indexOf('program\n  .name('), binSrc.indexOf("program.hook('preAction'"));
  return [...block.matchAll(/\.option\('(--[a-z-]+)/g)].map((m) => m[1]);
}

/** Long option names declared on the `serve` subcommand. */
function serveOptionNames() {
  const start = binSrc.indexOf(".command('serve')");
  assert.ok(start > 0, "could not locate the serve command registration");
  const block = binSrc.slice(start, binSrc.indexOf('.action(', start));
  return [...block.matchAll(/\.option\('(-{1,2}[a-zA-Z-]+(?:, --[a-z-]+)?)/g)]
    .map((m) => m[1])
    .map((s) => (s.includes(', ') ? s.split(', ')[1] : s));
}

test('program declares the global --api-url / --env channel', () => {
  const names = programOptionNames();
  assert.ok(names.includes('--api-url'), `program options: ${names.join(' ')}`);
  assert.ok(names.includes('--env'), `program options: ${names.join(' ')}`);
});

test('serve declares no option that shadows a program-level option', () => {
  const collisions = serveOptionNames().filter((n) => programOptionNames().includes(n));
  assert.deepEqual(collisions, [], `serve options shadow program options: ${collisions.join(' ')}`);
});

test('serve declares --site-url (the shell target has no global equivalent)', () => {
  assert.ok(serveOptionNames().includes('--site-url'), serveOptionNames().join(' '));
});

test('runServe consumes the normalized DESCIX_API_URL channel', () => {
  assert.match(serveSrc, /process\.env\.DESCIX_API_URL/);
  assert.match(serveSrc, /siteUrl:\s*options\.siteUrl/);
});

test('runServe hands the gateway a source label for each override it passes', () => {
  assert.match(serveSrc, /apiSource:/);
  assert.match(serveSrc, /siteSource:/);
});
