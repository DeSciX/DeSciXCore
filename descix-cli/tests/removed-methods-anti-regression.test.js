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

// Batch 5: scaffold-dir existence anti-regression.
//
// Verifies that Hydrator.copyScaffold() resolves the scaffold template directory to
// a path that ACTUALLY EXISTS at runtime. If the cliRoot path-walk ever drifts back
// to three '..' (or the templates are moved), this test fails before a live CLI error
// surfaces the bug.
//
// Design: calls copyScaffold() against real temp dirs and asserts the output files
// exist. Because copyScaffold() internally resolves the scaffold dir and throws
// "Scaffold template not found: <path>" if it doesn't exist, a failed access means
// the path-walk is broken — the scaffold dir is not where Hydrator thinks it is.
test('scaffold-dir anti-regression: copyScaffold resolves to an existing directory for both types', async (t) => {
  const os = await import('os');

  const siteAppDir = await fs.mkdtemp(path.join(os.default.tmpdir(), 'descix-antireg-site-'));
  const msAppDir = await fs.mkdtemp(path.join(os.default.tmpdir(), 'descix-antireg-ms-'));

  t.after(async () => {
    await fs.rm(siteAppDir, { recursive: true, force: true });
    await fs.rm(msAppDir, { recursive: true, force: true });
  });

  const { copyScaffold } = await import('../lib/core/Hydrator.js');

  // site scaffold
  await assert.doesNotReject(
    () => copyScaffold('site', siteAppDir),
    'copyScaffold("site") must not throw — scaffold dir must exist at the resolved cliRoot path'
  );

  // microservice scaffold
  await assert.doesNotReject(
    () => copyScaffold('microservice', msAppDir),
    'copyScaffold("microservice") must not throw — scaffold dir must exist at the resolved cliRoot path'
  );

  // Confirm at least one expected output file exists for each type
  await assert.doesNotReject(
    () => fs.access(path.join(siteAppDir, 'site', 'app.js')),
    'site/app.js must exist after copyScaffold("site")'
  );
  await assert.doesNotReject(
    () => fs.access(path.join(msAppDir, 'microservice', 'app.js')),
    'microservice/app.js must exist after copyScaffold("microservice")'
  );
});


// ─────────────────────────────────────────────────────────────────────────────
// WS-V1-PURGE Phase 2 — anti-regression guard for purged V1 CLI constructs.
//
// Scans lib/ and bin/ (excluding tests/) for any re-introduction of the V1
// Drive/sync-mode/identifier-leak constructs removed in WS-V1-PURGE Phase 2:
//   - removed CLI commands:  app register-folder, app upload, app upload-tree,
//                            the `folder` group, config set-sync-mode, the
//                            kb create --drive-folder option
//   - removed server-command invocations from the CLI: register_base_folder,
//     upload_files_to_kb, upload_kb_files, get_user_base_folder
//   - V1 identifier leaks:   defaultContext appId 'agent' / communityId 'descix'
//   - deleted modules:       lib/commands/folder.js, lib/commands/app-wizard.js
// ─────────────────────────────────────────────────────────────────────────────

const V1_PURGE_PATTERNS = [
  /\.command\('register-folder'\)/,
  /\.command\('upload-tree'\)/,
  /\.command\('set-sync-mode'\)/,
  /\.command\('folder'\)/,
  /--drive-folder/,
  /invoke\(['"]register_base_folder['"]/,
  /invoke\(['"]upload_files_to_kb['"]/,
  /invoke\(['"]upload_kb_files['"]/,
  /invoke\(['"]get_user_base_folder['"]/,
  /appId:\s*['"]agent['"]/,
  /communityId:\s*['"]descix['"]/,
  /commands\/folder\.js/,
  /commands\/app-wizard\.js/,
];

async function scanForPatterns(files, patterns) {
  const hits = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        if (pattern.test(lines[i])) {
          hits.push({ file, lineNumber: i + 1, line: lines[i].trim(), pattern: pattern.toString() });
        }
      }
    }
  }
  return hits;
}

test('WS-V1-PURGE Phase 2: no purged V1 CLI constructs in lib/ or bin/', async () => {
  const libFiles = await collectJsFiles(path.join(CLI_ROOT, 'lib'));
  const binFiles = await collectJsFiles(path.join(CLI_ROOT, 'bin'));
  const hits = await scanForPatterns([...libFiles, ...binFiles], V1_PURGE_PATTERNS);

  if (hits.length > 0) {
    const report = hits.map(h =>
      `  ${path.relative(CLI_ROOT, h.file)}:${h.lineNumber} — ${h.line} [pattern: ${h.pattern}]`
    ).join('\n');
    assert.fail(`Found ${hits.length} purged V1 construct(s) re-introduced:\n${report}`);
  }
  assert.equal(hits.length, 0, 'Zero purged-V1-construct references expected in lib/ and bin/');
});

test('WS-V1-PURGE Phase 2: deleted CLI modules stay deleted', async () => {
  for (const rel of ['lib/commands/folder.js', 'lib/commands/app-wizard.js']) {
    await assert.rejects(
      () => fs.access(path.join(CLI_ROOT, rel)),
      /ENOENT/,
      `${rel} must remain deleted (WS-V1-PURGE Phase 2)`
    );
  }
});
