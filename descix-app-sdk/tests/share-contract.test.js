/**
 * share.json has ONE owner (src/util/share.js). Its conformance with the edge worker's
 * parseShareJson is tested beside the edge (edge-router test/share-contract-conformance.test.mjs).
 *
 * Run: `node --test tests/share-contract.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHARE_JSON_FILE, SHARE_CONTRACT, parseShareJson, validateShareJson } from '../src/util/share.js';
import * as shareModule from '../src/util/share.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALID = {
  title: 'EGPT',
  description: 'Electronic Graph Paper Theory',
  icon: 'images/share/favicon.ico',
  og_image: 'images/share/share-1200x630.png',
  twitter_card: 'summary',
  apple_touch_icon: 'images/share/icon-180.png',
};

// ── The table ──────────────────────────────────────────────────────────────────────────────

test('SHARE_CONTRACT is frozen, row by row, and names the six fields', () => {
  assert.ok(Object.isFrozen(SHARE_CONTRACT));
  for (const row of SHARE_CONTRACT) assert.ok(Object.isFrozen(row), row.name);
  assert.deepEqual(SHARE_CONTRACT.map((f) => f.name),
    ['title', 'description', 'icon', 'og_image', 'twitter_card', 'apple_touch_icon']);
  assert.deepEqual(SHARE_CONTRACT.filter((f) => f.required).map((f) => f.name), ['title', 'description']);
  assert.equal(SHARE_JSON_FILE, 'share.json');
});

test('no field carries a limit: the edge enforces none (adding one means adding its enforcement and its negative control here)', () => {
  for (const f of SHARE_CONTRACT) assert.equal(f.limit, null, `${f.name} has a limit but share.js enforces none`);
});

// ── Positive ───────────────────────────────────────────────────────────────────────────────

test('POSITIVE: a full share.json parses to the full bag, trimmed', () => {
  const bag = parseShareJson(JSON.stringify({ ...VALID, title: '  EGPT  ' }));
  assert.deepEqual(bag, VALID);
});

test('POSITIVE: a minimal share.json gets every field, absent optionals null, twitter_card defaulted', () => {
  const bag = parseShareJson(JSON.stringify({ title: 'T', description: 'D' }));
  assert.deepEqual(bag, {
    title: 'T', description: 'D', icon: null, og_image: null,
    twitter_card: 'summary_large_image', apple_touch_icon: null,
  });
  assert.deepEqual(Object.keys(bag), SHARE_CONTRACT.map((f) => f.name));
});

test('POSITIVE: an optional field given as JSON null is absent', () => {
  assert.equal(validateShareJson({ title: 'T', description: 'D', icon: null }).icon, null);
});

// ── Negative controls: every rule fails by name ─────────────────────────────────────────────

test('NEGATIVE: not JSON', () => {
  assert.throws(() => parseShareJson('{ title: '), /^Error: share\.json: not valid JSON/);
});

test('NEGATIVE: the top level is not an object (array, string, null, number)', () => {
  for (const [text, got] of [['[]', 'an array'], ['"x"', 'a string'], ['null', 'null'], ['3', 'a number']]) {
    assert.throws(() => parseShareJson(text),
      new RegExp(`share\\.json: the top level must be a JSON object; got ${got}$`), text);
  }
});

for (const f of SHARE_CONTRACT.filter((r) => r.required)) {
  test(`NEGATIVE: ${f.name} missing is refused by name`, () => {
    const obj = { ...VALID }; delete obj[f.name];
    assert.throws(() => validateShareJson(obj), new RegExp(`^Error: share\\.json: ${f.name} is required \\(a non-empty string\\)$`));
  });
  test(`NEGATIVE: ${f.name} null is refused by name`, () => {
    assert.throws(() => validateShareJson({ ...VALID, [f.name]: null }), new RegExp(`share\\.json: ${f.name} is required`));
  });
}

for (const f of SHARE_CONTRACT) {
  test(`NEGATIVE: ${f.name} not a string is refused by name`, () => {
    assert.throws(() => validateShareJson({ ...VALID, [f.name]: 5 }),
      new RegExp(`^Error: share\\.json: ${f.name} must be a string; got a number$`));
    assert.throws(() => validateShareJson({ ...VALID, [f.name]: ['x'] }),
      new RegExp(`share\\.json: ${f.name} must be a string; got an array`));
  });
  test(`NEGATIVE: ${f.name} empty or whitespace is refused by name`, () => {
    for (const v of ['', '   ']) {
      assert.throws(() => validateShareJson({ ...VALID, [f.name]: v }),
        new RegExp(`^Error: share\\.json: ${f.name} is empty; it must be a non-empty string$`), JSON.stringify(v));
    }
  });
}

test('an unknown key is ignored, as the edge ignores it', () => {
  assert.deepEqual(validateShareJson({ ...VALID, extra: 1 }), VALID);
});

test('the module is pure: no Node-only or DOM import', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'util', 'share.js'), 'utf8');
  assert.doesNotMatch(src, /^\s*import\b/m);
  assert.doesNotMatch(src, /\b(require\(|window\.|document\.|process\.)/);
  assert.deepEqual(Object.keys(shareModule).sort(),
    ['SHARE_CONTRACT', 'SHARE_JSON_FILE', 'parseShareJson', 'validateShareJson']);
});

test('the package entry and the ./share subpath both export the contract', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
  assert.equal(pkg.exports['./share'], './src/util/share.js');
  const index = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.match(index, /export \{ SHARE_JSON_FILE, SHARE_CONTRACT, parseShareJson, validateShareJson \} from '\.\/util\/share\.js';/);
});
