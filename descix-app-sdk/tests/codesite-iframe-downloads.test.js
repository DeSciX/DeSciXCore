/**
 * CodeSite iframe may hand the visitor a file (GODSWORLD seam).
 *
 * THE DEFECT: an embedded app's `<a download href="blob:…">` click is dropped silently,
 * because the CodeSiteWidget iframe sandbox lacks `allow-downloads`. Measured on the
 * GODSWORLD side: a test frame with the shell's literal sandbox value reproduces the
 * silent drop; adding the one token makes the download land.
 *
 * THE GATE (source conformance on the one iframe): the sandbox token list must carry
 * `allow-downloads`. The frame already holds allow-scripts + allow-same-origin on the
 * shell's origin, so the token removes no barrier.
 *
 * Run: node --test descix-app-sdk/tests/codesite-iframe-downloads.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/components/CodeSiteWidget.jsx'),
    'utf8'
);

const sandboxMatch = src.match(/sandboxPermissions = '([^']*)'/);

test('the sandbox lets an embedded app trigger a download (Blob + download attribute)', () => {
    assert.ok(sandboxMatch, 'sandboxPermissions declaration not found');
    const tokens = sandboxMatch[1].split(/\s+/);
    assert.ok(
        tokens.includes('allow-downloads'),
        `sandbox must carry allow-downloads; got: ${sandboxMatch[1]}`
    );
});
