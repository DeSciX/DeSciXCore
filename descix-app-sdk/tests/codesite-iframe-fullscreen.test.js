/**
 * CodeSite iframe fullscreen delegation (FRAQTL seam via CEO-COMMS, 2026-10-11).
 *
 * THE DEFECT: the GYM's fullscreen button inside the shell records a DENIED
 * requestFullscreen — the CodeSiteWidget iframe is cross-origin from the shell and
 * carries no `allow="fullscreen"` permission policy, so the browser refuses the app's
 * request. VideoPlayerWidget already delegates (allow="autoplay; fullscreen; …");
 * the CodeSite frame is the one app surface that did not.
 *
 * THE GATE (source conformance on the one iframe): the CodeSiteWidget iframe must carry
 * an `allow` containing `fullscreen` plus the legacy `allowFullScreen` React prop, and
 * the sandbox tokens must keep `allow-same-origin` + `allow-scripts` (interframe
 * scripting depends on them — a fullscreen fix that drops a sandbox token is a worse
 * defect than the one it closes).
 *
 * Run: node --test descix-app-sdk/tests/codesite-iframe-fullscreen.test.js
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

// The one <iframe … /> element block.
const iframeMatch = src.match(/<iframe\b[\s\S]*?\/>/);

test('CodeSiteWidget renders exactly one iframe element', () => {
    assert.ok(iframeMatch, 'the CodeSite iframe element was not found');
    assert.equal((src.match(/<iframe\b/g) || []).length, 1);
});

test('the iframe delegates fullscreen (allow policy + legacy allowFullScreen)', () => {
    const el = iframeMatch[0];
    assert.match(el, /allow=["'][^"']*fullscreen[^"']*["']/, 'iframe must carry allow="fullscreen"');
    assert.match(el, /allowFullScreen/, 'iframe must carry the legacy allowFullScreen prop');
});

test('the sandbox keeps the tokens interframe scripting depends on', () => {
    assert.match(src, /sandboxPermissions = '[^']*allow-same-origin[^']*'/);
    assert.match(src, /sandboxPermissions = '[^']*allow-scripts[^']*'/);
});
