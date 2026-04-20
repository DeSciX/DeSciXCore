/**
 * ManifestLoader regression test (M2 — kb-chunker-hardening, 2026-04-20)
 *
 * Run: node tests/manifest-loader.test.mjs
 *
 * Exercises EGPT's actual manifest layout (General.json + site.json) and
 * asserts that loadManifests() returns the KB manifest without crashing on
 * site.json.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../lib/core/ManifestLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS = [];
function test(name, fn) { TESTS.push({ name, fn }); }

function mkTmpApp() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-m2-'));
  const mdir = path.join(root, '.descix', 'manifests');
  fs.mkdirSync(mdir, { recursive: true });
  return { root, mdir };
}

test('app with General.json + site.json loads the KB manifest without error', () => {
  const { root, mdir } = mkTmpApp();
  fs.writeFileSync(path.join(mdir, 'General.json'), JSON.stringify({
    kb_name: 'General',
    sources: [{ path: 'content/' }]
  }));
  fs.writeFileSync(path.join(mdir, 'site.json'), JSON.stringify({
    sources: [{ path: 'site/' }],
    buildCommand: 'npm run build'
  }));

  const list = [];
  return loadManifests(root, root).then(ms => {
    list.push(...ms);
    assert.equal(ms.length, 1, 'expected exactly 1 KB manifest, got ' + ms.length);
    assert.equal(ms[0].kb_name, 'General');
  });
});

test('filterKbName=General returns just General even alongside site.json', () => {
  const { root, mdir } = mkTmpApp();
  fs.writeFileSync(path.join(mdir, 'General.json'), JSON.stringify({
    kb_name: 'General', sources: [{ path: 'kb/General' }]
  }));
  fs.writeFileSync(path.join(mdir, 'site.json'), JSON.stringify({
    sources: [{ path: 'site/' }]
  }));
  return loadManifests(root, root, 'General').then(ms => {
    assert.equal(ms.length, 1);
    assert.equal(ms[0].kb_name, 'General');
  });
});

test('a malformed KB manifest (missing kb_name) is skipped with a warning, not a throw', () => {
  const { root, mdir } = mkTmpApp();
  fs.writeFileSync(path.join(mdir, 'Unknown.json'), JSON.stringify({
    // no kb_name — simulates a future non-KB schema
    sources: [{ path: 'other/' }]
  }));
  fs.writeFileSync(path.join(mdir, 'Real.json'), JSON.stringify({
    kb_name: 'Real', sources: [{ path: 'kb/Real' }]
  }));
  return loadManifests(root, root).then(ms => {
    assert.equal(ms.length, 1);
    assert.equal(ms[0].kb_name, 'Real');
  });
});

test('real EGPT app layout (General.json + site.json) loads General without crash', () => {
  const egptApp = path.resolve(__dirname, '../../../../EGPT');
  const mdir = path.join(egptApp, '.descix', 'manifests');
  if (!fs.existsSync(mdir)) {
    console.log('  [SKIP] EGPT manifests dir not present');
    return;
  }
  return loadManifests(egptApp, path.resolve(__dirname, '../../../..'), 'General').then(ms => {
    assert.equal(ms.length, 1, 'expected 1 General manifest in real EGPT layout');
    assert.equal(ms[0].kb_name, 'General');
  });
});

// ---- Runner ----
(async () => {
  let passed = 0, failed = 0;
  for (const t of TESTS) {
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${t.name}`);
      console.log(`    ${err.message}`);
      failed++;
    }
  }
  console.log(`\n${passed}/${TESTS.length} passed${failed ? `, ${failed} failed` : ''}`);
  process.exit(failed ? 1 : 0);
})();
