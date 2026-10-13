/**
 * CodeSite iframe popups escape the sandbox (FRAQTL seam, CEO report 2026-10-13).
 *
 * THE DEFECT: an outbound link from a framed app (a youtu.be link on egpt-frqtl) opens a
 * popup that lands on chrome-error://chromewebdata/. The CodeSiteWidget iframe sandbox
 * carries `allow-popups` but not `allow-popups-to-escape-sandbox`, so the popup inherits
 * the sandbox flags and an origin that answers with cross-origin-opener-policy
 * (YouTube: same-origin-allow-popups) refuses it. Measured on the FRAQTL side: the
 * shell's literal sandbox value reproduces the error page on a scratch page with no
 * DeSciX code; adding the one token makes YouTube open.
 *
 * THE GATE (source conformance on the one iframe): the sandbox token list must carry
 * `allow-popups-to-escape-sandbox` next to `allow-popups`, and must still carry the
 * tokens interframe scripting depends on (allow-same-origin + allow-scripts; that pair
 * already lets the frame escape its own sandbox, so the popup token removes no barrier).
 *
 * Run: node --test descix-app-sdk/tests/codesite-iframe-popups-escape.test.js
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

test('CodeSiteWidget declares exactly one sandbox token list', () => {
    assert.ok(sandboxMatch, 'sandboxPermissions declaration not found');
    assert.equal((src.match(/sandboxPermissions = '/g) || []).length, 1);
});

test('the sandbox lets popups escape it (outbound links from a framed app open)', () => {
    const tokens = sandboxMatch[1].split(/\s+/);
    assert.ok(tokens.includes('allow-popups'), 'allow-popups must stay');
    assert.ok(
        tokens.includes('allow-popups-to-escape-sandbox'),
        `sandbox must carry allow-popups-to-escape-sandbox; got: ${sandboxMatch[1]}`
    );
});

test('the sandbox keeps the tokens interframe scripting depends on', () => {
    const tokens = sandboxMatch[1].split(/\s+/);
    assert.ok(tokens.includes('allow-same-origin'));
    assert.ok(tokens.includes('allow-scripts'));
});
