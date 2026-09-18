/**
 * A dry run NAMES the stale files a real sync would delete (GODSWORLD-DEV, 2026-09-18: a count
 * alone gave the operator no way to know WHICH documents would go).
 *
 * Run: node --test tests/stale-blob-names.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseFindObjectRaw, describeStaleBlobs } from '../lib/core/staleBlobNames.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'commands', 'corpus.js'), 'utf8');
const A = '0a365bb774a2a92b387eba296e2141f9ec9b7dd6';
const B = '5d9eccbf87370da2d40a53047e9e2189ee489882';
const RAW = `014ab98e1d2dd641ed4f361caf473d82dfffdea2\n\n:100644 100644 ${A} ${B} M\tDeSciX/V2_docs/README.md\n`;

test('a blob REPLACED in a commit is found on the old side', () => {
    assert.deepEqual(parseFindObjectRaw(RAW, A), { commit: '014ab98e1d2dd641ed4f361caf473d82dfffdea2', path: 'DeSciX/V2_docs/README.md' });
});

test('a blob ADDED in a commit is found on the new side', () => {
    assert.equal(parseFindObjectRaw(RAW, B).path, 'DeSciX/V2_docs/README.md');
});

test('NEGATIVE CONTROL: a blob the output does not mention is not named', () => {
    assert.equal(parseFindObjectRaw(RAW, 'f'.repeat(40)), null);
    assert.equal(parseFindObjectRaw('', A), null);
});

test('a rename line reports the path the blob lives at now', () => {
    const raw = `abc1234\n\n:100644 100644 ${A} ${A} R100\told/name.md\tnew/name.md\n`;
    assert.equal(parseFindObjectRaw(raw, A).path, 'new/name.md');
});

test('LIVE: a real blob from THIS repository resolves to its real path', () => {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: __dirname, encoding: 'utf-8' }).trim();
    const sha = execFileSync('git', ['rev-parse', 'HEAD:descix-cli/package.json'], { cwd: root, encoding: 'utf-8' }).trim();
    const [hit] = describeStaleBlobs([`corpus:${sha}`], [root]);
    assert.equal(hit.path, 'descix-cli/package.json');
});

test('an unknown blob is reported as unnamed, never guessed', () => {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: __dirname, encoding: 'utf-8' }).trim();
    const [hit] = describeStaleBlobs([`corpus:${'e'.repeat(40)}`], [root]);
    assert.equal(hit.path, null);
});

test('the dry run prints a name for each stale file', () => {
    assert.match(CORPUS, /describeStaleBlobs\(fileIdsToDelete, repoRoots\)/);
    assert.match(CORPUS, /cannot be named/);
});
