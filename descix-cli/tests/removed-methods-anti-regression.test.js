/**
 * Meta-test: anti-regression guard for removed WorkspaceConfig methods.
 *
 * This test greps the entire descix-cli/lib and descix-cli/bin trees (excluding
 * tests/) for any call to methods that were removed in WS-CLI-V2.1-PURGE.
 * Any non-zero match means a caller of a removed method has been (re-)introduced
 * and the build must fail before it ships.
 *
 * Removed methods guarded:
 *   .getApp(            — removed in PR #7; all call sites migrated in Batch 4
 *   .getCommunity(      — removed in Batch 2
 *   .listCommunities(   — removed in Batch 2
 *   .listApps(          — removed in Batch 2
 *   .unregisterApp(     — removed in Batch 2
 *   .registerCommunity( — removed in Batch 2
 *   .unregisterCommunity( — removed in Batch 2
 *
 * Design: uses Node.js fs + regex scan — no shell exec, no external tools.
 * Operates on absolute paths so it is CI-safe regardless of cwd.
 *
 * Run: `node --test tests/removed-methods-anti-regression.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');

const REMOVED_METHOD_PATTERNS = [
  /\.getApp\(/,
  /\.getCommunity\(/,
  /\.listCommunities\(/,
  /\.listApps\(/,
  /\.unregisterApp\(/,
  /\.registerCommunity\(/,
  /\.unregisterCommunity\(/,
];

/**
 * Recursively collect all .js files under dir, excluding dirs in excludeNames.
 */
async function collectJsFiles(dir, excludeNames = ['tests', 'node_modules']) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (excludeNames.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await collectJsFiles(fullPath, excludeNames);
      files.push(...sub);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Scan files for removed method patterns.
 * Returns array of { file, line, lineNumber, pattern } hits.
 */
async function scanForRemovedMethods(files) {
  const hits = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of REMOVED_METHOD_PATTERNS) {
        if (pattern.test(lines[i])) {
          hits.push({
            file,
            lineNumber: i + 1,
            line: lines[i].trim(),
            pattern: pattern.toString()
          });
        }
      }
    }
  }
  return hits;
}

// ─────────────────────────────────────────────────────────────────────────────

test('removed-methods anti-regression: no removed method calls in lib/ or bin/ (excluding tests/)', async () => {
  const libDir = path.join(CLI_ROOT, 'lib');
  const binDir = path.join(CLI_ROOT, 'bin');

  const libFiles = await collectJsFiles(libDir);
  const binFiles = await collectJsFiles(binDir);
  const allFiles = [...libFiles, ...binFiles];

  const hits = await scanForRemovedMethods(allFiles);

  if (hits.length > 0) {
    const report = hits.map(h =>
      `  ${path.relative(CLI_ROOT, h.file)}:${h.lineNumber} — ${h.line} [pattern: ${h.pattern}]`
    ).join('\n');
    assert.fail(
      `Found ${hits.length} removed-method call(s) in non-test code:\n${report}\n\n` +
      'Each must be migrated to the v2.1 API (getAppByAppId, etc.) before shipping.'
    );
  }

  assert.equal(hits.length, 0, 'Zero removed-method callers expected in lib/ and bin/');
});
