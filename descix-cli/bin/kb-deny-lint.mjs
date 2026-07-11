#!/usr/bin/env node
/**
 * kb-deny-lint.mjs — CLI-side runner for the Tier-P KB-publishing deny-class lint.
 *
 * Thin wrapper around the canonical @descix/cli CorpusDenyLint module (the ONE
 * definition of the pattern set + doc_class taxonomy — this runner re-lists
 * nothing). Used by the `.githooks/check_kb_deny_class.sh` pre-commit gate so a
 * Tier-P manifest cannot be committed with a deny-class source, mirroring the
 * sync-path gate in `corpus.js runCorpusSync`.
 *
 * Usage:  node kb-deny-lint.mjs <manifest.json> [<manifest.json> ...]
 * Exit:   0 = clean (Tier-P manifests all pass, or none were Tier-P)
 *         1 = at least one Tier-P manifest has a violation
 *         2 = a manifest could not be read/parsed/validated
 *
 * Only manifests whose `publish_tier === "P"` are gated; others are skipped
 * (current behavior unchanged, matching the sync path).
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { loadManifest } from '../lib/core/ManifestLoader.js';
import { lintManifestForDenyClasses, assertNoViolations } from '../lib/core/CorpusDenyLint.js';

/**
 * Resolve the workspace root for a manifest by walking up to the nearest
 * ancestor containing `.descix/workspace.json` (the same signal WorkspaceConfig
 * uses). Falls back to the filesystem root's process.cwd() if none is found.
 * Manifest source paths are workspace-relative, so this must match the workspace
 * the sync command would resolve.
 */
async function resolveWorkspaceRoot(manifestPath) {
  let dir = path.dirname(path.resolve(manifestPath));
  const { root } = path.parse(dir);
  while (true) {
    try {
      await fs.access(path.join(dir, '.descix', 'workspace.json'));
      return dir;
    } catch { /* keep walking */ }
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  // No workspace.json ancestor — best effort (path/doc_class/license checks still fire).
  return process.cwd();
}

async function main() {
  const manifestPaths = process.argv.slice(2);
  if (manifestPaths.length === 0) {
    console.error('kb-deny-lint: no manifest paths given');
    process.exit(2);
  }

  let anyViolation = false;
  let anyLoadError = false;

  for (const mfPath of manifestPaths) {
    let manifest;
    let workspaceRoot;
    try {
      workspaceRoot = await resolveWorkspaceRoot(mfPath);
      manifest = await loadManifest(mfPath, workspaceRoot);
    } catch (err) {
      // A Tier-P manifest that fails schema validation (e.g. deny-class doc_class,
      // missing doc_class) is itself a hard block — surface it as a violation.
      console.error(`✗ ${mfPath}: ${err.message}`);
      anyLoadError = true;
      continue;
    }

    if (manifest.publish_tier !== 'P') continue; // only Tier-P manifests are gated

    const report = await lintManifestForDenyClasses(manifest, workspaceRoot);
    for (const ex of report.exemptions) console.log(`  ${ex.line}`);
    for (const w of report.warnings) console.log(`  ${w.line}`);
    try {
      assertNoViolations(report);
      console.log(`✓ ${mfPath}: Tier-P deny-class lint clean (${report.exemptions.length} exemption(s), ${report.warnings.length} warning(s)).`);
    } catch (err) {
      console.error(`✗ ${err.message}`);
      anyViolation = true;
    }
  }

  if (anyLoadError) process.exit(2);
  process.exit(anyViolation ? 1 : 0);
}

main().catch(err => {
  console.error(`kb-deny-lint: unexpected error: ${err.message}`);
  process.exit(2);
});
