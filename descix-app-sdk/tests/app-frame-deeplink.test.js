/**
 * An app's direct link passes its query and hash into the app frame (CEO 2026-09-16: "SDK should
 * pass the query and hash throughout if the target is an app direct link [app id].[env].descix.net").
 * What this catches: a shell that drops the inbound link's state (measured on PROD before this change:
 * /?preset=ide&notebook=… reached the iframe with no query), and a merge that corrupts appUrl.
 * Run: cd descix-app-sdk && node --test tests/app-frame-deeplink.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appFrameUrl } from '../src/util/appBinding.js';

const PROD_APP = '/prod/egpt-frqtl/site/index.html';

test('query and hash pass through to an origin-relative app URL', () => {
  assert.equal(
    appFrameUrl(PROD_APP, { search: '?preset=ide&notebook=frqtl-qft-benchmark', hash: '#cell-3' }),
    '/prod/egpt-frqtl/site/index.html?preset=ide&notebook=frqtl-qft-benchmark#cell-3');
});

test('hash alone, query alone, and nothing at all', () => {
  assert.equal(appFrameUrl('/p/egpt-frqtl/', { search: '', hash: '#notebook=x' }), '/p/egpt-frqtl/#notebook=x');
  assert.equal(appFrameUrl('/p/egpt-frqtl/', { search: '?a=1', hash: '' }), '/p/egpt-frqtl/?a=1');
  assert.equal(appFrameUrl(PROD_APP, { search: '', hash: '' }), PROD_APP);
  assert.equal(appFrameUrl(PROD_APP, { search: '?', hash: '#' }), PROD_APP);
});

test('absolute app URLs keep their origin; top params override, others survive', () => {
  assert.equal(
    appFrameUrl('https://egpt-frqtl.descix.net/prod/egpt-frqtl/site/index.html?v=2&mode=a', { search: '?mode=b&x=1', hash: '' }),
    'https://egpt-frqtl.descix.net/prod/egpt-frqtl/site/index.html?v=2&mode=b&x=1');
});

test('SdkInitializer applies it to the SERVED binding (the direct link), not to a self-declared app', () => {
  const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'util', 'SdkInitializer.jsx'), 'utf8');
  assert.match(src, /servedBinding\?\.appUrl \? appFrameUrl\(servedBinding\.appUrl, window\.location\)/);
});
